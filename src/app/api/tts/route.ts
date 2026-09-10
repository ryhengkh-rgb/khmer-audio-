import { NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { chunkKhmerText } from '@/lib/khmerChunker';
import { mergeAudioFiles } from '@/lib/audioMerger';

import * as googleTTS from 'google-tts-api';

let clientOptions: textToSpeech.ClientOptions | null = null;
let useCloudTTS = false;

if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  clientOptions = {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  };
  useCloudTTS = true;
} else if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    clientOptions = { credentials: creds };
    useCloudTTS = true;
  } catch (e) {
    console.error('Failed to parse GOOGLE_CREDENTIALS_JSON');
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  clientOptions = {};
  useCloudTTS = true;
}

const client = useCloudTTS ? new textToSpeech.TextToSpeechClient(clientOptions!) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, voiceName, style, speed = 1.0, pitch = 'Normal' } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Empty text provided' }, { status: 400 });
    }

    // Configure voice
    const voiceSettings = {
      languageCode: 'km-KH',
      name: voiceName || 'km-KH-Standard-A',
    };

    // Calculate effective speed and pitch based on user selections and style
    let effectiveSpeed = parseFloat(speed);
    let effectivePitch = 0; // 0.0 is normal

    if (pitch === 'Lower') effectivePitch = -2.0;
    if (pitch === 'Higher') effectivePitch = 2.0;

    // Apply "Conversational Warm" style adjustments
    // "Speech style: Normal, slightly overlapping pacing. Tone is energetic, conversational, and warm."
    // We approximate "energetic" with a very slight pitch increase (if not already adjusted)
    // and "conversational" with a tiny speed bump to make it flow better.
    if (style === 'Conversational Warm') {
      if (pitch === 'Normal') effectivePitch += 1.0; 
      effectiveSpeed *= 1.05; // 5% faster for connected, slightly overlapping pacing
    }

    const audioConfig = {
      audioEncoding: 'MP3' as const,
      speakingRate: effectiveSpeed,
      pitch: effectivePitch,
    };

    const maxChunkSize = useCloudTTS ? 1500 : 200;
    const chunks = chunkKhmerText(text, maxChunkSize);
    const tempDir = os.tmpdir();
    const sessionId = crypto.randomUUID();
    const tempFiles: string[] = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const tempFilePath = path.join(tempDir, `chunk_${sessionId}_${i}.mp3`);

      try {
        if (useCloudTTS && client) {
          const request = {
            input: { text: chunk },
            voice: voiceSettings,
            audioConfig: audioConfig,
          };
          const [response] = await client.synthesizeSpeech(request);
          if (response.audioContent) {
            fs.writeFileSync(tempFilePath, response.audioContent, 'binary');
            tempFiles.push(tempFilePath);
          }
        } else {
          // Free fallback using google-tts-api
          // Note: The free API does not support voice names, pitch, or speed precisely.
          // It only supports a boolean 'slow' parameter.
          const isSlow = effectiveSpeed < 1.0;
          const base64Audio = await googleTTS.getAudioBase64(chunk, {
            lang: 'km',
            slow: isSlow,
            host: 'https://translate.google.com',
            timeout: 10000,
          });
          const buffer = Buffer.from(base64Audio, 'base64');
          fs.writeFileSync(tempFilePath, buffer);
          tempFiles.push(tempFilePath);
        }
      } catch (ttsError: unknown) {
        console.error(`TTS API Error for chunk ${i}:`, ttsError);
        // Clean up temp files if an error occurs
        tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
        return NextResponse.json({ error: 'Failed to generate audio from TTS API. Check configuration.' }, { status: 500 });
      }
    }

    if (tempFiles.length === 0) {
      return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
    }

    const finalOutputFile = path.join(tempDir, `final_${sessionId}.mp3`);

    // Merge files
    await mergeAudioFiles(tempFiles, finalOutputFile);

    // Read the final file
    const audioBuffer = fs.readFileSync(finalOutputFile);
    const base64Audio = audioBuffer.toString('base64');

    // Clean up
    tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
    if (fs.existsSync(finalOutputFile)) fs.unlinkSync(finalOutputFile);

    return NextResponse.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/mpeg'
    });

  } catch (error: unknown) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error processing audio' }, { status: 500 });
  }
}
