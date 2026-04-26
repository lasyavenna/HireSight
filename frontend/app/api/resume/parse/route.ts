import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse/lib/pdf-parse'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function extractSkills(text: string) {
  const knownSkills = [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'Python', 'Flask',
    'Node.js', 'SQL', 'PostgreSQL', 'Supabase', 'AWS', 'Docker',
    'Machine Learning', 'AI', 'REST', 'GraphQL', 'Tailwind',
  ]

  const normalized = text.toLowerCase()
  return knownSkills.filter(skill => normalized.includes(skill.toLowerCase())).slice(0, 12)
}

function inferExperienceLevel(text: string) {
  const normalized = text.toLowerCase()
  if (/\b(intern|student|coursework|university|college)\b/.test(normalized)) return 'student'
  if (/\b(senior|staff|principal|lead)\b/.test(normalized)) return 'senior'
  if (/\b(3\+ years|4\+ years|5\+ years|mid-level|mid level)\b/.test(normalized)) return 'mid'
  return 'junior'
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('resume')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Upload a PDF resume file.' }, { status: 400 })
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF resumes are supported.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Resume PDF must be 5 MB or smaller.' }, { status: 400 })
  }

  try {
    const data = Buffer.from(await file.arrayBuffer())
    const result = await pdfParse(data)
    const text = result.text.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()

    if (text.length < 80) {
      return NextResponse.json(
        { error: 'We could not read enough text from this PDF. Try a text-based resume PDF instead of a scanned image.' },
        { status: 422 },
      )
    }

    return NextResponse.json({
      text,
      word_count: text.split(/\s+/).filter(Boolean).length,
      skills: extractSkills(text),
      experience_level: inferExperienceLevel(text),
      file_name: file.name,
    })
  } catch (error) {
    console.error('Resume PDF parse failed', error)
    return NextResponse.json(
      { error: 'Could not parse this PDF resume. Try exporting it again as a standard PDF.' },
      { status: 422 },
    )
  }
}
