// Popup script for Ghost Job Exposé extension

const SUPPORTED_PATTERNS = [
  /linkedin\.com\/jobs\/view\//,
  /indeed\.com\/viewjob/,
  /boards\.greenhouse\.io\/.+\/jobs\//,
  /jobs\.lever\.co\/.+\/.+/,
  /jobs\.ashbyhq\.com\/.+\/.+/,
  /myworkdayjobs\.com\/.+\/job\//,
  /wellfound\.com\/jobs\//,
  /angel\.co\/jobs\//,
];

function isSupported(url) {
  return SUPPORTED_PATTERNS.some(p => p.test(url));
}

// ─── Render result card ────────────────────────────────────────────────────

const REC_COLORS = {
  "Apply":        "#16a34a",
  "Network First":"#d97706",
  "Low Priority": "#9333ea",
  "Skip":         "#dc2626",
};
const REC_ICONS = {
  "Apply": "✅", "Network First": "🤝", "Low Priority": "⚠️", "Skip": "🚫",
};

function scoreColor(p) {
  if (p >= 72) return "#4ade80";
  if (p >= 52) return "#fbbf24";
  if (p >= 35) return "#fb923c";
  return "#f87171";
}

function renderResult(result, container) {
  const p = result.realHireProbability;
  const col = scoreColor(p);
  const recColor = REC_COLORS[result.recommendation] || "#dc2626";
  const recIcon = REC_ICONS[result.recommendation] || "🚫";

  const signalsHTML = result.signals.map(s => `
    <div class="signal-row">
      <span class="signal-icon">${s.type === "positive" ? "✅" : "❌"}</span>
      <span class="signal-label">${s.label}</span>
      <span class="signal-impact" style="color:${s.type === "positive" ? "#4ade80" : "#f87171"}">${s.impact}</span>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="score-row">
      <span class="score-label">Real-Hire Probability</span>
      <span class="score-val" style="color:${col}">${p}<span style="font-size:14px;">%</span></span>
    </div>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,p)}%;background:${col};"></div></div>
    <div class="bar-sub">
      <span>Ghost Risk: ${result.ghostRisk}%</span>
      <span>Confidence: ${result.confidence}%</span>
    </div>
    <div class="rec-badge" style="background:${recColor}22;border:1px solid ${recColor}55;">
      <div class="rec-label" style="color:${recColor}">${recIcon} ${result.recommendation.toUpperCase()}</div>
      <div class="rec-summary">${result.summary}</div>
    </div>
    <div class="signals-title">Signals (${result.signals.length})</div>
    ${signalsHTML}
  `;
}

// ─── Tabs ──────────────────────────────────────────────────────────────────

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.getElementById("tab-page").style.display = tab === "page" ? "block" : "none";
    document.getElementById("tab-manual").style.display = tab === "manual" ? "block" : "none";
    document.getElementById("tab-settings").style.display = tab === "settings" ? "block" : "none";
  });
});

// ─── This Page tab ─────────────────────────────────────────────────────────

async function initPageTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const statusEl = document.getElementById("page-status");
  const btnAnalyze = document.getElementById("btn-analyze-page");
  const resultEl = document.getElementById("page-result");

  if (!tab || !tab.url) {
    statusEl.textContent = "Cannot access this tab.";
    return;
  }

  if (!isSupported(tab.url)) {
    statusEl.innerHTML = `<strong style="color:#f87171;">Not a supported job page.</strong><br><span style="font-size:10px;color:#64748b;">Works on LinkedIn, Indeed, Greenhouse, Lever, Workday, and Ashby.</span>`;
    return;
  }

  statusEl.innerHTML = `<span style="color:#4ade80;">✓ Supported site detected</span>`;
  btnAnalyze.disabled = false;

  // Check if there's a cached result for this URL
  const { lastResult, lastUrl } = await chrome.storage.local.get(["lastResult", "lastUrl"]);
  if (lastResult && lastUrl === tab.url) {
    renderResult(lastResult, resultEl);
    btnAnalyze.textContent = "Re-Analyze";
  }

  btnAnalyze.addEventListener("click", async () => {
    btnAnalyze.disabled = true;
    btnAnalyze.textContent = "Analyzing…";
    resultEl.innerHTML = "";

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_TEXT" });
      if (!response || !response.text) {
        statusEl.innerHTML = `<span style="color:#f87171;">Could not extract job description. Try scrolling the page first.</span>`;
        btnAnalyze.disabled = false;
        btnAnalyze.textContent = "Retry";
        return;
      }

      let result = runAnalysis(response.text);
      result.analysisMode = "rule-based";

      // Try AI if API URL is configured
      try {
        const { apiUrl } = await chrome.storage.local.get("apiUrl");
        if (apiUrl) {
          const res = await fetch(`${apiUrl}/api/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobDescription: response.text, jobUrl: tab.url }),
          });
          if (res.ok) {
            const aiData = await res.json();
            if (!aiData.error) result = { ...result, ...aiData };
          }
        }
      } catch (_) {}

      renderResult(result, resultEl);
      chrome.storage.local.set({ lastResult: result, lastUrl: tab.url });
      btnAnalyze.textContent = "Re-Analyze";
    } catch (err) {
      statusEl.innerHTML = `<span style="color:#f87171;">Error: could not communicate with the page. Try refreshing.</span>`;
      btnAnalyze.textContent = "Retry";
    }

    btnAnalyze.disabled = false;
  });
}

// ─── Manual tab ────────────────────────────────────────────────────────────

document.getElementById("btn-analyze-manual").addEventListener("click", () => {
  const text = document.getElementById("manual-text").value.trim();
  if (!text) return;
  const result = runAnalysis(text);
  result.analysisMode = "rule-based";
  renderResult(result, document.getElementById("manual-result"));
});

// ─── Settings tab ─────────────────────────────────────────────────────────

async function initSettings() {
  const { apiUrl } = await chrome.storage.local.get("apiUrl");
  if (apiUrl) document.getElementById("api-url").value = apiUrl;
}

document.getElementById("btn-save-settings").addEventListener("click", async () => {
  const url = document.getElementById("api-url").value.trim().replace(/\/$/, "");
  await chrome.storage.local.set({ apiUrl: url });
  const msg = document.getElementById("save-msg");
  msg.style.display = "block";
  setTimeout(() => { msg.style.display = "none"; }, 2000);
});

// ─── Boot ──────────────────────────────────────────────────────────────────

initPageTab();
initSettings();
