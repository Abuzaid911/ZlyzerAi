// components/analysis/MarkdownRenderer.tsx
import { memo, useMemo } from 'react';
import clsx from 'clsx';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

type BlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'paragraph'
  | 'bullet-list'
  | 'numbered-list'
  | 'blockquote'
  | 'code-block'
  | 'table'
  | 'hr';

interface ParsedBlock {
  type: BlockType;
  content: string[];
  language?: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Parses inline markdown formatting (bold, italic, code, links)
 */
function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Pattern matches: **bold**, *italic*, `code`, [link](url)
  const inlinePattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;

  let lastIndex = 0;
  let match;

  while ((match = inlinePattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold: **text**
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italic: *text*
      parts.push(
        <em key={key++} className="italic text-white/90">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Inline code: `code`
      parts.push(
        <code
          key={key++}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-[#2ce695]"
        >
          {match[6]}
        </code>
      );
    } else if (match[7]) {
      // Link: [text](url)
      parts.push(
        <a
          key={key++}
          href={match[9]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2ce695] underline decoration-[#2ce695]/30 underline-offset-2 hover:decoration-[#2ce695] transition-colors"
        >
          {match[8]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Detects the type of a line for block parsing
 */
function detectLineType(
  line: string
): { type: BlockType; content: string; level?: number; language?: string } | null {
  const trimmed = line.trim();

  // Empty line
  if (!trimmed) return null;

  // Horizontal rule
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
    return { type: 'hr', content: '' };
  }

  // Headers
  const h1Match = trimmed.match(/^#\s+(.+)$/);
  if (h1Match) return { type: 'h1', content: h1Match[1] };

  const h2Match = trimmed.match(/^##\s+(.+)$/);
  if (h2Match) return { type: 'h2', content: h2Match[1] };

  const h3Match = trimmed.match(/^###\s+(.+)$/);
  if (h3Match) return { type: 'h3', content: h3Match[1] };

  const h4Match = trimmed.match(/^####\s+(.+)$/);
  if (h4Match) return { type: 'h4', content: h4Match[1] };

  // Code block start
  const codeBlockMatch = trimmed.match(/^```(\w*)$/);
  if (codeBlockMatch) {
    return { type: 'code-block', content: '', language: codeBlockMatch[1] || 'text' };
  }

  // Blockquote
  const blockquoteMatch = trimmed.match(/^>\s*(.*)$/);
  if (blockquoteMatch) {
    return { type: 'blockquote', content: blockquoteMatch[1] };
  }

  // Bullet list
  const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
  if (bulletMatch) {
    return { type: 'bullet-list', content: bulletMatch[1] };
  }

  // Numbered list
  const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
  if (numberedMatch) {
    return { type: 'numbered-list', content: numberedMatch[1] };
  }

  // Table row (contains |)
  if (trimmed.includes('|') && trimmed.startsWith('|')) {
    return { type: 'table', content: trimmed };
  }

  // Default to paragraph
  return { type: 'paragraph', content: trimmed };
}

/**
 * Parses markdown text into structured blocks
 */
function parseMarkdown(text: string): ParsedBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const lineInfo = detectLineType(lines[i]);

    if (!lineInfo) {
      i++;
      continue;
    }

    // Handle code blocks (multi-line)
    if (lineInfo.type === 'code-block') {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code-block',
        content: codeLines,
        language: lineInfo.language,
      });
      i++; // Skip closing ```
      continue;
    }

    // Handle tables (multi-line)
    if (lineInfo.type === 'table') {
      const tableLines: string[] = [lineInfo.content];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (nextLine.includes('|')) {
          tableLines.push(nextLine);
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'table', content: tableLines });
      continue;
    }

    // Handle consecutive list items
    if (lineInfo.type === 'bullet-list' || lineInfo.type === 'numbered-list') {
      const listItems: string[] = [lineInfo.content];
      const listType = lineInfo.type;
      i++;
      while (i < lines.length) {
        const nextInfo = detectLineType(lines[i]);
        if (nextInfo?.type === listType) {
          listItems.push(nextInfo.content);
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: listType, content: listItems });
      continue;
    }

    // Handle consecutive blockquotes
    if (lineInfo.type === 'blockquote') {
      const quoteLines: string[] = [lineInfo.content];
      i++;
      while (i < lines.length) {
        const nextInfo = detectLineType(lines[i]);
        if (nextInfo?.type === 'blockquote') {
          quoteLines.push(nextInfo.content);
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'blockquote', content: quoteLines });
      continue;
    }

    // Handle consecutive paragraphs (merge into one)
    if (lineInfo.type === 'paragraph') {
      const paragraphLines: string[] = [lineInfo.content];
      i++;
      while (i < lines.length) {
        const nextInfo = detectLineType(lines[i]);
        if (nextInfo?.type === 'paragraph') {
          paragraphLines.push(nextInfo.content);
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'paragraph', content: paragraphLines });
      continue;
    }

    // Single-line blocks (headers, hr)
    blocks.push({ type: lineInfo.type, content: [lineInfo.content] });
    i++;
  }

  return blocks;
}

/**
 * Parses a table from pipe-separated lines
 */
function parseTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell && !cell.match(/^[-:]+$/));

  const headers = parseRow(lines[0]);
  if (headers.length === 0) return null;

  // Skip separator row (line with dashes)
  const dataStartIndex = lines[1].includes('-') ? 2 : 1;

  const rows: string[][] = [];
  for (let i = dataStartIndex; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.length > 0) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

/**
 * Renders a parsed block to React elements
 */
function renderBlock(block: ParsedBlock, index: number): React.ReactNode {
  switch (block.type) {
    case 'h1':
      return (
        <h1
          key={index}
          className="mt-6 mb-4 text-2xl font-bold tracking-tight text-white first:mt-0"
        >
          {parseInlineFormatting(block.content[0])}
        </h1>
      );

    case 'h2':
      return (
        <h2
          key={index}
          className="mt-6 mb-3 text-xl font-semibold tracking-tight text-[#2ce695]"
        >
          {parseInlineFormatting(block.content[0])}
        </h2>
      );

    case 'h3':
      return (
        <h3 key={index} className="mt-5 mb-2 text-lg font-semibold text-white/95">
          {parseInlineFormatting(block.content[0])}
        </h3>
      );

    case 'h4':
      return (
        <h4 key={index} className="mt-4 mb-2 text-base font-medium text-white/90">
          {parseInlineFormatting(block.content[0])}
        </h4>
      );

    case 'paragraph':
      return (
        <p key={index} className="mb-4 leading-relaxed text-white/85">
          {parseInlineFormatting(block.content.join(' '))}
        </p>
      );

    case 'bullet-list':
      return (
        <ul key={index} className="mb-4 ml-1 space-y-2">
          {block.content.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2ce695]" />
              <span className="text-white/85 leading-relaxed">
                {parseInlineFormatting(item)}
              </span>
            </li>
          ))}
        </ul>
      );

    case 'numbered-list':
      return (
        <ol key={index} className="mb-4 ml-1 space-y-2">
          {block.content.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2ce695]/15 text-xs font-semibold text-[#2ce695]">
                {i + 1}
              </span>
              <span className="text-white/85 leading-relaxed pt-0.5">
                {parseInlineFormatting(item)}
              </span>
            </li>
          ))}
        </ol>
      );

    case 'blockquote':
      return (
        <blockquote
          key={index}
          className="mb-4 border-l-4 border-[#2ce695]/50 bg-[#2ce695]/5 py-3 pl-4 pr-4 rounded-r-lg"
        >
          {block.content.map((line, i) => (
            <p key={i} className="text-white/80 italic leading-relaxed">
              {parseInlineFormatting(line)}
            </p>
          ))}
        </blockquote>
      );

    case 'code-block':
      return (
        <div key={index} className="mb-4 overflow-hidden rounded-xl border border-white/10">
          {block.language && block.language !== 'text' && (
            <div className="border-b border-white/10 bg-white/5 px-4 py-1.5">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                {block.language}
              </span>
            </div>
          )}
          <pre className="overflow-x-auto bg-black/40 p-4">
            <code className="font-mono text-sm text-[#2ce695]/90 leading-relaxed">
              {block.content.join('\n')}
            </code>
          </pre>
        </div>
      );

    case 'table': {
      const tableData = parseTable(block.content);
      if (!tableData) return null;

      return (
        <div key={index} className="mb-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {tableData.headers.map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70"
                  >
                    {parseInlineFormatting(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tableData.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={clsx(
                    'transition-colors hover:bg-white/[.03]',
                    rowIndex % 2 === 0 ? 'bg-transparent' : 'bg-white/[.02]'
                  )}
                >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-sm text-white/85">
                      {parseInlineFormatting(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'hr':
      return (
        <hr key={index} className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      );

    default:
      return null;
  }
}

/**
 * Full markdown renderer component with support for:
 * - Headers (h1-h4)
 * - Bold/Italic text
 * - Inline code
 * - Code blocks with language labels
 * - Bullet and numbered lists
 * - Tables with alternating rows
 * - Blockquotes
 * - Horizontal rules
 * - Links
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={clsx('prose-custom', className)}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
});

