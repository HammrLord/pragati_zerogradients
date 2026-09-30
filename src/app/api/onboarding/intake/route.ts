import { NextRequest, NextResponse } from 'next/server';

const REQUIRED: Record<string, string[]> = {
  candidate: ['qualification', 'targetRole', 'skills', 'experience', 'availability'],
  job: ['jobTitle', 'location', 'skills', 'experience', 'openings', 'salary'],
  grievance: ['issue', 'organisation', 'district', 'when', 'resolution'],
};

export async function POST(request: NextRequest) {
  let body: { kind?: keyof typeof REQUIRED; answers?: Record<string, string> };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }
  if (!body || !body.kind || !body.answers || typeof body.answers !== 'object' || !REQUIRED[body.kind]) return NextResponse.json({ error: 'A valid intake is required.' }, { status: 400 });
  const missing = REQUIRED[body.kind].filter(key => typeof body.answers![key] !== 'string' || !body.answers![key].trim());
  if (missing.length) return NextResponse.json({ error: 'Please complete every question before continuing.', missing }, { status: 400 });
  const prefix = body.kind === 'candidate' ? 'PROFILE' : body.kind === 'job' ? 'JOB' : 'GRV';
  const reference = `${prefix}-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return NextResponse.json({ reference, status: body.kind === 'grievance' ? 'draft-ready' : 'complete' });
}
