'use client';

import React, { useState, useRef } from 'react';
import { Play, Download, Settings, Loader2, Volume2, AudioLines } from 'lucide-react';

const VOICES = [
  { id: 'km-KH-Standard-A', name: 'Khmer Female 1 (Standard-A)' },
  { id: 'km-KH-Standard-B', name: 'Khmer Male 1 (Standard-B)' },
  { id: 'km-KH-Standard-C', name: 'Khmer Female 2 (Standard-C)' },
  { id: 'km-KH-Standard-D', name: 'Khmer Male 2 (Standard-D)' },
];

const STYLES = [
  'Conversational Warm',
  'Normal',
  'Calm',
  'Energetic',
  'Professional',
  'Educational',
  'Podcast',
  'Storytelling',
  'Motivational'
];

const SPEEDS = [
  { value: '0.75', label: '0.75x — Slow' },
  { value: '0.9', label: '0.9x — Slightly Slow' },
  { value: '1.0', label: '1.0x — Normal' },
  { value: '1.1', label: '1.1x — Slightly Fast' },
  { value: '1.25', label: '1.25x — Fast' },
];

const PITCHES = ['Normal', 'Lower', 'Higher'];

export default function Home() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(VOICES[0].id);
  const [style, setStyle] = useState('Conversational Warm');
  const [speed, setSpeed] = useState('1.0');
  const [pitch, setPitch] = useState('Normal');
  const [pauseControl, setPauseControl] = useState('Natural');

  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Set default placeholder for initial load
  const placeholderText = 'សួស្តី! សូមស្វាគមន៍មកកាន់កម្មវិធីបង្កើតសំឡេងភាសាខ្មែរ។ សូមបញ្ចូលអត្ថបទដែលអ្នកចង់បម្លែងទៅជាសំឡេង។';

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some Khmer text to generate audio.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voiceName: voice,
          style,
          speed,
          pitch,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'We couldn\'t generate the Khmer audio. Please check your configuration and try again.');
      }

      if (data.audioBase64) {
        const url = `data:${data.mimeType};base64,${data.audioBase64}`;
        setAudioUrl(url);
      } else {
        throw new Error('No audio returned from server.');
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'We couldn\'t generate the Khmer audio. Please check your configuration and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    
    // Generate filename based on date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const filename = `khmer-voice-${year}${month}${day}-${hours}${minutes}${seconds}.mp3`;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const charCount = text.length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md">
            <Volume2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Khmer Voice Generator</h1>
            <p className="text-gray-500 text-sm mt-0.5">Turn Khmer text into clear, natural speech.</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Text Area */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1 flex flex-col focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <div className="p-3 pb-0">
              <label htmlFor="khmer-text" className="font-semibold text-gray-700 text-sm flex justify-between items-center">
                <span>Enter Khmer Text</span>
                <span className="text-gray-400 font-normal text-xs bg-gray-100 px-2 py-1 rounded-md">Supports long paragraphs</span>
              </label>
            </div>
            <textarea
              id="khmer-text"
              className="w-full min-h-[350px] p-4 text-base md:text-lg text-gray-800 leading-relaxed resize-y focus:outline-none bg-transparent"
              placeholder={placeholderText}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="bg-gray-50 px-4 py-3 rounded-b-xl border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
              <span className="font-medium">Characters: {charCount}</span>
              {charCount > 1500 && (
                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs">
                  Long text will automatically be divided into sections and combined into one audio file.
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm flex items-start gap-3 shadow-sm">
              <span className="font-bold shrink-0">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Audio Player Result */}
          {audioUrl && (
            <div className="bg-white rounded-2xl shadow-md border border-green-100 p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-700 p-2 rounded-full">
                  <AudioLines size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Your Audio is Ready</h2>
              </div>
              
              <audio 
                ref={audioRef} 
                controls 
                src={audioUrl} 
                className="w-full h-12 outline-none rounded-lg"
              />

              <button
                onClick={handleDownload}
                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium shadow-md transition-all flex justify-center items-center gap-2 active:scale-[0.99]"
              >
                <Download size={18} />
                Download Audio (MP3)
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Settings */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Settings size={18} className="text-gray-400" />
              Settings
            </h2>

            <div className="space-y-5">
              {/* Voice */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Voice</label>
                <div className="relative">
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Speech Style</label>
                <div className="relative">
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  >
                    {STYLES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                {style === 'Conversational Warm' && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mt-2 border border-blue-100 leading-relaxed">
                    <span className="font-semibold block mb-1">Style Active:</span>
                    Normal, slightly overlapping pacing. Tone is energetic, conversational, and warm.
                  </p>
                )}
              </div>

              {/* Speed */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Speaking Speed</label>
                <div className="relative">
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  >
                    {SPEEDS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Pitch */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Pitch</label>
                <div className="relative">
                  <select
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  >
                    {PITCHES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Pause Between Sentences (Visual Mockup as requested) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Pause Between Sentences</label>
                <div className="relative">
                  <select
                    value={pauseControl}
                    onChange={(e) => setPauseControl(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  >
                    <option value="Tight">Tight</option>
                    <option value="Natural">Natural</option>
                    <option value="Relaxed">Relaxed</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Generating Khmer audio...
              </>
            ) : (
              <>
                <Play size={24} className="fill-white" />
                Generate Audio
              </>
            )}
          </button>
        </div>
        
      </main>
    </div>
  );
}
