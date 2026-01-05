// components/VideoAnalysisReport.tsx
// Premium consulting-style PDF report generator

import type { AnalysisRequest } from '../types/api';
import { formatDate } from '../utils/formatters';

export type ReportExportStatus = 'window' | 'blob' | 'anchor';

// Brand colors
const BRAND = {
  navy: '#132e53',
  midnight: '#0b1526',
  green: '#2ce695',
  greenLight: '#7affd0',
  greenDark: '#1a9d6c',
};

// Extraction limits
const MAX = {
  summary: 4,
  audience: 6,
  scenes: 10,
  recs: 8,
  insights: 6,
} as const;

// Metadata key paths for extraction
const META_KEYS = {
  title: ['video.title', 'videoTitle', 'title', 'metadata.title', 'details.title'],
  creator: ['creator', 'creatorName', 'author', 'profile.name', 'channelName', 'video.creator'],
  summary: ['executiveSummary', 'summary', 'overview'],
  audience: ['audienceInsights', 'audienceSummary', 'audience', 'engagementInsights'],
  scenes: ['sceneBreakdown', 'scenes', 'timeline'],
  recs: ['recommendations', 'nextSteps', 'actionItems'],
  insights: ['keyInsights', 'insights', 'findings', 'highlights'],
  identity: {
    tone: ['identity.tone', 'tone', 'brand.tone'],
    intent: ['identity.intent', 'intent', 'message.intent'],
    messagingStyle: ['identity.messagingStyle', 'messagingStyle', 'style', 'communicationStyle'],
  },
  metrics: {
    engagement: ['metrics.engagement', 'engagementScore', 'engagement'],
    quality: ['metrics.quality', 'contentQuality', 'quality'],
    viral: ['metrics.viralPotential', 'viralScore', 'virality'],
  },
} as const;

type IdentityBreakdown = { tone?: string; intent?: string; messagingStyle?: string };
type MetricsBreakdown = { engagement?: string; quality?: string; viral?: string };

/**
 * Checks if the analysis result has enough structured content for the fixed template
 */
function hasStructuredContent(
  identity: IdentityBreakdown,
  metrics: MetricsBreakdown,
  keyInsights: string[],
  audienceInsights: string[],
  recommendations: string[]
): boolean {
  const hasMetrics =
    (metrics.engagement && metrics.engagement !== '—') ||
    (metrics.quality && metrics.quality !== '—') ||
    (metrics.viral && metrics.viral !== '—');

  const hasIdentity =
    (identity.tone && identity.tone !== 'Not identified') ||
    (identity.intent && identity.intent !== 'Not identified') ||
    (identity.messagingStyle && identity.messagingStyle !== 'Not identified');

  const hasInsights = keyInsights.length > 0 || audienceInsights.length > 0;
  const hasRecommendations = recommendations.length > 0;

  // Require at least 2 of 4 structured sections to use the structured layout
  const structuredSections = [hasMetrics, hasIdentity, hasInsights, hasRecommendations].filter(Boolean).length;
  return structuredSections >= 2;
}

/**
 * Public API - Exports the analysis as a premium PDF report
 */
export function exportVideoAnalysisReport(analysis: AnalysisRequest): ReportExportStatus {
  const resultText = analysis.result?.analysisResult;
  if (!resultText) throw new Error('Analysis result is unavailable for report generation.');

  const meta = analysis.result?.analysisMetadata ?? {};
  const sentences = splitSentences(resultText);
  const lines = toLines(resultText);

  // Extract data
  const videoTitle =
    pickFirstString(meta, META_KEYS.title) || deriveTitleFromText(lines) || 'Video Analysis';
  const creatorName =
    pickFirstString(meta, META_KEYS.creator) || deriveCreatorFromUrl(analysis.url);

  const summary =
    pickFirstString(meta, META_KEYS.summary) ||
    sentences.slice(0, MAX.summary).join(' ') ||
    'This report provides a comprehensive analysis of the video content, including engagement insights, audience demographics, and actionable recommendations.';

  const identity = buildIdentity(meta, resultText, sentences, lines);
  const metrics = buildMetrics(meta, resultText, sentences);

  const audienceInsights =
    pickStringArray(meta, META_KEYS.audience) ||
    sentences.filter((s) => /audience|viewer|retention|engagement|watch/i.test(s)).slice(0, MAX.audience);

  const keyInsights =
    pickStringArray(meta, META_KEYS.insights) ||
    sentences.filter((s) => /insight|finding|notable|significant|key/i.test(s)).slice(0, MAX.insights);

  const sceneBreakdown =
    pickStringArray(meta, META_KEYS.scenes) ||
    lines.filter(isSceneLine).slice(0, MAX.scenes);

  const recommendations =
    pickStringArray(meta, META_KEYS.recs) ||
    sentences
      .filter((s) => /recommend|suggest|next step|consider|should|improve|optimize/i.test(s))
      .slice(0, MAX.recs);

  const html = buildPremiumReport({
    videoTitle,
    creatorName,
    videoUrl: analysis.url,
    completedAt: analysis.completedAt || analysis.updatedAt || analysis.createdAt,
    processingTime: analysis.result?.processingTime,
    summary,
    identity,
    metrics,
    audienceInsights,
    keyInsights,
    sceneBreakdown,
    recommendations,
    rawAnalysis: resultText,
  });

  // Try direct window write (best for print styles)
  let win: Window | null = null;
  try {
    win = window.open('about:blank', '_blank', 'noopener');
  } catch {
    win = null;
  }

  if (win && win.document) {
    try {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      return 'window';
    } catch {
      try {
        win.close();
      } catch {
        // Ignore
      }
    }
  }

  // Blob fallback
  try {
    const blob = new Blob([html], { type: 'text/html;charset=UTF-8' });
    const url = URL.createObjectURL(blob);
    const blobWin = window.open(url, '_blank', 'noopener');
    if (blobWin) {
      blobWin.focus();
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      return 'blob';
    }
    // Anchor fallback (blocked popups)
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.position = 'absolute';
    a.style.left = '-9999px';
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return 'anchor';
  } catch {
    throw new Error('Unable to open report. Please allow pop-ups for this site.');
  }
}

/* ----------------------------- Helpers ----------------------------- */

function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function pathGet(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[k];
  }, obj);
}

function pickFirstString(meta: Record<string, unknown>, paths: readonly string[]): string | undefined {
  for (const p of paths) {
    const v = pathGet(meta, p);
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function pickStringArray(meta: Record<string, unknown>, paths: readonly string[]): string[] | undefined {
  for (const p of paths) {
    const v = pathGet(meta, p);
    const arr = normalizeStringArray(v);
    if (arr?.length) return arr;
  }
  return undefined;
}

function normalizeStringArray(v: unknown): string[] | undefined {
  if (!v) return;
  if (typeof v === 'string') {
    const items = v
      .split(/\n+/)
      .map((x) => x.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }
  if (Array.isArray(v)) {
    const items: string[] = [];
    for (const it of v) {
      if (typeof it === 'string' && it.trim()) items.push(it.trim());
      else if (it && typeof it === 'object') {
        const r = ['title', 'heading', 'label', 'summary', 'description', 'insight']
          .map((k) => (it as Record<string, unknown>)[k])
          .filter((x): x is string => typeof x === 'string' && Boolean(x.trim()))
          .join(': ');
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
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown Creator';
  }
}

function isSceneLine(line: string): boolean {
  return /^scene\s*\d+/i.test(line) || /^\d+\./.test(line) || /segment|shot|timestamp/i.test(line);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    tone: fromMeta.tone || extractByKeyword(['tone', 'tonality', 'mood'], text, sentences, lines),
    intent: fromMeta.intent || extractByKeyword(['intent', 'objective', 'goal', 'purpose'], text, sentences, lines),
    messagingStyle:
      fromMeta.messagingStyle ||
      extractByKeyword(['messaging style', 'style', 'communication', 'approach'], text, sentences, lines),
  };
}

function buildMetrics(
  meta: Record<string, unknown>,
  text: string,
  sentences: string[]
): MetricsBreakdown {
  return {
    engagement:
      pickFirstString(meta, META_KEYS.metrics.engagement) ||
      extractMetricScore(text, sentences, ['engagement', 'interaction', 'response']),
    quality:
      pickFirstString(meta, META_KEYS.metrics.quality) ||
      extractMetricScore(text, sentences, ['quality', 'production', 'content']),
    viral:
      pickFirstString(meta, META_KEYS.metrics.viral) ||
      extractMetricScore(text, sentences, ['viral', 'shareability', 'trending']),
  };
}

function extractMetricScore(text: string, _sentences: string[], keywords: string[]): string | undefined {
  for (const k of keywords) {
    const rx = new RegExp(`${k}[^.]*?(\\d+[/\\d]*%?|high|medium|low|excellent|good|average)`, 'i');
    const m = text.match(rx);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function extractByKeyword(
  keywords: string[],
  text: string,
  sentences: string[],
  lines: string[]
): string | undefined {
  for (const k of keywords) {
    const rx = new RegExp(`${k}\\s*(?:is|:|=|–|—)\\s*(.+?)(?:[.;]|\\n|$)`, 'i');
    const m = text.match(rx);
    if (m?.[1]) return m[1].trim();

    const line = lines.find((x) => x.toLowerCase().startsWith(k.toLowerCase()));
    if (line) {
      const rest = line.split(/[:=–—-]/, 2)[1];
      if (rest?.trim()) return rest.trim();
    }

    const sent = sentences.find((x) => x.toLowerCase().includes(k.toLowerCase()));
    if (sent && sent.length < 200) return sent.trim();
  }
  return;
}

/* ----------------------------- HTML Report Builder ----------------------------- */

interface ReportData {
  videoTitle: string;
  creatorName: string;
  videoUrl: string;
  completedAt: Date | string;
  processingTime?: number;
  summary: string;
  identity: IdentityBreakdown;
  metrics: MetricsBreakdown;
  audienceInsights: string[];
  keyInsights: string[];
  sceneBreakdown: string[];
  recommendations: string[];
  rawAnalysis: string;
}

function buildPremiumReport(data: ReportData): string {
  // Check if we have enough structured content for the fixed template
  // If not, use the flexible plain text layout
  const useStructuredLayout = hasStructuredContent(
    data.identity,
    data.metrics,
    data.keyInsights,
    data.audienceInsights,
    data.recommendations
  );

  if (!useStructuredLayout) {
    return buildPlainTextReport(data);
  }

  // Continue with structured layout below
  const dateStr = formatDate(data.completedAt);
  const logoUrl = new URL('/logo.svg', window.location.origin).toString();
  const year = new Date().getFullYear();

  const ident = {
    tone: data.identity.tone || 'Not identified',
    intent: data.identity.intent || 'Not identified',
    messagingStyle: data.identity.messagingStyle || 'Not identified',
  };

  const metr = {
    engagement: data.metrics.engagement || '—',
    quality: data.metrics.quality || '—',
    viral: data.metrics.viral || '—',
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
    
    :root {
      color-scheme: dark;
      --navy: ${BRAND.navy};
      --midnight: ${BRAND.midnight};
      --green: ${BRAND.green};
      --green-light: ${BRAND.greenLight};
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--midnight);
      color: #e6edf6;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Page Setup */
    @page {
      size: A4;
      margin: 0;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 48px 56px;
      position: relative;
      page-break-after: always;
      background: linear-gradient(165deg, var(--navy) 0%, var(--midnight) 100%);
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    /* Typography */
    h1 {
      font-family: 'DM Sans', sans-serif;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.15;
      color: #ffffff;
    }
    
    h2 {
      font-family: 'DM Sans', sans-serif;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 16px;
    }
    
    h3 {
      font-family: 'DM Sans', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 8px;
    }
    
    p {
      color: #c9d7ea;
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    a {
      color: var(--green);
      text-decoration: none;
    }
    
    a:hover {
      color: var(--green-light);
    }
    
    /* Components */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
    }
    
    .logo {
      width: 120px;
      height: auto;
    }
    
    .badge {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      padding: 8px 16px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 100px;
    }
    
    .title-section {
      margin-bottom: 40px;
    }
    
    .eyebrow {
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 12px;
    }
    
    .subtitle {
      font-size: 18px;
      color: rgba(255,255,255,0.7);
      margin-top: 8px;
      max-width: 500px;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 32px;
      max-width: 600px;
    }
    
    .meta-item {
      padding: 16px 20px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
    }
    
    .meta-label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin-bottom: 6px;
    }
    
    .meta-value {
      font-size: 14px;
      color: #ffffff;
      word-break: break-all;
    }
    
    .meta-value a {
      font-size: 13px;
    }
    
    /* Cards */
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 24px;
      page-break-inside: avoid;
    }
    
    .card-highlight {
      background: linear-gradient(135deg, rgba(44,230,149,0.08) 0%, rgba(44,230,149,0.02) 100%);
      border-color: rgba(44,230,149,0.2);
    }
    
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    
    .metric-card {
      text-align: center;
      padding: 20px 16px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
    }
    
    .metric-value {
      font-family: 'DM Sans', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--green);
      margin-bottom: 6px;
    }
    
    .metric-label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
    }
    
    .identity-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 20px;
    }
    
    .identity-card {
      padding: 20px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
    }
    
    .identity-card .label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 8px;
    }
    
    .identity-card .value {
      font-size: 14px;
      color: rgba(255,255,255,0.85);
      line-height: 1.5;
    }
    
    /* Lists */
    .insight-list {
      list-style: none;
      padding: 0;
    }
    
    .insight-list li {
      display: flex;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
      color: rgba(255,255,255,0.85);
    }
    
    .insight-list li:last-child {
      border-bottom: none;
    }
    
    .insight-list .bullet {
      flex-shrink: 0;
      width: 6px;
      height: 6px;
      margin-top: 8px;
      border-radius: 50%;
      background: var(--green);
    }
    
    .numbered-list {
      list-style: none;
      padding: 0;
      counter-reset: item;
    }
    
    .numbered-list li {
      display: flex;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
      color: rgba(255,255,255,0.85);
      counter-increment: item;
    }
    
    .numbered-list li:last-child {
      border-bottom: none;
    }
    
    .numbered-list .number {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(44,230,149,0.12);
      color: var(--green);
      font-size: 13px;
      font-weight: 600;
    }
    
    .numbered-list .number::before {
      content: counter(item);
    }
    
    /* Scene Timeline */
    .timeline {
      position: relative;
      padding-left: 24px;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: linear-gradient(180deg, var(--green) 0%, rgba(44,230,149,0.2) 100%);
      border-radius: 2px;
    }
    
    .timeline-item {
      position: relative;
      padding: 12px 0;
      font-size: 14px;
      color: rgba(255,255,255,0.85);
    }
    
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -24px;
      top: 18px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--midnight);
      border: 2px solid var(--green);
    }
    
    /* Footer */
    .footer {
      position: absolute;
      bottom: 40px;
      left: 56px;
      right: 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    
    .footer-brand {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--green);
    }
    
    .footer-text {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
    }
    
    .page-number {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
    }
    
    /* Section spacing */
    .section {
      margin-bottom: 32px;
    }
    
    .section:last-child {
      margin-bottom: 0;
    }
    
    /* Signature */
    .signature-block {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    
    .signature-line {
      width: 200px;
      height: 1px;
      background: rgba(255,255,255,0.3);
      margin-bottom: 8px;
    }
    
    .signature-label {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
    }
    
    .confidential {
      margin-top: 24px;
      padding: 16px 20px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      line-height: 1.6;
    }
    
    /* Print adjustments */
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .page {
        margin: 0;
        box-shadow: none;
      }
    }
  `;

  const list = (items: string[], fallback: string, type: 'bullet' | 'numbered' | 'timeline' = 'bullet') => {
    if (!items?.length) return `<p style="color: rgba(255,255,255,0.5); font-style: italic;">${escapeHtml(fallback)}</p>`;

    if (type === 'timeline') {
      return `<div class="timeline">${items.map((i) => `<div class="timeline-item">${escapeHtml(i)}</div>`).join('')}</div>`;
    }

    if (type === 'numbered') {
      return `<ol class="numbered-list">${items.map((i) => `<li><span class="number"></span><span>${escapeHtml(i)}</span></li>`).join('')}</ol>`;
    }

    return `<ul class="insight-list">${items.map((i) => `<li><span class="bullet"></span><span>${escapeHtml(i)}</span></li>`).join('')}</ul>`;
  };

  // Page 1: Cover
  const coverPage = `
    <section class="page">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <span class="badge">Confidential Report</span>
      </div>
      
      <div class="title-section" style="margin-top: 80px;">
        <div class="eyebrow">Video Intelligence Report</div>
        <h1>${escapeHtml(data.videoTitle)}</h1>
        <p class="subtitle">Comprehensive AI-powered analysis of content performance, audience engagement, and strategic recommendations.</p>
      </div>
      
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Creator</div>
          <div class="meta-value">${escapeHtml(data.creatorName)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Analysis Date</div>
          <div class="meta-value">${escapeHtml(dateStr)}</div>
        </div>
        <div class="meta-item" style="grid-column: span 2;">
          <div class="meta-label">Video URL</div>
          <div class="meta-value"><a href="${escapeHtml(data.videoUrl)}" target="_blank">${escapeHtml(data.videoUrl)}</a></div>
        </div>
        ${data.processingTime ? `
        <div class="meta-item">
          <div class="meta-label">Processing Time</div>
          <div class="meta-value">${data.processingTime}s</div>
        </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <span class="footer-brand">Zlyzer</span>
        <span class="footer-text">AI-Powered Video Intelligence</span>
        <span class="page-number">1 / 4</span>
      </div>
    </section>
  `;

  // Page 2: Executive Summary
  const summaryPage = `
    <section class="page">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <span class="badge">${escapeHtml(dateStr)}</span>
      </div>
      
      <div class="section">
        <h2>Executive Summary</h2>
        <div class="card card-highlight">
          <p style="font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.9); margin: 0;">${escapeHtml(data.summary)}</p>
        </div>
      </div>
      
      <div class="section">
        <h2>Performance Metrics</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-value">${escapeHtml(metr.engagement)}</div>
            <div class="metric-label">Engagement</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${escapeHtml(metr.quality)}</div>
            <div class="metric-label">Content Quality</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${escapeHtml(metr.viral)}</div>
            <div class="metric-label">Viral Potential</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Video Identity</h2>
        <div class="identity-grid">
          <div class="identity-card">
            <div class="label">Tone</div>
            <div class="value">${escapeHtml(ident.tone)}</div>
          </div>
          <div class="identity-card">
            <div class="label">Intent</div>
            <div class="value">${escapeHtml(ident.intent)}</div>
          </div>
          <div class="identity-card">
            <div class="label">Style</div>
            <div class="value">${escapeHtml(ident.messagingStyle)}</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <span class="footer-brand">Zlyzer</span>
        <span class="footer-text">AI-Powered Video Intelligence</span>
        <span class="page-number">2 / 4</span>
      </div>
    </section>
  `;

  // Page 3: Deep Analysis
  const analysisPage = `
    <section class="page">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <span class="badge">${escapeHtml(dateStr)}</span>
      </div>
      
      <div class="section">
        <h2>Key Insights</h2>
        <div class="card">
          ${list(data.keyInsights, 'No specific insights were identified in this analysis.', 'bullet')}
        </div>
      </div>
      
      <div class="section">
        <h2>Audience & Engagement</h2>
        <div class="card">
          ${list(data.audienceInsights, 'Audience insights were not available for this analysis.', 'bullet')}
        </div>
      </div>
      
      <div class="section">
        <h2>Content Timeline</h2>
        <div class="card">
          ${list(data.sceneBreakdown, 'Scene-by-scene breakdown was not available.', 'timeline')}
        </div>
      </div>
      
      <div class="footer">
        <span class="footer-brand">Zlyzer</span>
        <span class="footer-text">AI-Powered Video Intelligence</span>
        <span class="page-number">3 / 4</span>
      </div>
    </section>
  `;

  // Page 4: Recommendations
  const recommendationsPage = `
    <section class="page">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <span class="badge">${escapeHtml(dateStr)}</span>
      </div>
      
      <div class="section">
        <h2>Strategic Recommendations</h2>
        <div class="card">
          ${list(data.recommendations, 'No explicit recommendations were included in this analysis.', 'numbered')}
        </div>
      </div>
      
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Authorized by Zlyzer AI Analysis Engine</div>
      </div>
      
      <div class="confidential">
        <strong>Confidentiality Notice:</strong> This report contains proprietary analysis generated by Zlyzer's AI engine. 
        The insights and recommendations are based on publicly available content and should be used for informational purposes only. 
        Distribution of this report should be limited to authorized personnel.
      </div>
      
      <div class="footer">
        <span class="footer-brand">Zlyzer</span>
        <span class="footer-text">© ${year} Zlyzer. All rights reserved.</span>
        <span class="page-number">4 / 4</span>
      </div>
    </section>
  `;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zlyzer Video Analysis Report - ${escapeHtml(data.videoTitle)}</title>
    <style>${styles}</style>
    <script>
      addEventListener('load', () => {
        setTimeout(() => {
          try { 
            window.focus(); 
            window.print(); 
          } catch (e) {
            console.log('Print dialog could not be opened automatically');
          }
        }, 500);
      });
    </script>
  </head>
  <body>
    ${coverPage}
    ${summaryPage}
    ${analysisPage}
    ${recommendationsPage}
  </body>
</html>`;
}

/**
 * Builds a clean, readable report for plain text analysis output
 * Uses dynamic pages based on content length
 */
function buildPlainTextReport(data: ReportData): string {
  const dateStr = formatDate(data.completedAt);
  const logoUrl = new URL('/logo.svg', window.location.origin).toString();
  const year = new Date().getFullYear();

  // Convert raw analysis to formatted HTML with paragraph breaks
  const formattedAnalysis = formatAnalysisText(data.rawAnalysis);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
    
    :root {
      color-scheme: dark;
      --navy: ${BRAND.navy};
      --midnight: ${BRAND.midnight};
      --green: ${BRAND.green};
      --green-light: ${BRAND.greenLight};
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--midnight);
      color: #e6edf6;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 48px 56px;
      position: relative;
      page-break-after: always;
      background: linear-gradient(165deg, var(--navy) 0%, var(--midnight) 100%);
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    h1 {
      font-family: 'DM Sans', sans-serif;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.15;
      color: #ffffff;
    }
    
    h2 {
      font-family: 'DM Sans', sans-serif;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 16px;
    }
    
    h3 {
      font-family: 'DM Sans', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin: 20px 0 12px 0;
    }
    
    p {
      color: #c9d7ea;
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    a {
      color: var(--green);
      text-decoration: none;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
    }
    
    .logo {
      width: 120px;
      height: auto;
    }
    
    .badge {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      padding: 8px 16px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 100px;
    }
    
    .title-section {
      margin-bottom: 40px;
    }
    
    .eyebrow {
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 12px;
    }
    
    .subtitle {
      font-size: 18px;
      color: rgba(255,255,255,0.7);
      margin-top: 8px;
      max-width: 500px;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 32px;
      max-width: 600px;
    }
    
    .meta-item {
      padding: 16px 20px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
    }
    
    .meta-label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin-bottom: 6px;
    }
    
    .meta-value {
      font-size: 14px;
      color: #ffffff;
      word-break: break-all;
    }
    
    .analysis-content {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px;
    }
    
    .analysis-content p {
      font-size: 15px;
      line-height: 1.8;
      color: rgba(255,255,255,0.9);
      margin-bottom: 16px;
    }
    
    .analysis-content p:last-child {
      margin-bottom: 0;
    }
    
    .analysis-content ul,
    .analysis-content ol {
      margin: 16px 0;
      padding-left: 24px;
      color: rgba(255,255,255,0.85);
    }
    
    .analysis-content li {
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .analysis-content strong {
      color: var(--green);
      font-weight: 600;
    }
    
    .footer {
      position: absolute;
      bottom: 40px;
      left: 56px;
      right: 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    
    .footer-brand {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--green);
    }
    
    .footer-text {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
    }
    
    .confidential {
      margin-top: 24px;
      padding: 16px 20px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      line-height: 1.6;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .page {
        margin: 0;
        box-shadow: none;
      }
    }
  `;

  // Cover page
  const coverPage = `
    <section class="page">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <span class="badge">Analysis Report</span>
      </div>
      
      <div class="title-section" style="margin-top: 80px;">
        <div class="eyebrow">Video Intelligence Report</div>
        <h1>${escapeHtml(data.videoTitle)}</h1>
        <p class="subtitle">AI-powered analysis of video content.</p>
      </div>
      
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Creator</div>
          <div class="meta-value">${escapeHtml(data.creatorName)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Analysis Date</div>
          <div class="meta-value">${escapeHtml(dateStr)}</div>
        </div>
        <div class="meta-item" style="grid-column: span 2;">
          <div class="meta-label">Video URL</div>
          <div class="meta-value"><a href="${escapeHtml(data.videoUrl)}" target="_blank">${escapeHtml(data.videoUrl)}</a></div>
        </div>
        ${data.processingTime ? `
        <div class="meta-item">
          <div class="meta-label">Processing Time</div>
          <div class="meta-value">${data.processingTime}s</div>
        </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <span class="footer-brand">Zlyzer</span>
        <span class="footer-text">AI-Powered Video Intelligence</span>
      </div>
    </section>
  `;

  // Analysis content page(s) - content flows naturally
  const analysisPage = `
    <section class="page" style="min-height: auto; page-break-inside: auto;">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <span class="badge">${escapeHtml(dateStr)}</span>
      </div>
      
      <h2>Analysis Results</h2>
      <div class="analysis-content">
        ${formattedAnalysis}
      </div>
      
      <div class="confidential" style="margin-top: 40px;">
        <strong>Confidentiality Notice:</strong> This report contains analysis generated by Zlyzer's AI engine. 
        The insights are based on publicly available content and should be used for informational purposes only.
      </div>
      
      <div class="footer" style="position: relative; margin-top: 40px;">
        <span class="footer-brand">Zlyzer</span>
        <span class="footer-text">© ${year} Zlyzer. All rights reserved.</span>
      </div>
    </section>
  `;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zlyzer Video Analysis Report - ${escapeHtml(data.videoTitle)}</title>
    <style>${styles}</style>
    <script>
      addEventListener('load', () => {
        setTimeout(() => {
          try { 
            window.focus(); 
            window.print(); 
          } catch (e) {
            console.log('Print dialog could not be opened automatically');
          }
        }, 500);
      });
    </script>
  </head>
  <body>
    ${coverPage}
    ${analysisPage}
  </body>
</html>`;
}

/**
 * Formats raw analysis text to HTML with proper paragraph breaks and basic markdown-like formatting
 */
function formatAnalysisText(text: string): string {
  // Split into paragraphs (double newlines or more)
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  return paragraphs.map(paragraph => {
    // Check if it's a heading-like line (starts with #)
    if (/^#{1,3}\s+/.test(paragraph)) {
      const headingText = paragraph.replace(/^#{1,3}\s+/, '');
      return `<h3>${escapeHtml(headingText)}</h3>`;
    }

    // Check if it's a list (lines starting with - or * or numbers)
    const lines = paragraph.split('\n').map(l => l.trim()).filter(Boolean);
    const isBulletList = lines.every(l => /^[-*•]\s+/.test(l));
    const isNumberedList = lines.every(l => /^\d+[.)]\s+/.test(l));

    if (isBulletList) {
      const items = lines.map(l => `<li>${escapeHtml(l.replace(/^[-*•]\s+/, ''))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }

    if (isNumberedList) {
      const items = lines.map(l => `<li>${escapeHtml(l.replace(/^\d+[.)]\s+/, ''))}</li>`).join('');
      return `<ol>${items}</ol>`;
    }

    // Regular paragraph - apply inline formatting
    let html = escapeHtml(paragraph);

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Handle single newlines as line breaks within a paragraph
    html = html.replace(/\n/g, '<br />');

    return `<p>${html}</p>`;
  }).join('\n');
}
