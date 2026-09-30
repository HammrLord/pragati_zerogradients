import { NextRequest, NextResponse } from 'next/server';
import { ONBOARDING_LANGUAGES } from '@/lib/onboarding';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Voice input is not configured. Add SARVAM_API_KEY to .env.local.' }, { status: 503 });

  const form = await request.formData();
  const audio = form.get('audio');
  const language = String(form.get('language') ?? 'en');
  if (!(audio instanceof File)) return NextResponse.json({ error: 'An audio recording is required.' }, { status: 400 });
  if (audio.size < 1024) return NextResponse.json({ error: 'No speech was captured. Please speak for a moment before stopping the recording.' }, { status: 400 });
  if (audio.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Please keep recordings under 10 MB.' }, { status: 413 });

  // MediaRecorder reports values such as "audio/webm;codecs=opus". Sarvam
  // accepts the WebM container, but its multipart validator requires the
  // plain "audio/webm" MIME type. Keep the bytes intact and normalize only
  // the multipart file metadata.
  const mediaType = audio.type.split(';', 1)[0].trim().toLowerCase();
  const extensionByType: Record<string, string> = {
    'audio/webm': 'webm', 'video/webm': 'webm',
    'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
    'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
  };
  const extension = extensionByType[mediaType];
  if (!extension) return NextResponse.json({ error: 'This browser recorded an unsupported audio format. Please use Chrome or type your answer.' }, { status: 415 });

  const upstream = new FormData();
  upstream.append('file', new File([audio], `onboarding.${extension}`, { type: mediaType }));
  upstream.append('model', 'saaras:v3');
  upstream.append('mode', 'transcribe');
  upstream.append('language_code', ONBOARDING_LANGUAGES[language] ?? 'en-IN');
  try {
    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST', headers: { 'api-subscription-key': apiKey }, body: upstream,
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      console.error(`Sarvam STT returned ${response.status}: ${detail}`);
      return NextResponse.json({ error: 'Sarvam could not read this recording. Please speak for at least one second, then try again.' }, { status: 502 });
    }
    const data = await response.json() as { transcript?: string };
    return NextResponse.json({ transcript: data.transcript ?? '' });
  } catch (error) {
    console.error('Sarvam STT failed:', error);
    return NextResponse.json({ error: 'Voice input is temporarily unavailable. You can type your question instead.' }, { status: 502 });
  }
}
