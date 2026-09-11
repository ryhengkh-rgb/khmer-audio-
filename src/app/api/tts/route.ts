import { NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';
import crypto from 'crypto';
import { chunkKhmerText } from '@/lib/khmerChunker';

import * as googleTTS from 'google-tts-api';

let clientOptions: any = null;
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

    if (style === 'Conversational Warm') {
      if (pitch === 'Normal') effectivePitch += 1.0; 
      effectiveSpeed *= 1.05;
    }

    const audioConfig = {
      audioEncoding: 'MP3' as const,
      speakingRate: effectiveSpeed,
      pitch: effectivePitch,
    };

    const maxChunkSize = useCloudTTS ? 1500 : 200;
    const chunks = chunkKhmerText(text, maxChunkSize);
    
    // We will collect all audio buffers here
    const audioBuffers: Buffer[] = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        if (useCloudTTS && client) {
          const request = {
            input: { text: chunk },
            voice: voiceSettings,
            audioConfig: audioConfig,
          };
          const [response] = await client.synthesizeSpeech(request);
          if (response.audioContent) {
            audioBuffers.push(Buffer.from(response.audioContent as Uint8Array));
          }
        } else {
          // Free fallback using google-tts-api
          const isSlow = effectiveSpeed < 1.0;
          const base64Audio = await googleTTS.getAudioBase64(chunk, {
            lang: 'km',
            slow: isSlow,
            host: 'https://translate.google.com',
            timeout: 10000,
          });
          audioBuffers.push(Buffer.from(base64Audio, 'base64'));
        }
      } catch (ttsError: unknown) {
        console.error(`TTS API Error for chunk ${i}:`, ttsError);
        return NextResponse.json({ error: 'Failed to generate audio from TTS API. Check configuration.' }, { status: 500 });
      }
    }

    if (audioBuffers.length === 0) {
      return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
    }

    // Concatenate all MP3 buffers into a single buffer
    const finalBuffer = Buffer.concat(audioBuffers);
    const base64Audio = finalBuffer.toString('base64');

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
