# HireSight

## Inspiration

All three of us combined applied to over **800 internships** in just the past few months.

We spent hours preparing, tailoring resumes, and practicing interviews… only to get no response back.

Not because we weren't qualified.
Not because someone else was chosen.

But because sometimes… **the job didn't even exist**.

That's when we realized the real problem wasn't effort — it was visibility.

All the information we needed *did exist*, but it was scattered across Reddit, Discord, and word of mouth. There was no clear way to understand what was actually happening in the hiring process.

---

## What It Does

HireSight is a **real-time career intelligence platform** that helps users make smarter decisions before applying.

### Interview Intelligence
Enter a company and role to instantly see:
- Real interview processes
- Commonly asked technical questions
- Timelines and recruiter patterns
- A built-in mock interview bot

### Resume + Job Analyzer
Upload your resume and get:
- Job alignment insights
- Skill gap analysis
- **Ghost job detection**

We help answer: **Is this opportunity worth my time?**

### Community Signal Feed
At the core of HireSight is a **live forum** where users share:
- OA difficulty
- Interview experiences
- Recruiter timelines
- Hiring signals in real time

We then use AI to summarize everything into clear, actionable advice.

---

## How We Built It

| Layer | Stack |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL + Auth) |
| AI | LLM-based analysis (Gemma / API integration) |
| Deployment | Vercel + DigitalOcean |

We designed the system around a single principle:

> Users generate real-world signals. AI transforms those signals into decisions.

---

## Challenges We Faced

**Deployment issues**
Build failures due to incorrect directories, missing dependencies, and environment variable misconfiguration cost us significant time and taught us to treat deployment as a first-class concern, not an afterthought.

**Time vs. scope**
We had bigger ideas but had to make hard cuts to deliver a strong MVP. Scoping down hurt, but shipping something real mattered more.

**Making AI actually useful**
The hardest part wasn't integrating the AI — it was making sure outputs were specific and actionable rather than generic. We iterated on prompts and structure until the results felt genuinely helpful.

---

## What We Learned

- Shipping a working product beats over-engineering every time
- Most hard problems are about **organizing existing information**, not creating new information
- UX determines whether users trust your system — a good idea with bad UX gets ignored
- Debugging deployment teaches more than writing code sometimes

---

## What's Next

- Improve AI accuracy with more real user data
- Add personalization: skill tracking, tailored recommendations
- Build recruiter-facing insights
- Expand beyond internships into full-time roles

---

## Closing

With HireSight, users know what to expect, what to prepare for, and whether an opportunity is even worth their time.

**We've already played the game 800 times — this just lets you win faster.**
