import { NextRequest, NextResponse } from 'next/server';
import { ONBOARDING_LANGUAGES } from '@/lib/onboarding';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Voice playback is not configured. Add SARVAM_API_KEY to .env.local.' }, { status: 503 });
  let body: { text?: string; language?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 2400) : '';
  if (!text) return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
  // Bulbul v3 does not offer Urdu speech. Never silently synthesize it in a
  // different language, which would be particularly confusing in a voice UI.
  if (body.language === 'ur') return NextResponse.json({ error: 'Urdu voice playback is not available yet. Please use the helpline or choose Marathi, Hindi or English.' }, { status: 422 });

  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'api-subscription-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language_code: ONBOARDING_LANGUAGES[body.language ?? 'en'] ?? 'en-IN', model: 'bulbul:v3', speaker: 'shubh', output_audio_codec: 'wav', pace: 0.9 }),
    });
    if (!response.ok) {
      console.error(`Sarvam TTS returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
      return NextResponse.json({ error: 'Voice playback is temporarily unavailable. You can still read the question and continue.' }, { status: 502 });
    }
    const data = await response.json() as { audios?: string[] };
    const audio = data.audios?.[0];
    if (!audio) throw new Error('Sarvam returned no audio');
    return NextResponse.json({ audio });
  } catch (error) {
    console.error('Sarvam TTS failed:', error);
    return NextResponse.json({ error: 'Voice playback is temporarily unavailable.' }, { status: 502 });
  }
}
