export default function LoadingState() {
  const steps = [
    { icon: "🔍", text: "Scanning job description…" },
    { icon: "🧠", text: "Extracting key signals…" },
    { icon: "📊", text: "Calculating ghost risk score…" },
    { icon: "✨", text: "Generating recommendation…" },
  ];

  return (
    <div className="flex flex-col items-center py-14 gap-8">
      {/* Layered spinner with ghost */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
        <div
          className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-400 animate-spin"
          style={{ animationDuration: "0.7s", animationDirection: "reverse" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">👻</div>
      </div>

      <div className="text-center">
        <h3 className="text-white font-bold text-xl mb-1">Analyzing Job Signals</h3>
        <p className="text-slate-500 text-sm">Usually takes 2–5 seconds</p>
      </div>

      {/* Step list — each fades in with a stagger */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-sm text-slate-400 animate-fade-in"
            style={{ animationDelay: `${i * 350}ms` }}
          >
            <span>{step.icon}</span>
            <span className="flex-1">{step.text}</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((j) => (
                <span
                  key={j}
                  className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: `${i * 200 + j * 100}ms` }}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
