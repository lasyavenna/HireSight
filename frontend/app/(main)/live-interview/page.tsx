'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CSSProperties } from 'react'

type InterviewMode = 'behavioral' | 'technical' | 'mixed'
type SessionState = 'idle' | 'live' | 'complete'
type InterviewVoiceId = 'rachel' | 'antoni' | 'domi' | 'elli' | 'arnold'
type ResumeRow = {
  raw_text: string | null
  skills: string[] | null
  experience_level: string | null
}

type ResumeLookup = {
  data: ResumeRow | null
  error: { message?: string } | null
  tableName: string
}

type SpeechRecognitionResult = {
  0: { transcript: string }
  isFinal: boolean
}

type SpeechRecognitionEventShape = {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResult
  }
}

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventShape) => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

type Turn = {
  speaker: 'coach' | 'candidate'
  text: string
  at: string
}

type InterviewScore = {
  clarity: number
  depth: number
  impact: number
  wordCount: number
  feedback: string
  strengths: string[]
  improvements: string[]
  betterAnswer: string
  followUpQuestion: string
  source: 'local' | 'gemini'
}

const questionBank: Record<InterviewMode, string[]> = {
  behavioral: [
    'Tell me about yourself and the kind of role you are targeting right now.',
    'Describe a time you handled ambiguity on a project.',
    'Tell me about a conflict you had with a teammate and how you worked through it.',
    'Walk me through a project you are proud of and the impact it had.',
    'Why are you interested in this company or role?',
  ],
  technical: [
    'Walk me through a technical project from your resume and the tradeoffs you made.',
    'How would you design a reliable job-application tracking system?',
    'Explain a bug you investigated recently and how you found the root cause.',
    'What would you consider when choosing between SQL and NoSQL for a product feature?',
    'How do you validate performance and correctness before shipping code?',
  ],
  mixed: [
    'Give me your quick introduction, then connect it to one technical strength.',
    'Tell me about a project where your technical choices affected users or teammates.',
    'How do you prepare when an interview covers both behavioral and coding topics?',
    'Describe a tough technical decision and how you communicated it.',
    'What should I remember about you after this interview?',
  ],
}

const resumeFallback = 'No saved resume found yet. Paste or save a resume in your profile later for stronger personalization.'

const interviewVoices: Array<{
  id: InterviewVoiceId
  name: string
  personality: string
  elevenLabsVoiceId: string
}> = [
  { id: 'rachel', name: 'Rachel', personality: 'calm recruiter', elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM' },
  { id: 'antoni', name: 'Antoni', personality: 'warm mentor', elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV' },
  { id: 'domi', name: 'Domi', personality: 'energetic coach', elevenLabsVoiceId: 'AZnzlk1XvdvUeBnXmlld' },
  { id: 'elli', name: 'Elli', personality: 'friendly peer interviewer', elevenLabsVoiceId: 'MF3mGyEYCl7XYWbV9V6O' },
  { id: 'arnold', name: 'Arnold', personality: 'direct technical interviewer', elevenLabsVoiceId: 'VR6AewLTigWG4xSOukaG' },
]

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const emptyScore: InterviewScore = {
  clarity: 0,
  depth: 0,
  impact: 0,
  wordCount: 0,
  feedback: '',
  strengths: [],
  improvements: [],
  betterAnswer: '',
  followUpQuestion: '',
  source: 'local',
}

function clampScore(score: number) {
  return Math.max(15, Math.min(98, Math.round(score)))
}

function keywordSet(text: string) {
  const stopWords = new Set(['the', 'and', 'for', 'that', 'with', 'you', 'your', 'about', 'this', 'from', 'then', 'they', 'have', 'were', 'what', 'when', 'where', 'would', 'could', 'should'])
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
  )
}

function scoreAnswer(answer: string, question: string, mode: InterviewMode, resumeSignals: string[]): InterviewScore {
  const words = answer.trim().split(/\s+/).filter(Boolean)
  const lower = answer.toLowerCase()
  const uniqueRatio = words.length ? new Set(words.map(word => word.toLowerCase())).size / words.length : 0
  const fillerCount = (lower.match(/\b(um|uh|like|basically|actually|just|sort of|kind of)\b/g) || []).length
  const hasExample = /\b(project|built|created|led|owned|improved|designed|implemented|debugged|launched|shipped|developed)\b/i.test(answer)
  const hasImpact = /\b(result|impact|increased|decreased|reduced|saved|users|customers|team|metric|latency|revenue|percent|%|\d+)\b/i.test(answer)
  const hasStructure = /\b(first|then|because|therefore|finally|after that|challenge|action|result|situation|task|approach|outcome)\b/i.test(answer)
  const hasTradeoff = /\b(tradeoff|trade-off|because|instead|chose|considered|constraint|scale|latency|reliable|security|cost)\b/i.test(answer)
  const hasValidation = /\b(test|tested|validate|validated|measure|measured|monitor|debug|review|feedback|edge case)\b/i.test(answer)
  const hasOwnership = /\b(i built|i led|i designed|i implemented|i decided|my role|i owned|i worked)\b/i.test(answer)
  const resumeMatches = resumeSignals.filter(signal => lower.includes(signal.toLowerCase())).length
  const questionKeywords = keywordSet(question)
  const answerKeywords = keywordSet(answer)
  const questionOverlap = [...questionKeywords].filter(word => answerKeywords.has(word)).length

  const idealLength = words.length >= 55 && words.length <= 170
  const tooShort = words.length < 35
  const tooLong = words.length > 220

  let clarity = 42
  clarity += idealLength ? 18 : tooShort ? -10 : 5
  clarity += hasStructure ? 16 : 0
  clarity += uniqueRatio > 0.62 ? 8 : uniqueRatio < 0.42 ? -8 : 0
  clarity += questionOverlap * 3
  clarity -= fillerCount * 3
  clarity -= tooLong ? 10 : 0

  let depth = 38
  depth += hasExample ? 18 : -6
  depth += hasOwnership ? 12 : 0
  depth += hasTradeoff ? 12 : 0
  depth += hasValidation ? 10 : 0
  depth += Math.min(12, resumeMatches * 5)
  depth += words.length > 90 ? 8 : words.length > 55 ? 4 : 0

  let impact = 34
  impact += hasImpact ? 24 : -4
  impact += /\b\d+[%x]?\b/.test(answer) ? 14 : 0
  impact += /\b(user|customer|team|business|performance|quality|accessibility|reliability)\b/i.test(answer) ? 10 : 0
  impact += hasValidation ? 6 : 0
  impact += mode === 'behavioral' && /\b(learned|changed|improved|resolved|communicated)\b/i.test(answer) ? 8 : 0
  impact += mode === 'technical' && hasTradeoff ? 8 : 0

  const strengths = [
    hasStructure ? 'Clear structure' : '',
    hasExample ? 'Concrete example' : '',
    hasImpact ? 'Impact evidence' : '',
    hasTradeoff ? 'Technical tradeoffs' : '',
    resumeMatches > 0 ? 'Resume alignment' : '',
  ].filter(Boolean)

  const improvements = [
    tooShort ? 'Add more detail' : '',
    !hasExample ? 'Use a specific story or project' : '',
    !hasImpact ? 'Quantify the result' : '',
    !hasStructure ? 'Use situation, action, result structure' : '',
    fillerCount > 2 ? 'Reduce filler words' : '',
    mode !== 'behavioral' && !hasTradeoff ? 'Explain tradeoffs' : '',
  ].filter(Boolean).slice(0, 3)

  const feedback = improvements.length
    ? `Good start. ${improvements[0]}; that will make this answer feel more interview-ready.`
    : 'Strong answer. You gave a clear example, explained your role, and connected it to impact.'

  return {
    clarity: clampScore(clarity),
    depth: clampScore(depth),
    impact: clampScore(impact),
    wordCount: words.length,
    feedback,
    strengths: strengths.slice(0, 3),
    improvements,
    betterAnswer: '',
    followUpQuestion: '',
    source: 'local',
  }
}

async function analyzeWithGemini(
  question: string,
  answer: string,
  mode: InterviewMode,
  resumeContext: string,
  localScore: InterviewScore,
): Promise<InterviewScore | null> {
  try {
    const response = await fetch('/api/interview-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        answer,
        mode,
        resume_context: resumeContext,
        local_score: localScore,
      }),
    })

    if (!response.ok) return null
    const data = await response.json()

    return {
      clarity: Number(data.clarity ?? localScore.clarity),
      depth: Number(data.depth ?? localScore.depth),
      impact: Number(data.impact ?? localScore.impact),
      wordCount: localScore.wordCount,
      feedback: data.feedback || localScore.feedback,
      strengths: Array.isArray(data.strengths) ? data.strengths.slice(0, 3) : localScore.strengths,
      improvements: Array.isArray(data.improvements) ? data.improvements.slice(0, 3) : localScore.improvements,
      betterAnswer: data.better_answer || '',
      followUpQuestion: data.follow_up_question || '',
      source: data.source === 'gemini' ? 'gemini' : 'local',
    }
  } catch {
    return null
  }
}

async function fetchLatestResume(userId: string): Promise<ResumeLookup> {
  for (const tableName of ['resumes', 'resume']) {
    const { data, error } = await supabase
      .from(tableName)
      .select('raw_text, skills, experience_level, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<ResumeRow>()

    if (!error || tableName === 'resume') {
      return { data, error, tableName }
    }
  }

  return { data: null, error: { message: 'Resume table not found' }, tableName: 'resume' }
}

export default function LiveInterviewPage() {
  const [mode, setMode] = useState<InterviewMode>('mixed')
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [resumeStatus, setResumeStatus] = useState('Checking Supabase resume table…')
  const [turns, setTurns] = useState<Turn[]>([])
  const [scores, setScores] = useState<InterviewScore>(emptyScore)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [micStatus, setMicStatus] = useState('Mic is off')
  const [voiceStatus, setVoiceStatus] = useState('Browser voice ready')
  const [selectedVoiceId, setSelectedVoiceId] = useState<InterviewVoiceId>('rachel')
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const committedTranscriptRef = useRef('')

  const questions = questionBank[mode]
  const currentQuestion = questions[questionIndex]
  const averageScore = Math.round((scores.clarity + scores.depth + scores.impact) / 3) || 0
  const selectedVoice = interviewVoices.find(voice => voice.id === selectedVoiceId) ?? interviewVoices[0]

  const resumeSignals = useMemo(() => {
    const text = resumeText.toLowerCase()
    return ['react', 'typescript', 'python', 'supabase', 'sql', 'ai', 'machine learning', 'leadership']
      .filter(skill => text.includes(skill))
      .slice(0, 5)
  }, [resumeText])

  useEffect(() => {
    async function loadResume() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResumeStatus('Sign in to personalize questions with your saved resume.')
        setResumeText('')
        return
      }

      const { data, error, tableName } = await fetchLatestResume(user.id)

      if (error) {
        setResumeStatus('Resume table is reachable, but no usable resume was returned.')
        setResumeText('')
        return
      }

      if (!data) {
        setResumeStatus('No saved resume found in Supabase yet.')
        setResumeText('')
        return
      }

      const skills = Array.isArray(data.skills) ? data.skills.join(', ') : ''
      const combined = [data.raw_text, skills, data.experience_level].filter(Boolean).join('\n')
      setResumeText(combined)
      setResumeStatus(`Using your latest saved resume from Supabase (${tableName}).`)
    }

    loadResume()
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis?.cancel()
    }
  }, [])

  const speakWithBrowserVoice = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve()
    window.speechSynthesis.cancel()
    return new Promise<void>(resolve => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.96
      utterance.pitch = 1
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    })
  }

  const speak = async (text: string) => {
    const cleanText = text.trim()
    if (!cleanText) return

    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis?.cancel()

    try {
      setVoiceStatus(`Generating ${selectedVoice.name} voice`)
      const response = await fetch('/api/interview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice_id: selectedVoice.elevenLabsVoiceId,
        }),
      })

      if (!response.ok) throw new Error('ElevenLabs voice unavailable')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        const cleanup = () => {
          URL.revokeObjectURL(audioUrl)
          if (audioRef.current === audio) audioRef.current = null
        }
        audio.onended = () => {
          cleanup()
          resolve()
        }
        audio.onerror = () => {
          cleanup()
          reject(new Error('Audio playback failed'))
        }
        audio.play().catch(error => {
          cleanup()
          reject(error)
        })
      })

      setVoiceStatus(`${selectedVoice.name} (${selectedVoice.personality})`)
    } catch {
      setVoiceStatus('Browser voice fallback')
      await speakWithBrowserVoice(cleanText)
    }
  }

  const startListening = async () => {
    if (typeof window === 'undefined') return
    const speechWindow = window as SpeechWindow
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMicStatus('Speech recognition is not supported in this browser.')
      return
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
      }
    } catch {
      setMicStatus('Mic permission was not granted. You can still type your answer.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event: SpeechRecognitionEventShape) => {
      let finalTranscript = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim()
        if (!transcript) continue
        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `
        } else {
          interim += `${transcript} `
        }
      }

      if (finalTranscript.trim()) {
        const finalChunk = finalTranscript.trim()
        const normalizedChunk = finalChunk.toLowerCase().replace(/\s+/g, ' ')
        if (!committedTranscriptRef.current.includes(normalizedChunk)) {
          committedTranscriptRef.current = `${committedTranscriptRef.current} ${normalizedChunk}`.trim()
          setAnswer(prev => `${prev}${prev ? ' ' : ''}${finalChunk}`.replace(/\s+/g, ' ').trim())
        }
      }
      setInterimTranscript(interim.trim())
    }
    recognition.start()
    recognitionRef.current = recognition
    setMicStatus('Listening with browser echo cancellation and noise suppression.')
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    mediaStreamRef.current = null
    setInterimTranscript('')
    setMicStatus('Mic is off')
  }

  const beginSession = async () => {
    const opener = currentQuestion
    setSessionState('live')
    setTurns([{ speaker: 'coach', text: opener, at: formatTime() }])
    setMicStatus('Interviewer is speaking. Mic will start after the prompt.')
    await speak(opener)
    await startListening()
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return
    stopListening()
    setAnalysisLoading(true)
    const localScores = scoreAnswer(answer, currentQuestion, mode, resumeSignals)
    setScores(localScores)
    const geminiScores = await analyzeWithGemini(currentQuestion, answer, mode, resumeText, localScores)
    const nextScores = geminiScores ?? localScores
    setScores(nextScores)
    setAnalysisLoading(false)

    const feedback = nextScores.feedback

    const nextTurn: Turn[] = [
      { speaker: 'candidate', text: answer, at: formatTime() },
      { speaker: 'coach', text: feedback, at: formatTime() },
    ]

    if (questionIndex < questions.length - 1) {
      const nextQuestion = questions[questionIndex + 1]
      nextTurn.push({ speaker: 'coach', text: nextQuestion, at: formatTime() })
      setQuestionIndex(questionIndex + 1)
      setAnswer('')
      committedTranscriptRef.current = ''
      setTurns(prev => [...prev, ...nextTurn])
      setMicStatus('Interviewer is speaking. Mic will start after the prompt.')
      await speak(`${feedback} Next question. ${nextQuestion}`)
      await startListening()
    } else {
      setSessionState('complete')
      setTurns(prev => [...prev, ...nextTurn])
      await speak(`${feedback} That completes the practice session.`)
    }
  }

  const resetSession = () => {
    stopListening()
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis?.cancel()
    setSessionState('idle')
    setQuestionIndex(0)
    setAnswer('')
    committedTranscriptRef.current = ''
    setInterimTranscript('')
    setTurns([])
    setScores(emptyScore)
    setAnalysisLoading(false)
  }

  const fieldStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text)',
    fontFamily: 'var(--font)',
    fontSize: '13px',
    padding: '12px 14px',
    outline: 'none',
    lineHeight: 1.6,
  }

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 20px 40px' }}>
      <div className="live-interview-grid">
        <main style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
              Live Interview Practice
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', lineHeight: 1.1, fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
              Practice a realistic interview with instant coaching
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '13px', maxWidth: '620px' }}>
              Voice prompts, speech-to-text notes, resume-aware questions, and quick scoring for clarity, depth, and impact.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '22px', flexWrap: 'wrap' }}>
              {(['mixed', 'behavioral', 'technical'] as InterviewMode[]).map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setMode(option)
                    resetSession()
                  }}
                  style={{
                    border: `1px solid ${mode === option ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
                    background: mode === option ? 'var(--amber-dim)' : 'rgba(255,255,255,0.03)',
                    color: mode === option ? 'var(--amber)' : 'var(--text2)',
                    borderRadius: '8px',
                    padding: '8px 13px',
                    fontFamily: 'var(--font)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="voice-control">
              <label htmlFor="interviewer-voice">Interviewer voice</label>
              <div className="voice-select-shell">
                <select
                  id="interviewer-voice"
                  value={selectedVoiceId}
                  onChange={event => setSelectedVoiceId(event.target.value as InterviewVoiceId)}
                  className="voice-select"
                >
                  {interviewVoices.map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} ({voice.personality})
                    </option>
                  ))}
                </select>
              </div>
              <span className="voice-status">{voiceStatus}</span>
            </div>
          </section>

          <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Question {questionIndex + 1} / {questions.length}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.25 }}>
                  {currentQuestion}
                </h2>
              </div>
              <div style={{
                minWidth: '92px',
                textAlign: 'center',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '10px',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <div style={{ color: averageScore > 72 ? 'var(--green)' : averageScore > 0 ? 'var(--amber)' : 'var(--text3)', fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 900, lineHeight: 1 }}>
                  {averageScore || '--'}
                </div>
                <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '1px', marginTop: '5px' }}>
                  SCORE
                </div>
              </div>
            </div>

            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={8}
              placeholder="Answer here, or use your browser microphone permission for live speech-to-text..."
              style={{ ...fieldStyle, resize: 'vertical', minHeight: '190px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '9px', flexWrap: 'wrap' }}>
              <span style={{ color: micStatus.includes('Listening') ? 'var(--green)' : 'var(--text3)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                {micStatus}
              </span>
              {interimTranscript && (
                <span style={{ color: 'var(--amber)', fontSize: '11px', fontFamily: 'var(--font)', fontStyle: 'italic' }}>
                  Hearing: {interimTranscript}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              {sessionState === 'idle' ? (
                <button onClick={beginSession} style={primaryButtonStyle}>
                  Start live practice
                </button>
              ) : (
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || analysisLoading}
                  style={{
                    ...primaryButtonStyle,
                    opacity: answer.trim() && !analysisLoading ? 1 : 0.45,
                    cursor: answer.trim() && !analysisLoading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {analysisLoading ? 'Analyzing with Gemini…' : 'Submit answer'}
                </button>
              )}
              <button onClick={() => speak(currentQuestion)} style={secondaryButtonStyle}>
                Replay question
              </button>
              <button onClick={resetSession} style={secondaryButtonStyle}>
                Reset
              </button>
            </div>
          </section>

          <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
              Live Transcript
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {turns.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '20px 0' }}>
                  Your questions, answers, and coaching notes will appear here during the session.
                </div>
              ) : turns.map((turn, index) => (
                <div key={`${turn.at}-${index}`} style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  background: turn.speaker === 'coach' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: turn.speaker === 'coach' ? 'var(--amber)' : 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {turn.speaker === 'coach' ? 'Interviewer' : 'You'}
                    </span>
                    <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{turn.at}</span>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.6 }}>{turn.text}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="live-interview-aside">
          <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
              Performance
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: scores.source === 'gemini' ? 'var(--purple)' : 'var(--text3)',
              background: scores.source === 'gemini' ? 'var(--purple-dim)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${scores.source === 'gemini' ? 'rgba(167,139,250,0.25)' : 'var(--border)'}`,
              borderRadius: '999px',
              padding: '4px 9px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: '14px',
            }}>
              {analysisLoading ? 'Gemini thinking' : scores.source === 'gemini' ? 'Gemini analysis' : 'Local rubric'}
            </div>
            {[
              ['Clarity', scores.clarity, 'var(--teal)'],
              ['Depth', scores.depth, 'var(--purple)'],
              ['Impact', scores.impact, 'var(--green)'],
            ].map(([label, value, color]) => (
              <div key={label as string} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text2)', fontSize: '12px', marginBottom: '6px' }}>
                  <span>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{value || '--'}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${value || 0}%`, height: '100%', background: color as string, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}
            {(scores.strengths.length > 0 || scores.improvements.length > 0) && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '14px' }}>
                {scores.strengths.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '7px' }}>
                      Detected Strengths
                    </div>
                    {scores.strengths.map(strength => (
                      <div key={strength} style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '5px' }}>
                        + {strength}
                      </div>
                    ))}
                  </div>
                )}
                {scores.improvements.length > 0 && (
                  <div>
                    <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '7px' }}>
                      Next Adjustment
                    </div>
                    {scores.improvements.map(improvement => (
                      <div key={improvement} style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '5px' }}>
                        - {improvement}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {(scores.betterAnswer || scores.followUpQuestion) && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '14px' }}>
                {scores.betterAnswer && (
                  <div style={{ marginBottom: '13px' }}>
                    <div style={{ color: 'var(--purple)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '7px' }}>
                      Stronger Sample
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: 1.6 }}>
                      {scores.betterAnswer}
                    </p>
                  </div>
                )}
                {scores.followUpQuestion && (
                  <div>
                    <div style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '7px' }}>
                      Follow-Up
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: 1.6 }}>
                      {scores.followUpQuestion}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
              Resume Context
            </div>
            <p style={{ color: resumeText ? 'var(--green)' : 'var(--text3)', fontSize: '12px', marginBottom: '12px' }}>
              {resumeStatus}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'var(--text2)', fontSize: '12px', lineHeight: 1.6, maxHeight: '180px', overflow: 'auto' }}>
              {resumeText || resumeFallback}
            </div>
            {resumeSignals.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                {resumeSignals.map(signal => (
                  <span key={signal} style={{
                    background: 'var(--teal-dim)',
                    color: 'var(--teal)',
                    border: '1px solid rgba(20,184,166,0.25)',
                    borderRadius: '999px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}>
                    {signal}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Practice Checklist
            </div>
            {['Answer with a specific example', 'Name your action clearly', 'Quantify the result when possible', 'Keep the response under two minutes'].map(item => (
              <div key={item} style={{ display: 'flex', gap: '9px', color: 'var(--text2)', fontSize: '12px', marginBottom: '9px' }}>
                <span style={{ color: 'var(--amber)' }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </section>
        </aside>
      </div>

      <style jsx>{`
        .live-interview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) 340px;
          gap: 20px;
          align-items: start;
        }

        .live-interview-aside {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 76px;
        }

        .voice-control {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .voice-control label,
        .voice-status {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .voice-control label {
          color: var(--text3);
        }

        .voice-select-shell {
          position: relative;
          min-width: 250px;
        }

        .voice-select-shell::after {
          content: "";
          position: absolute;
          right: 13px;
          top: 50%;
          width: 7px;
          height: 7px;
          border-right: 2px solid var(--amber);
          border-bottom: 2px solid var(--amber);
          pointer-events: none;
          transform: translateY(-65%) rotate(45deg);
        }

        .voice-select {
          width: 100%;
          appearance: none;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border2);
          border-radius: 8px;
          color: var(--text2);
          cursor: pointer;
          font-family: var(--font);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
          outline: none;
          padding: 10px 34px 10px 12px;
        }

        .voice-select:focus {
          border-color: rgba(245, 158, 11, 0.45);
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.12);
        }

        .voice-status {
          color: var(--teal);
        }

        @media (max-width: 900px) {
          .live-interview-grid {
            grid-template-columns: 1fr;
          }

          .live-interview-aside {
            position: static;
          }

          .voice-select-shell {
            min-width: min(100%, 270px);
          }
        }
      `}</style>
    </div>
  )
}

const primaryButtonStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  color: '#1a0e00',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 18px',
  fontFamily: 'var(--font-display)',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text2)',
  border: '1px solid var(--border2)',
  borderRadius: '10px',
  padding: '12px 15px',
  fontFamily: 'var(--font)',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
}
