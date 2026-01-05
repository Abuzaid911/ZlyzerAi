// components/VideoAnalysisReport.tsx
// Adaptive PDF report generator - handles both structured and plain text analysis

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

/* ----------------------------- Content Validation Helpers ----------------------------- */

const EMPTY_VALUES = ['—', '-', 'Not identified', 'N/A', 'n/a', 'undefined', 'null', ''];

function isRealValue(v: string | undefined): boolean {
  if (!v) return false;
  const trimmed = v.trim();
  return trimmed.length > 0 && !EMPTY_VALUES.includes(trimmed);
}

function hasRealMetrics(metrics: MetricsBreakdown): boolean {
  const realValues = [metrics.engagement, metrics.quality, metrics.viral].filter(isRealValue);
  return realValues.length >= 2;
}

function hasRealIdentity(identity: IdentityBreakdown): boolean {
  const realValues = [identity.tone, identity.intent, identity.messagingStyle].filter(isRealValue);
  return realValues.length >= 2;
}

function hasRealList(items: string[]): boolean {
  return items.filter((s) => s.trim().length > 10).length >= 2;
}

/**
 * Public API - Exports the analysis as a PDF report
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
    sentences.slice(0, MAX.summary).join(' ');

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

  const html = buildAdaptiveReport({
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

/* ----------------------------- Text Processing Helpers ----------------------------- */

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

/* ----------------------------- Enhanced Prose Formatting ----------------------------- */

/**
 * Formats raw analysis text to HTML with proper markdown-like formatting
 */
function formatAnalysisText(text: string): string {
  // Split into paragraphs (double newlines or more)
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((paragraph) => {
      // Check if it's a heading (starts with # or ##)
      const h1Match = paragraph.match(/^#\s+(.+)$/);
      if (h1Match) {
        return `<h2 class="prose-h2">${escapeHtml(h1Match[1])}</h2>`;
      }

      const h2Match = paragraph.match(/^##\s+(.+)$/);
      if (h2Match) {
        return `<h3 class="prose-h3">${escapeHtml(h2Match[1])}</h3>`;
      }

      const h3Match = paragraph.match(/^###\s+(.+)$/);
      if (h3Match) {
        return `<h4 class="prose-h4">${escapeHtml(h3Match[1])}</h4>`;
      }

      // Check if it's a blockquote
      if (paragraph.startsWith('>')) {
        const quoteText = paragraph
          .split('\n')
          .map((l) => l.replace(/^>\s*/, '').trim())
          .join(' ');
        return `<blockquote class="prose-quote">${escapeHtml(quoteText)}</blockquote>`;
      }

      // Check if it's a list
      const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);
      const isBulletList = lines.every((l) => /^[-*•]\s+/.test(l));
      const isNumberedList = lines.every((l) => /^\d+[.)]\s+/.test(l));

      if (isBulletList) {
        const items = lines.map((l) => {
          const content = l.replace(/^[-*•]\s+/, '');
          return `<li>${formatInlineText(content)}</li>`;
        }).join('');
        return `<ul class="prose-list">${items}</ul>`;
      }

      if (isNumberedList) {
        const items = lines.map((l) => {
          const content = l.replace(/^\d+[.)]\s+/, '');
          return `<li>${formatInlineText(content)}</li>`;
        }).join('');
        return `<ol class="prose-list prose-list-numbered">${items}</ol>`;
      }

      // Regular paragraph - apply inline formatting
      const content = formatInlineText(paragraph.replace(/\n/g, ' '));
      return `<p class="prose-p">${content}</p>`;
    })
    .join('\n');
}

/**
 * Formats inline text (bold, italic, code, links)
 */
function formatInlineText(text: string): string {
  let html = escapeHtml(text);

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (but not inside words)
  html = html.replace(/(?<![a-zA-Z])\*([^*]+)\*(?![a-zA-Z])/g, '<em>$1</em>');
  html = html.replace(/(?<![a-zA-Z])_([^_]+)_(?![a-zA-Z])/g, '<em>$1</em>');

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="prose-code">$1</code>');

  return html;
}

/* ----------------------------- Adaptive Report Builder ----------------------------- */

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

interface ReportSection {
  id: string;
  title: string;
  html: string;
}

function buildAdaptiveReport(data: ReportData): string {
  const dateStr = formatDate(data.completedAt);
  const logoUrl = new URL('/logo.svg', window.location.origin).toString();
  const year = new Date().getFullYear();

  // Collect sections that have meaningful content
  const sections: ReportSection[] = [];

  // Executive Summary - only if we have a decent summary
  if (data.summary && data.summary.length > 50) {
    sections.push({
      id: 'summary',
      title: 'Executive Summary',
      html: `
        <div class="card card-highlight">
          <p class="summary-text">${escapeHtml(data.summary)}</p>
        </div>
      `,
    });
  }

  // Performance Metrics - only if we have real values
  if (hasRealMetrics(data.metrics)) {
    const metricsHtml = [
      { label: 'Engagement', value: data.metrics.engagement },
      { label: 'Content Quality', value: data.metrics.quality },
      { label: 'Viral Potential', value: data.metrics.viral },
    ]
      .filter((m) => isRealValue(m.value))
      .map(
        (m) => `
        <div class="metric-card">
          <div class="metric-value">${escapeHtml(m.value!)}</div>
          <div class="metric-label">${m.label}</div>
        </div>
      `
      )
      .join('');

    sections.push({
      id: 'metrics',
      title: 'Performance Metrics',
      html: `<div class="metric-grid">${metricsHtml}</div>`,
    });
  }

  // Video Identity - only if we have real values
  if (hasRealIdentity(data.identity)) {
    const identityItems = [
      { label: 'Tone', value: data.identity.tone },
      { label: 'Intent', value: data.identity.intent },
      { label: 'Style', value: data.identity.messagingStyle },
    ]
      .filter((i) => isRealValue(i.value))
      .map(
        (i) => `
        <div class="identity-card">
          <div class="identity-label">${i.label}</div>
          <div class="identity-value">${escapeHtml(i.value!)}</div>
        </div>
      `
      )
      .join('');

    sections.push({
      id: 'identity',
      title: 'Video Identity',
      html: `<div class="identity-grid">${identityItems}</div>`,
    });
  }

  // Key Insights - only if we have meaningful items
  if (hasRealList(data.keyInsights)) {
    sections.push({
      id: 'insights',
      title: 'Key Insights',
      html: `
        <div class="card">
          <ul class="insight-list">
            ${data.keyInsights.map((i) => `<li><span class="bullet"></span><span>${escapeHtml(i)}</span></li>`).join('')}
          </ul>
        </div>
      `,
    });
  }

  // Audience Insights - only if meaningful
  if (hasRealList(data.audienceInsights)) {
    sections.push({
      id: 'audience',
      title: 'Audience & Engagement',
      html: `
        <div class="card">
          <ul class="insight-list">
            ${data.audienceInsights.map((i) => `<li><span class="bullet"></span><span>${escapeHtml(i)}</span></li>`).join('')}
          </ul>
        </div>
      `,
    });
  }

  // Recommendations - only if meaningful
  if (hasRealList(data.recommendations)) {
    sections.push({
      id: 'recommendations',
      title: 'Recommendations',
      html: `
        <div class="card">
          <ol class="numbered-list">
            ${data.recommendations.map((r) => `<li><span class="number"></span><span>${escapeHtml(r)}</span></li>`).join('')}
          </ol>
        </div>
      `,
    });
  }

  // Always include the full analysis as prose (main content)
  sections.push({
    id: 'analysis',
    title: 'Full Analysis',
    html: `
      <div class="analysis-content">
        ${formatAnalysisText(data.rawAnalysis)}
      </div>
    `,
  });

  // Generate CSS
  const styles = generateStyles();

  // Build cover page
  const coverPage = `
    <section class="page cover-page">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <span class="badge">Analysis Report</span>
      </div>
      
      <div class="cover-content">
        <div class="eyebrow">Video Intelligence Report</div>
        <h1 class="cover-title">${escapeHtml(data.videoTitle)}</h1>
        <p class="cover-subtitle">AI-powered analysis of video content, engagement, and strategic insights.</p>
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
        <div class="meta-item meta-item-wide">
          <div class="meta-label">Video URL</div>
          <div class="meta-value"><a href="${escapeHtml(data.videoUrl)}" target="_blank">${escapeHtml(data.videoUrl)}</a></div>
        </div>
        ${
          data.processingTime
            ? `
        <div class="meta-item">
          <div class="meta-label">Processing Time</div>
          <div class="meta-value">${data.processingTime}s</div>
        </div>
        `
            : ''
        }
      </div>
      
      <div class="footer">
        <span class="footer-brand">Zlyzer</span>
        <span class="footer-text">AI-Powered Video Intelligence</span>
      </div>
    </section>
  `;

  // Build content page(s) - dynamic sections flow naturally
  const contentSections = sections
    .map(
      (section) => `
      <div class="section" id="${section.id}">
        <h2 class="section-title">${section.title}</h2>
        ${section.html}
      </div>
    `
    )
    .join('\n');

  const contentPage = `
    <section class="page content-page">
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Zlyzer" />
        <span class="badge">${escapeHtml(dateStr)}</span>
      </div>
      
      <div class="content-flow">
        ${contentSections}
      </div>
      
      <div class="confidential">
        <strong>Confidentiality Notice:</strong> This report contains analysis generated by Zlyzer's AI engine. 
        The insights are based on publicly available content and should be used for informational purposes only.
      </div>
      
      <div class="footer footer-relative">
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
    ${contentPage}
  </body>
</html>`;
}

/* ----------------------------- CSS Styles ----------------------------- */

function generateStyles(): string {
  return `
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
      background: linear-gradient(165deg, var(--navy) 0%, var(--midnight) 100%);
    }
    
    .cover-page {
      page-break-after: always;
    }
    
    .content-page {
      min-height: auto;
      page-break-inside: auto;
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
    
    h2, .section-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.06em;
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
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }
    
    .logo {
      width: 100px;
      height: auto;
    }
    
    .badge {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      padding: 6px 14px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 100px;
    }
    
    /* Cover Page */
    .cover-content {
      margin-top: 60px;
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
    
    .cover-title {
      margin-bottom: 12px;
    }
    
    .cover-subtitle {
      font-size: 16px;
      color: rgba(255,255,255,0.6);
      max-width: 480px;
    }
    
    /* Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      max-width: 560px;
    }
    
    .meta-item {
      padding: 14px 18px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
    }
    
    .meta-item-wide {
      grid-column: span 2;
    }
    
    .meta-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin-bottom: 4px;
    }
    
    .meta-value {
      font-size: 13px;
      color: #ffffff;
      word-break: break-all;
    }
    
    /* Sections */
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    
    .section:last-child {
      margin-bottom: 0;
    }
    
    .content-flow {
      margin-bottom: 32px;
    }
    
    /* Cards */
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 20px;
    }
    
    .card-highlight {
      background: linear-gradient(135deg, rgba(44,230,149,0.08) 0%, rgba(44,230,149,0.02) 100%);
      border-color: rgba(44,230,149,0.2);
    }
    
    .summary-text {
      font-size: 14px;
      line-height: 1.7;
      color: rgba(255,255,255,0.9);
      margin: 0;
    }
    
    /* Metrics */
    .metric-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .metric-card {
      flex: 1;
      min-width: 120px;
      text-align: center;
      padding: 16px 12px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
    }
    
    .metric-value {
      font-family: 'DM Sans', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--green);
      margin-bottom: 4px;
    }
    
    .metric-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
    }
    
    /* Identity */
    .identity-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .identity-card {
      flex: 1;
      min-width: 140px;
      padding: 16px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
    }
    
    .identity-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 6px;
    }
    
    .identity-value {
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      line-height: 1.4;
    }
    
    /* Lists */
    .insight-list {
      list-style: none;
      padding: 0;
    }
    
    .insight-list li {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 13px;
      color: rgba(255,255,255,0.85);
    }
    
    .insight-list li:last-child {
      border-bottom: none;
    }
    
    .insight-list .bullet {
      flex-shrink: 0;
      width: 5px;
      height: 5px;
      margin-top: 7px;
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
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      counter-increment: item;
    }
    
    .numbered-list li:last-child {
      border-bottom: none;
    }
    
    .numbered-list .number {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(44,230,149,0.12);
      color: var(--green);
      font-size: 12px;
      font-weight: 600;
    }
    
    .numbered-list .number::before {
      content: counter(item);
    }
    
    /* Analysis Content (Prose) */
    .analysis-content {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 24px;
    }
    
    .prose-p {
      font-size: 13px;
      line-height: 1.8;
      color: rgba(255,255,255,0.85);
      margin-bottom: 14px;
    }
    
    .prose-p:last-child {
      margin-bottom: 0;
    }
    
    .prose-h2 {
      font-family: 'DM Sans', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--green);
      margin: 24px 0 12px 0;
    }
    
    .prose-h2:first-child {
      margin-top: 0;
    }
    
    .prose-h3 {
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;
      margin: 20px 0 10px 0;
    }
    
    .prose-h4 {
      font-size: 14px;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
      margin: 16px 0 8px 0;
    }
    
    .prose-list {
      margin: 14px 0;
      padding-left: 20px;
      color: rgba(255,255,255,0.85);
    }
    
    .prose-list li {
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.6;
    }
    
    .prose-list-numbered {
      padding-left: 24px;
    }
    
    .prose-quote {
      margin: 16px 0;
      padding: 12px 16px;
      border-left: 3px solid var(--green);
      background: rgba(44,230,149,0.05);
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: rgba(255,255,255,0.8);
      font-size: 13px;
    }
    
    .prose-code {
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 12px;
      padding: 2px 6px;
      background: rgba(255,255,255,0.08);
      border-radius: 4px;
      color: var(--green);
    }
    
    .analysis-content strong {
      color: var(--green);
      font-weight: 600;
    }
    
    .analysis-content em {
      font-style: italic;
      color: rgba(255,255,255,0.9);
    }
    
    /* Footer */
    .footer {
      position: absolute;
      bottom: 36px;
      left: 56px;
      right: 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    
    .footer-relative {
      position: relative;
      margin-top: 32px;
      bottom: auto;
      left: auto;
      right: auto;
    }
    
    .footer-brand {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--green);
    }
    
    .footer-text {
      font-size: 11px;
      color: rgba(255,255,255,0.4);
    }
    
    /* Confidential Notice */
    .confidential {
      margin-top: 24px;
      padding: 14px 18px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      font-size: 10px;
      color: rgba(255,255,255,0.4);
      line-height: 1.6;
    }
    
    /* Print Adjustments */
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .page {
        margin: 0;
        box-shadow: none;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .card {
        page-break-inside: avoid;
      }
    }
  `;
}
