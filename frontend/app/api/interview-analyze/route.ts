import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const flaskUrl = (process.env.FLASK_API_URL || 'http://127.0.0.1:5000')
    .replace('http://localhost:5000', 'http://127.0.0.1:5000')

  try {
    const response = await fetch(`${flaskUrl}/api/interview-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 })
  }
}
