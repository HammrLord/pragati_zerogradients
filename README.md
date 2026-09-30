# Pragati

Pragati is a skill-development portal prototype for Smart India Hackathon 2026. It connects local job demand, employer commitments, training capacity and course content so candidates can choose a realistic path to work and planners can see where training needs to change.

This is a demonstration, not a Government of Maharashtra service. All people, employers, vacancies and outcomes shown in the app are synthetic.

## What the prototype covers

| Audience | What they can do | Start here |
| --- | --- | --- |
| Candidates | Build a work profile by conversation, compare local demand and courses, inspect skills to learn, and explore jobs, work trials and prior-learning pathways. | `/dashboard/student` |
| Businesses | Describe a job by conversation, submit demand signals, join hiring pools, review course content and offer idle equipment. | `/dashboard/business` |
| Departmental users | Explore demand, hiring, syllabus, capacity and audit views with role- and district-scoped navigation. | `/gov` |
| Visitors | Browse the course catalogue, labour-market charts, schemes and help pages. | `/` |

The central loop is **signal → skill gap → course and capacity decision → candidate guidance → employer validation**. In the prototype, demand comes from an 18-month generated posting series and sample employer signals. These are separate seed datasets: the screened employer signals do not feed the monthly posting chart. The recommendation and planning calculations run against the sample data, not live government or job-board feeds.

### Example used in the candidate dashboard

Aarav Patil is a fictional on-call assembly helper from Chakan, Pune. He has one year of factory experience and wants to work in EV battery diagnostics. His example shows how a worker's stated skills can be compared with a course syllabus, local posting trends and available training seats. The current Advanced EV Technician intake is full, and the example hiring pool is already in work trials. The dashboard therefore points to a future intake; it does **not** offer Aarav an immediate course seat or job.

The example charts are fixed demo data. Completing the conversational profile saves answers in the browser, but does not recalculate those charts or create a live application.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs without API keys for browsing and typed onboarding. Add the following server-side variables to `.env.local` to enable AI help and speech:

```dotenv
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-20b
SARVAM_API_KEY=your_sarvam_key
```

`GROQ_MODEL` is optional; the value above is the default. Groq supplies short, contextual explanations during onboarding. Sarvam Saaras v3 transcribes recorded answers, and Bulbul v3 reads questions and replies aloud. Browser microphone access is required for recording. The online voice flow supports English, Hindi and Marathi; Urdu voice playback is not available in this flow. API keys stay in server-side route handlers and must not be committed or placed in `NEXT_PUBLIC_` variables.

Voice recordings are sent to Sarvam for transcription, and help questions are sent to Groq. Use fictional details when trying the demo.

## Try the demo

1. At `/login`, enter **Aarav Patil** and the demonstration code **123456**. No SMS is sent.
2. Open **Get started** on the candidate dashboard to answer five short profile questions by typing or speaking.
3. Return to the dashboard to see Aarav's illustrative path, then open **Which trades have jobs** or **Courses for you** for the underlying demand and course views.
4. To see the employer side, register a separate business account at `/register?role=business`. To see planning and audit views, choose a demo role at `/gov` and use the same demonstration code.

The public `/grievance` flow helps prepare a complaint note. Its reference is a demo reference only; it does not submit a formal grievance. The helpline number displayed in the app is part of the prototype content and should not be treated as a tested live support channel.

## Main routes

| Route | Purpose |
| --- | --- |
| `/courses`, `/demand` | Public course catalogue and labour-market views |
| `/register`, `/login` | Conversational citizen registration and demo login |
| `/dashboard/student/onboarding` | Candidate profile conversation |
| `/dashboard/business/onboarding` | Business job-brief conversation |
| `/dashboard/student/demand` | Candidate demand and training-supply detail |
| `/grievance`, `/help` | Complaint draft and help information |
| `/gov` | Departmental role selection and scoped dashboards |

JSON endpoints live under `src/app/api`. The public data routes are `GET /api/demand`, `GET /api/gap`, `GET /api/capacity`, `GET /api/signals` and `GET /api/audit`. The conversation uses `POST /api/onboarding/chat`, `/intake`, `/stt` and `/tts`. The API routes return demo calculations or draft references; they are not a persistent submissions service.

## How it is organised

```text
src/app/                 Pages and API route handlers
src/components/          Shared UI, charts and conversational flows
src/data/                Synthetic districts, skills, courses and employer signals
src/data/compute/        Demand and supply calculations
src/lib/                 Session, permissions, language and onboarding guidance
```

The app uses Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and Recharts. Citizen accounts and completed onboarding answers are stored in the browser's `localStorage`; departmental demo sessions use `sessionStorage`. There is no database, real identity verification, SMS provider, payroll integration or server-side authorization layer in this prototype. The departmental permission system demonstrates scoped UI behaviour, not production security.

For the candidate example, the posting chart is derived from `src/data/jobPostings.ts` and `src/data/compute/demandTrend.ts`. The annual training gap compares the recent monthly posting average multiplied by twelve against seats in `src/data/courses.ts`. The skill bars are illustrative self-report estimates; the course targets correspond to modules in `src/data/syllabus.ts`. Employer commitments and pool status come from `src/data/hiring.ts`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

In environments that prevent Turbopack's CSS worker from opening a local port, use `npm run build:webpack` instead.

The prototype is intended for demonstrations and design review. Before real deployment it would need authenticated server-side authorization, consent and retention controls for voice recordings, validated data feeds, persistent applications and grievances, and independent testing of the labour-market methodology.
