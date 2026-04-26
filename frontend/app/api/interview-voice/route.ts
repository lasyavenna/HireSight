import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
const MAX_SPOKEN_CHARACTERS = 1400

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key is not configured.' }, { status: 503 })
  }

  let body: { text?: unknown; voice_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid voice request.' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
  }

  const voiceId = typeof body.voice_id === 'string' && body.voice_id.trim()
    ? body.voice_id.trim()
    : DEFAULT_VOICE_ID

  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text.slice(0, MAX_SPOKEN_CHARACTERS),
      model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.78,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    return NextResponse.json(
      {
        error: 'ElevenLabs voice request failed.',
        detail: detail.slice(0, 400),
      },
      { status: response.status }
    )
  }

  const audio = await response.arrayBuffer()
  return new NextResponse(audio, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'audio/mpeg',
    },
  })
}
