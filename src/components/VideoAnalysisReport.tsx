// zlyzer/report/exportVideoAnalysisReport.ts
// Simplified, compact, and stylish (≤400 lines)

import type { AnalysisRequest } from "../types/api";
import { formatDate } from "../utils/formatters";

type IdentityBreakdown = { tone?: string; intent?: string; messagingStyle?: string };
export type ReportExportStatus = "window" | "blob" | "anchor";

const BRAND = { navy: "#132e53", midnight: "#0b1526", green: "#2ce695" };

const MAX = {
  summary: 3,
  audience: 5,
  scenes: 8,
  recs: 6,
} as const;

const META_KEYS = {
  title: ["video.title", "videoTitle", "title", "metadata.title", "details.title"],
  creator: ["creator", "creatorName", "author", "profile.name", "channelName", "video.creator"],
  summary: ["executiveSummary", "summary", "overview"],
  audience: ["audienceInsights", "audienceSummary", "audience", "engagementInsights"],
  scenes: ["sceneBreakdown", "scenes", "timeline"],
  recs: ["recommendations", "nextSteps", "actionItems"],
  identity: {
    tone: ["identity.tone", "tone", "brand.tone"],
    intent: ["identity.intent", "intent", "message.intent"],
    messagingStyle: ["identity.messagingStyle", "messagingStyle", "style", "communicationStyle"],
  },
} as const;

/** Public API */
export function exportVideoAnalysisReport(analysis: AnalysisRequest): ReportExportStatus {
  const resultText = analysis.result?.analysisResult;
  if (!resultText) throw new Error("Analysis result is unavailable for report generation.");

  const meta = analysis.result?.analysisMetadata ?? {};
  const sentences = splitSentences(resultText);
  const lines = toLines(resultText);

  const videoTitle =
    pickFirstString(meta, META_KEYS.title) || deriveTitleFromText(lines) || analysis.url;
  const creatorName =
    pickFirstString(meta, META_KEYS.creator) || deriveCreatorFromUrl(analysis.url);

  const summary =
    pickFirstString(meta, META_KEYS.summary) ||
    sentences.slice(0, MAX.summary).join(" ") ||
    "No executive summary was provided by this analysis.";

  const identity = buildIdentity(meta, resultText, sentences, lines);

  const audienceInsights =
    pickStringArray(meta, META_KEYS.audience) ||
    sentences.filter((s) => /audience|viewer|retention|engagement/i.test(s)).slice(0, MAX.audience);

  const sceneBreakdown =
    pickStringArray(meta, META_KEYS.scenes) ||
    lines.filter(isSceneLine).slice(0, MAX.scenes);

  const recommendations =
    pickStringArray(meta, META_KEYS.recs) ||
    sentences.filter((s) => /recommend|suggest|next step|consider|should/i.test(s)).slice(0, MAX.recs);

  const html = buildHtmlReport({
    videoTitle,
    creatorName,
    videoUrl: analysis.url,
    completedAt: analysis.completedAt || analysis.updatedAt || analysis.createdAt,
    summary,
    identity,
    audienceInsights,
    sceneBreakdown,
    recommendations,
  });

  // Try direct window write (best for print styles)
  let win: Window | null = null;
  try {
    win = window.open("about:blank", "_blank", "noopener");
  } catch {
    win = null;
  }

  if (win && win.document) {
    try {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      return "window";
    } catch {
      try {
        win.close();
      } catch {}
    }
  }

  // Blob fallback
  try {
    const blob = new Blob([html], { type: "text/html;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const blobWin = window.open(url, "_blank", "noopener");
    if (blobWin) {
      blobWin.focus();
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      return "blob";
    }
    // Anchor fallback (blocked popups)
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.position = "absolute";
    a.style.left = "-9999px";
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return "anchor";
  } catch {
    throw new Error("Unable to open report. Please allow pop-ups for this site.");
  }
}

/* ----------------------------- Helpers ----------------------------- */

function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function toLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function pathGet(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[k];
  }, obj);
}

function pickFirstString(meta: Record<string, unknown>, paths: string[]): string | undefined {
  for (const p of paths) {
    const v = pathGet(meta, p);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickStringArray(meta: Record<string, unknown>, paths: string[]): string[] | undefined {
  for (const p of paths) {
    const v = pathGet(meta, p);
    const arr = normalizeStringArray(v);
    if (arr?.length) return arr;
  }
  return undefined;
}

function normalizeStringArray(v: unknown): string[] | undefined {
  if (!v) return;
  if (typeof v === "string") {
    const items = v.split(/\n+/).map((x) => x.trim()).filter(Boolean);
    return items.length ? items : undefined;
  }
  if (Array.isArray(v)) {
    const items: string[] = [];
    for (const it of v) {
      if (typeof it === "string" && it.trim()) items.push(it.trim());
      else if (it && typeof it === "object") {
        const r = ["title", "heading", "label", "summary", "description", "insight"]
          .map((k) => (it as Record<string, unknown>)[k])
          .filter((x): x is string => typeof x === "string" && x.trim())
          .join(": ");
        if (r.trim()) items.push(r.trim());
      }
    }
    return items.length ? items : undefined;
  }
  return;
}

function deriveTitleFromText(lines: string[]): string | undefined {
  const hit = lines.find((l) => /(title|video)\s*[:\-–—]/i.test(l));
  return hit?.split(/[:\-–—]/, 2)[1]?.trim();
}

function deriveCreatorFromUrl(url: string): string {
  const m = url.match(/@([A-Za-z0-9_.-]+)/);
  if (m) return `@${m[1]}`;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "Unknown creator";
  }
}

function isSceneLine(line: string): boolean {
  return /^scene\s*\d+/i.test(line) || /^\d+\./.test(line) || /segment|shot/i.test(line);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildIdentity(
  meta: Record<string, unknown>,
  text: string,
  sentences: string[],
  lines: string[]
): IdentityBreakdown {
  const fromMeta: IdentityBreakdown = {
    tone: pickFirstString(meta, META_KEYS.identity.tone),
    intent: pickFirstString(meta, META_KEYS.identity.intent),
    messagingStyle: pickFirstString(meta, META_KEYS.identity.messagingStyle),
  };
  return {
    tone: fromMeta.tone || extractByKeyword(["tone", "tonality"], text, sentences, lines),
    intent: fromMeta.intent || extractByKeyword(["intent", "objective", "goal"], text, sentences, lines),
    messagingStyle:
      fromMeta.messagingStyle ||
      extractByKeyword(["messaging style", "style", "communication"], text, sentences, lines),
  };
}

function extractByKeyword(
  keywords: string[],
  text: string,
  sentences: string[],
  lines: string[]
): string | undefined {
  for (const k of keywords) {
    const rx = new RegExp(`${k}\\s*(?:is|:|=|–|—)\\s*(.+?)(?:[.;]|\\n|$)`, "i");
    const m = text.match(rx);
    if (m?.[1]) return m[1].trim();

    const line = lines.find((x) => x.toLowerCase().startsWith(k.toLowerCase()));
    if (line) {
      const rest = line.split(/[:=–—-]/, 2)[1];
      if (rest?.trim()) return rest.trim();
    }

    const sent = sentences.find((x) => x.toLowerCase().includes(k.toLowerCase()));
    if (sent) return sent.trim();
  }
  return;
}

/* ----------------------------- HTML ----------------------------- */

function buildHtmlReport({
  videoTitle,
  creatorName,
  videoUrl,
  completedAt,
  summary,
  identity,
  audienceInsights,
  sceneBreakdown,
  recommendations,
}: {
  videoTitle: string;
  creatorName: string;
  videoUrl: string;
  completedAt: Date | string;
  summary: string;
  identity: IdentityBreakdown;
  audienceInsights: string[];
  sceneBreakdown: string[];
  recommendations: string[];
}): string {
  const dateStr = formatDate(completedAt);
  const logoUrl = new URL("/logo.svg", window.location.origin).toString();

  const ident = {
    tone: identity.tone || "Not identified.",
    intent: identity.intent || "Not identified.",
    messagingStyle: identity.messagingStyle || "Not identified.",
  };

  const styles = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
    body { margin: 0; background: ${BRAND.midnight}; color: #e6edf6; }
    a { color: ${BRAND.green}; text-decoration: none; }
    .page { min-height: 100vh; padding: 56px 64px; display:flex; flex-direction:column; }
    .cover { background: radial-gradient(1200px 600px at 10% -10%, ${BRAND.navy} 0%, transparent 60%), linear-gradient(140deg, ${BRAND.navy} 0%, #08101b 80%); }
    .row { display:flex; justify-content:space-between; align-items:center; gap:16px; }
    .logo { width: 132px; opacity:.95; }
    .eyebrow { font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:#9fb3c8; }
    h1 { margin:16px 0 6px; font-size:44px; letter-spacing:.06em; }
    h2 { margin:0 0 10px; font-size:24px; letter-spacing:.12em; text-transform:uppercase; color:${BRAND.green}; }
    p { margin:0 0 14px; line-height:1.6; color:#d9e2ee; }
    ul { margin:0; padding-left:20px; line-height:1.6; }
    li { margin-bottom:8px; }
    .meta { margin-top:8px; list-style:none; padding:0; display:grid; gap:8px; max-width:520px; }
    .meta li { display:flex; justify-content:space-between; gap:16px; color:#c0cee0; }
    .meta strong { color:#eef4ff; }
    .card { border:1px solid rgba(255,255,255,.06); background: rgba(19,46,83,.20); border-radius:14px; padding:16px 18px; }
    .grid { display:grid; gap:14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .footer { margin-top:auto; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#9fb3c8; }
    .mark { color:${BRAND.green}; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
    .section { margin: 28px 0; }
    .sig { margin-top:32px; display:flex; flex-direction:column; gap:10px; }
    .sig .line { width:240px; height:1px; background:rgba(255,255,255,.45); }
    @media print { .page { page-break-after: always; } .page:last-of-type { page-break-after: auto; } }
  `;

  const list = (items: string[], fallback: string) =>
    items?.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : `<p>${escapeHtml(fallback)}</p>`;

  const cover = `
    <section class="page cover">
      <div class="row">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <div class="eyebrow">${escapeHtml(dateStr)}</div>
      </div>
      <h1>Video Intelligence Report</h1>
      <p style="font-size:18px; color:#c9d7ea;">${escapeHtml(videoTitle)}</p>
      <ul class="meta">
        <li><strong>Creator</strong><span>${escapeHtml(creatorName)}</span></li>
        <li><strong>Video URL</strong><span><a href="${escapeHtml(videoUrl)}">${escapeHtml(videoUrl)}</a></span></li>
        <li><strong>Generated</strong><span>${escapeHtml(dateStr)}</span></li>
      </ul>
      <div class="footer"><span class="mark">Zlyzer</span><span>AI Analysis Engine</span></div>
    </section>
  `;

  const summaryPage = `
    <section class="page">
      <div class="section">
        <h2>Executive Summary</h2>
        <p>${escapeHtml(summary)}</p>
      </div>

      <div class="section">
        <h2>Video Identity</h2>
        <div class="grid">
          <div class="card"><div class="eyebrow">Tone</div><p>${escapeHtml(ident.tone)}</p></div>
          <div class="card"><div class="eyebrow">Intent</div><p>${escapeHtml(ident.intent)}</p></div>
          <div class="card"><div class="eyebrow">Messaging Style</div><p>${escapeHtml(ident.messagingStyle)}</p></div>
        </div>
      </div>

      <div class="section">
        <h2>Audience & Engagement</h2>
        ${list(audienceInsights, "Audience insights were not identified.")}
      </div>

      <div class="footer"><span class="mark">Zlyzer</span><span>AI Analysis Engine</span></div>
    </section>
  `;

  const detailPage = `
    <section class="page">
      <div class="section">
        <h2>Scene Breakdown</h2>
        ${list(sceneBreakdown, "Scene-by-scene details were not available.")}
      </div>

      <div class="section">
        <h2>Recommendations</h2>
        ${list(recommendations, "No explicit recommendations were included.")}
      </div>

      <div class="sig"><div class="line"></div><span>Authorized Signature</span></div>
      <div class="footer"><span class="mark">Zlyzer</span><span>AI Analysis Engine</span></div>
    </section>
  `;

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <title>Zlyzer Video Analysis Report</title>
      <style>${styles}</style>
      <script>
        addEventListener('load', () => setTimeout(() => { try { focus(); print(); } catch {} }, 350));
      </script>
    </head>
    <body>
      ${cover}
      ${summaryPage}
      ${detailPage}
    </body>
  </html>`;
}
