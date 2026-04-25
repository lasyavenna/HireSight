// Ghost Job Exposé — content script
// Runs on job posting pages, extracts description, injects analysis panel.

const PANEL_ID = "ghost-job-expose-root";

// ─── Site-specific job description extractors ──────────────────────────────

const EXTRACTORS = [
  {
    name: "LinkedIn",
    test: () => location.hostname.includes("linkedin.com"),
    extract: () => {
      // Try known stable selectors first
      const candidates = [
        document.querySelector(".jobs-description__content"),
        document.querySelector(".jobs-box__html-content"),
        document.querySelector(".jobs-description-content__text"),
        document.querySelector('[class*="jobs-description"]'),
        document.querySelector('[class*="job-description"]'),
        // Newer LinkedIn layout uses article elements
        document.querySelector("article.jobs-description__container"),
        document.querySelector(".job-details-module"),
        // Generic fallback: find div with most text under main content
        ...Array.from(document.querySelectorAll(
          ".scaffold-layout__main div, main div, [role='main'] div"
        )).filter(el => el.innerText && el.innerText.length > 300),
      ].filter(Boolean);

      if (candidates.length === 0) return null;
      // Pick the element with the most text content
      const best = candidates.reduce((a, b) =>
        (a.innerText || "").length > (b.innerText || "").length ? a : b
      );
      return best.innerText || null;
    },
    company: () => {
      const el =
        document.querySelector(".job-details-jobs-unified-top-card__company-name a") ||
        document.querySelector(".jobs-unified-top-card__company-name a") ||
        document.querySelector('[class*="company-name"]') ||
        document.querySelector('[data-tracking-control-name*="company"] span');
      return el ? el.innerText.trim() : null;
    },
  },
  {
    name: "Indeed",
    test: () => location.hostname.includes("indeed.com"),
    extract: () => {
      const el =
        document.querySelector("#jobDescriptionText") ||
        document.querySelector(".jobsearch-jobDescriptionText") ||
        document.querySelector('[data-testid="jobDescription"]');
      return el ? el.innerText : null;
    },
    company: () => {
      const el =
        document.querySelector('[data-testid="inlineHeader-companyName"]') ||
        document.querySelector(".jobsearch-CompanyInfoContainer a");
      return el ? el.innerText.trim() : null;
    },
  },
  {
    name: "Greenhouse",
    test: () => location.hostname.includes("greenhouse.io"),
    extract: () => {
      const el =
        document.querySelector(".job__description") ||
        document.querySelector("#content .section-wrapper") ||
        document.querySelector("#content");
      return el ? el.innerText : null;
    },
    company: () => null,
  },
  {
    name: "Lever",
    test: () => location.hostname.includes("lever.co"),
    extract: () => {
      const el =
        document.querySelector(".posting-description") ||
        document.querySelector(".section-wrapper");
      return el ? el.innerText : null;
    },
    company: () => {
      const el = document.querySelector(".main-header-text .large-category-label");
      return el ? el.innerText.trim() : null;
    },
  },
  {
    name: "Ashby",
    test: () => location.hostname.includes("ashbyhq.com"),
    extract: () => {
      const el =
        document.querySelector(".ashby-job-posting-brief-description") ||
        document.querySelector('[class*="JobPosting"]') ||
        document.querySelector("main");
      return el ? el.innerText : null;
    },
    company: () => null,
  },
  {
    name: "Workday",
    test: () => location.hostname.includes("myworkdayjobs.com"),
    extract: () => {
      const el =
        document.querySelector('[data-automation-id="jobPostingDescription"]') ||
        document.querySelector(".css-1t2rxpz");
      return el ? el.innerText : null;
    },
    company: () => null,
  },
  {
    name: "Wellfound",
    test: () => location.hostname.includes("wellfound.com") || location.hostname.includes("angel.co"),
    extract: () => {
      const el =
        document.querySelector(".job-listing-description") ||
        document.querySelector('[class*="jobDescription"]') ||
        document.querySelector(".description");
      return el ? el.innerText : null;
    },
    company: () => {
      const el = document.querySelector('[class*="companyName"]') || document.querySelector("h2");
      return el ? el.innerText.trim() : null;
    },
  },
];

// ─── Detect which extractor matches ──────────────────────────────────────

function getExtractor() {
  return EXTRACTORS.find(e => e.test()) || null;
}

// ─── Recommendation styles ────────────────────────────────────────────────

const REC_STYLES = {
  "Apply":        { bg: "#16a34a", label: "✅ APPLY" },
  "Network First":{ bg: "#d97706", label: "🤝 NETWORK FIRST" },
  "Low Priority": { bg: "#9333ea", label: "⚠️ LOW PRIORITY" },
  "Skip":         { bg: "#dc2626", label: "🚫 SKIP" },
};

// ─── Build panel HTML ─────────────────────────────────────────────────────

function buildPanel(result, companyName, siteName) {
  const rec = REC_STYLES[result.recommendation] || REC_STYLES["Skip"];
  const scoreColor = result.realHireProbability >= 72 ? "#4ade80"
    : result.realHireProbability >= 52 ? "#fbbf24"
    : result.realHireProbability >= 35 ? "#fb923c"
    : "#f87171";

  const signalsHTML = result.signals.map(s => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid #1e293b;">
      <span style="font-size:12px;margin-top:1px;">${s.type === "positive" ? "✅" : "❌"}</span>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;font-weight:600;color:#e2e8f0;">${s.label}</span>
          <span style="font-size:11px;font-weight:700;color:${s.type === "positive" ? "#4ade80" : "#f87171"};white-space:nowrap;margin-left:6px;">${s.impact}</span>
        </div>
        <p style="font-size:10px;color:#94a3b8;margin:2px 0 0;line-height:1.4;">${s.description}</p>
      </div>
    </div>
  `).join("");

  const barWidth = Math.max(4, result.realHireProbability);
  const modeLabel = result.analysisMode === "ai-enhanced" ? "AI-Enhanced" : "Rule-Based";

  return `
    <div id="gje-panel" style="
      position:fixed; right:16px; top:80px; z-index:2147483647;
      width:320px; max-height:calc(100vh - 100px);
      background:#0f172a; border:1px solid #334155; border-radius:12px;
      box-shadow:0 25px 50px rgba(0,0,0,0.6); overflow:hidden;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      display:flex; flex-direction:column;
    ">
      <!-- Header -->
      <div style="padding:14px 16px 10px;background:#0f172a;border-bottom:1px solid #1e293b;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:18px;">👻</span>
            <div>
              <div style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.05em;">GHOST JOB EXPOSÉ</div>
              <div style="font-size:10px;color:#64748b;">${siteName}${companyName ? ` · ${companyName}` : ""}</div>
            </div>
          </div>
          <button id="gje-close" style="
            background:none;border:none;cursor:pointer;color:#64748b;
            font-size:18px;padding:2px 6px;border-radius:4px;line-height:1;
          " title="Close">×</button>
        </div>
      </div>

      <!-- Scrollable body -->
      <div style="overflow-y:auto;flex:1;padding:14px 16px;">

        <!-- Score -->
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
            <span style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Real-Hire Probability</span>
            <span style="font-size:28px;font-weight:900;color:${scoreColor};line-height:1;">${result.realHireProbability}<span style="font-size:14px;">%</span></span>
          </div>
          <div style="height:6px;background:#1e293b;border-radius:999px;overflow:hidden;">
            <div style="height:100%;width:${barWidth}%;background:${scoreColor};border-radius:999px;transition:width 0.6s ease;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;">
            <span style="font-size:9px;color:#475569;">Ghost Risk: ${result.ghostRisk}%</span>
            <span style="font-size:9px;color:#475569;">Confidence: ${result.confidence}% · ${modeLabel}</span>
          </div>
        </div>

        <!-- Recommendation badge -->
        <div style="
          background:${rec.bg}22; border:1px solid ${rec.bg}55;
          border-radius:8px; padding:10px 12px; margin-bottom:14px;
        ">
          <div style="font-size:10px;font-weight:700;color:${rec.bg};letter-spacing:0.06em;text-transform:uppercase;margin-bottom:4px;">${rec.label}</div>
          <p style="font-size:11px;color:#cbd5e1;margin:0;line-height:1.5;">${result.summary}</p>
        </div>

        <!-- Signals -->
        <div style="margin-bottom:14px;">
          <div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">
            Signals (${result.signals.length} detected)
          </div>
          ${signalsHTML}
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding-top:4px;">
          <span style="font-size:9px;color:#334155;">👻 Ghost Job Exposé · Rule-based analysis</span>
        </div>
      </div>
    </div>
  `;
}

// ─── Loading state panel ──────────────────────────────────────────────────

function buildLoadingPanel() {
  return `
    <div id="gje-panel" style="
      position:fixed; right:16px; top:80px; z-index:2147483647;
      width:320px; background:#0f172a; border:1px solid #334155; border-radius:12px;
      box-shadow:0 25px 50px rgba(0,0,0,0.6); padding:20px 16px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      display:flex; flex-direction:column; align-items:center; gap:10px;
    ">
      <span style="font-size:28px;">👻</span>
      <div style="font-size:12px;font-weight:700;color:#fff;">Analyzing job posting…</div>
      <div style="width:100%;height:4px;background:#1e293b;border-radius:999px;overflow:hidden;">
        <div style="
          height:100%;width:40%;background:#7c3aed;border-radius:999px;
          animation:gje-slide 1.2s ease-in-out infinite;
        "></div>
      </div>
      <style>
        @keyframes gje-slide {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
      </style>
    </div>
  `;
}

// ─── Toggle button (shown when panel is closed) ───────────────────────────

function buildToggleBtn() {
  const btn = document.createElement("button");
  btn.id = "gje-toggle";
  btn.title = "Analyze this job for ghost signals";
  btn.style.cssText = `
    position:fixed; right:16px; top:80px; z-index:2147483647;
    background:#7c3aed; color:#fff; border:none; border-radius:50px;
    padding:10px 16px; font-size:13px; font-weight:700; cursor:pointer;
    box-shadow:0 4px 20px rgba(124,58,237,0.5);
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    display:flex; align-items:center; gap:6px;
    transition: transform 0.1s;
  `;
  btn.innerHTML = `<span>👻</span><span>Analyze Job</span>`;
  btn.addEventListener("mouseenter", () => btn.style.transform = "scale(1.05)");
  btn.addEventListener("mouseleave", () => btn.style.transform = "scale(1)");
  return btn;
}

// ─── Main injection logic ─────────────────────────────────────────────────

function showErrorPanel(message, companyName, siteName) {
  removePanel();
  const wrapper = document.createElement("div");
  wrapper.id = PANEL_ID;
  wrapper.innerHTML = buildErrorPanel(message);
  document.body.appendChild(wrapper);

  document.getElementById("gje-close").addEventListener("click", () => {
    removePanel();
    showToggleBtn(companyName, siteName);
  });
  document.getElementById("gje-retry").addEventListener("click", () => {
    removePanel();
    analyze(companyName, siteName);
  });
}

function injectPanel(result, companyName, siteName) {
  removePanel();
  const wrapper = document.createElement("div");
  wrapper.id = PANEL_ID;
  wrapper.innerHTML = buildPanel(result, companyName, siteName);
  document.body.appendChild(wrapper);

  document.getElementById("gje-close").addEventListener("click", () => {
    removePanel();
    showToggleBtn(companyName, siteName);
  });

  // Save result so popup can read it
  chrome.storage.local.set({ lastResult: result, lastUrl: location.href });
}

function removePanel() {
  const el = document.getElementById(PANEL_ID);
  if (el) el.remove();
}

function removeToggleBtn() {
  const el = document.getElementById("gje-toggle");
  if (el) el.remove();
}

function showToggleBtn(companyName, siteName) {
  removeToggleBtn();
  const btn = buildToggleBtn();
  btn.addEventListener("click", () => {
    removeToggleBtn();
    analyze(companyName, siteName);
  });
  document.body.appendChild(btn);
}

function buildErrorPanel(message) {
  return `
    <div id="gje-panel" style="
      position:fixed; right:16px; top:80px; z-index:2147483647;
      width:320px; background:#0f172a; border:1px solid #334155; border-radius:12px;
      box-shadow:0 25px 50px rgba(0,0,0,0.6); padding:18px 16px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:18px;">👻</span>
          <span style="font-size:12px;font-weight:800;color:#fff;">GHOST JOB EXPOSÉ</span>
        </div>
        <button id="gje-close" style="background:none;border:none;cursor:pointer;color:#64748b;font-size:18px;padding:2px 6px;border-radius:4px;line-height:1;" title="Close">×</button>
      </div>
      <div style="background:#1e293b;border-radius:8px;padding:12px;">
        <div style="font-size:12px;color:#f87171;font-weight:600;margin-bottom:6px;">⚠️ Could not extract job description</div>
        <p style="font-size:11px;color:#94a3b8;line-height:1.5;margin:0;">${message}</p>
      </div>
      <button id="gje-retry" style="
        width:100%;margin-top:10px;padding:9px;background:#7c3aed;color:#fff;
        border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;
        font-family:inherit;
      ">Retry</button>
    </div>
  `;
}

async function analyze(companyName, siteName) {
  const extractor = getExtractor();
  if (!extractor) {
    showErrorPanel("This site is not supported. Use the extension popup to paste the job description manually.", companyName, siteName);
    return;
  }

  // Show loading panel immediately so the button disappearing has visible feedback
  removePanel();
  const loadingWrapper = document.createElement("div");
  loadingWrapper.id = PANEL_ID;
  loadingWrapper.innerHTML = buildLoadingPanel();
  document.body.appendChild(loadingWrapper);

  // Give the page a moment to render dynamic content if needed
  await new Promise(r => setTimeout(r, 300));

  const text = extractor.extract();
  if (!text || text.trim().length < 20) {
    showErrorPanel("Job description text not found. Try scrolling down to fully load the page, then click Retry.", companyName, siteName);
    return;
  }

  // Run rule-based analysis (synchronous, always available)
  const result = runAnalysis(text);
  result.analysisMode = "rule-based";

  // Try AI enhancement via configured API URL
  try {
    const { apiUrl } = await chrome.storage.local.get("apiUrl");
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: text, companyName, jobUrl: location.href }),
      });
      if (response.ok) {
        const aiResult = await response.json();
        if (!aiResult.error) {
          Object.assign(result, aiResult);
        }
      }
    }
  } catch (_) {
    // API unavailable — rule-based result is still shown
  }

  injectPanel(result, companyName, siteName);
}

// ─── Init ─────────────────────────────────────────────────────────────────

function init() {
  if (document.getElementById(PANEL_ID)) return;

  const extractor = getExtractor();
  if (!extractor) return;

  // Wait a moment for SPA content to render
  setTimeout(() => {
    const text = extractor.extract();
    if (!text || text.trim().length < 20) {
      // Still no content — show toggle button so user can trigger manually
      showToggleBtn(extractor.company(), extractor.name);
      return;
    }
    const companyName = extractor.company();
    analyze(companyName, extractor.name);
  }, 1500);
}

// Run on page load and on SPA navigation (LinkedIn/Indeed are SPAs)
init();

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    removePanel();
    removeToggleBtn();
    setTimeout(init, 2000);
  }
}).observe(document.body, { childList: true, subtree: true });

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "ANALYZE_TEXT") {
    const result = runAnalysis(msg.text);
    result.analysisMode = "rule-based";
    sendResponse(result);
  }
  if (msg.type === "GET_JOB_TEXT") {
    const extractor = getExtractor();
    const text = extractor ? extractor.extract() : null;
    sendResponse({ text });
  }
  return true;
});
