import { NextRequest, NextResponse } from 'next/server';
import { onboardingSystemPrompt, type OnboardingRole } from '@/lib/onboarding';

export const runtime = 'nodejs';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'The onboarding assistant is not configured. Add GROQ_API_KEY to .env.local.' }, { status: 503 });
  }

  let body: { role?: OnboardingRole; topic?: 'onboarding' | 'grievance'; language?: string; messages?: ChatMessage[]; profile?: { name?: string; district?: string } };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }

  if (!body || (body.role !== 'student' && body.role !== 'business') || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'A valid role and conversation are required.' }, { status: 400 });
  }

  const messages = body.messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1600) }));
  if (!messages.some(m => m.role === 'user')) return NextResponse.json({ error: 'Please ask a question first.' }, { status: 400 });

  try {
    const model = process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        // GPT-OSS counts hidden reasoning toward this limit. A low effort and
        // larger cap prevent half a Hindi/Marathi sentence reaching the user.
        ...(model.startsWith('openai/gpt-oss-') ? { reasoning_effort: 'low' } : {}),
        max_completion_tokens: 1024,
        messages: [{ role: 'system', content: onboardingSystemPrompt(body.role, body.profile ?? {}, body.topic, body.language) }, ...messages],
      }),
    });
    if (!response.ok) throw new Error(`Groq returned ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string }; finish_reason?: string }> };
    const message = data.choices?.[0]?.message?.content?.trim();
    if (!message) throw new Error('Groq returned an empty response');
    if (data.choices?.[0]?.finish_reason === 'length') throw new Error('Groq response was truncated');
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Onboarding chat failed:', error);
    return NextResponse.json({ error: 'The onboarding guide is temporarily unavailable. Please try again.' }, { status: 502 });
  }
}
