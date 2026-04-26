# HireSight Frontend

HireSight is a Next.js frontend for applicant intelligence, job-post analysis, and live interview practice.

## Getting Started

Run the development server:

```bash
npm run dev
```

Then open the local app in your browser:

```bash
http://localhost:3002/live-interview
```

The live interview page uses the Flask backend for Gemini-powered interview feedback. Start the backend from `../backend`:

```bash
PYTHONPYCACHEPREFIX=/tmp/hiresight-pycache python3 run.py
```

## Environment

The frontend reads Supabase, backend connection, and ElevenLabs text-to-speech settings from `.env.local`.

```bash
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

The backend reads `GEMINI_API_KEY` from `backend/.env`.
