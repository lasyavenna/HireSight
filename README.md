# HireSight

## Inspiration

All three of us combined applied to over **800 internships** in just the past few months.
We spent hours preparing, tailoring resumes, and practicing interviews… only to get no response back.

47% of the time, it’s because the **job never existed** in the first place.

That's when we realized the real problem wasn't effort. It was **visibility**.

Today’s job search is very complicated.

We as students and graduates don’t know what the interview process actually looks like, whether a job is even active, or how to prepare effectively.
All the real information exists…. but it’s scattered across Reddit, Discord, and word of mouth.

---

## What It Does

HireSight is a **real-time career intelligence platform** that helps users make smarter decisions before applying.

### 🟡 Demo Path
A guided, end-to-end candidate journey:
- Create an account  
- Upload a resume  
- Analyze a job posting  
- Practice an interview  

### 🔍 Job Analyzer
Paste a job description or link to:
- detect ghost job risk  
- analyze role quality  
- match against your resume  
- generate AI-powered insights  

### 🎤 Live Interview
Practice interviews with:
- voice-based AI mock interviews powered by **ElevenLabs**
- live AI mock interview bot coaching with instant feedback and structured performance scoring (clarity, depth, impact)
- real questions (behavioral + technical)  
- resume-aware prompts  

### 🌐 Community Feed
A live applicant intelligence network:
- real interview experiences  
- OA difficulty + timelines  
- recruiter behavior  
- AI summaries of hiring signals 

### 🧭 Career Roadmap
Enter a target company and role to get a personalized roadmap:
- key skills to develop  
- recommended projects  
- learning resources  
- step-by-step preparation plan  

HireSight doesn’t just help you apply, it helps you plan your path.

We help answer: **Is this opportunity worth my time?**

---

## How We Built It

| Layer | Stack |
|---|---|
| Frontend | Next.js (React 19), Tailwind CSS v4, TypeScript, Radix UI, Lucide React |
| Backend & Database | Python, PostgreSQL |
| AI Layer | LLM-based analysis (Gemini / API integration), **ElevenLabs (voice AI)** |
| Deployment | **DigitalOcean** |

---

## Challenges We Faced

**Deployment issues**
Build failures due to incorrect directories, missing dependencies, and environment variable misconfiguration cost us significant time and taught us to treat deployment as a first-class concern, not an afterthought.

**Time vs. scope**
We had bigger ideas but had to make hard cuts to deliver a strong MVP. Scoping down hurt, but shipping something real mattered more.

**Making AI actually useful**
The hardest part wasn't integrating the AI, it was making sure outputs were specific and actionable rather than generic. We iterated on prompts and structure until the results felt genuinely helpful.

---

## What We Learned

- Shipping a working product beats over-engineering every time
- Most hard problems are about **organizing existing information**, not creating new information
- UX determines whether users trust your system and a good idea with bad UX gets ignored
- Debugging deployment teaches more than writing code sometimes

---

## What's Next

- Improve AI accuracy with more real user data
- Connecting with other job application sites to sync job listings on our site
- Monetization of the site

---

## Closing

With HireSight, users know what to expect, what to prepare for, and whether an opportunity is even worth their time.

**We've already played the game 800 times, this just lets you win faster.**
