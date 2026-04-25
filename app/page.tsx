import GhostJobAnalyzer from "@/components/GhostJobAnalyzer";

const STATS = [
  { value: "47%", label: "of jobs are ghost postings" },
  { value: "3.2 hrs", label: "wasted per ghost application" },
  { value: "12+", label: "signals analyzed per posting" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "📋",
    title: "Paste the Job",
    desc: "Copy any job description from LinkedIn, Indeed, Greenhouse, or a company careers page and paste it directly.",
  },
  {
    step: "02",
    icon: "🤖",
    title: "AI + Rule Analysis",
    desc: "A hybrid engine checks salary transparency, requirement realism, urgency signals, team specifics, and 8+ more indicators.",
  },
  {
    step: "03",
    icon: "📊",
    title: "Get Your Score",
    desc: "Receive a posting legitimacy score, ghost risk %, signal-by-signal breakdown, and a clear go/no-go recommendation.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="border-b border-slate-800/60 px-6 py-4 sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👻</span>
            <span className="font-black text-white text-lg tracking-tight">
              Ghost Job <span className="text-violet-400">Exposé</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3 py-1 rounded-full font-semibold tracking-wide">
              BETA
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white text-sm transition-colors font-medium"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-[500px] h-[500px] bg-violet-700/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -top-24 right-1/4 w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-gradient-to-b from-transparent via-violet-500/5 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 text-violet-300 text-sm font-semibold mb-8">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            AI-Powered Ghost Job Detection
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
            Is That Job
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400">
              Actually Real?
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-14 leading-relaxed">
            Nearly half of all job postings are{" "}
            <span className="text-slate-200 font-semibold">ghost jobs</span> — roles companies
            publish with no intent to hire. Stop wasting hours on applications that go nowhere.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-10 mb-8">
            {STATS.map((s) => (
              <div key={s.value} className="text-center">
                <div className="text-4xl font-black text-white">{s.value}</div>
                <div className="text-slate-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Analyzer ────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-28" id="analyze">
        <GhostJobAnalyzer />
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="border-t border-slate-800/60 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              We analyze 12+ signals that separate active hires from ghost postings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-xs font-bold text-violet-500 tracking-[0.2em] uppercase">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-violet-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signal list ─────────────────────────────────────── */}
      <section className="border-t border-slate-800/60 py-20 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-black text-white mb-3">
            What We Detect
          </h2>
          <p className="text-slate-400 mb-10">
            Every analysis checks these signals — positive and negative
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              "Salary Range",
              "Team Structure",
              "Interview Process",
              "Tech Stack Specificity",
              "Buzzword Ratio",
              "Urgency Signals",
              "Description Length",
              "Benefits Detail",
              "Unrealistic Requirements",
              "Boilerplate Ratio",
              "Responsibility Depth",
              "Vague Role Titles",
            ].map((tag) => (
              <span
                key={tag}
                className="bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm px-3.5 py-1.5 rounded-full font-medium hover:border-violet-500/40 hover:text-violet-300 transition-all cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 py-10 text-center text-slate-600 text-sm">
        <p className="mb-1">
          <span className="text-white font-semibold">Ghost Job Exposé</span> · Built for job
          seekers, by job seekers
        </p>
        <p>Hackathon Project 2026 · No data stored · No login required</p>
      </footer>
    </div>
  );
}
