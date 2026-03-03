"use client";
import React from "react";

// ── Inline renderer: bold, inline-code, links ────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const re = /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  const parts: React.ReactNode[] = [];
  let last = 0, m: RegExpExecArray | null;
  let idx = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[0].startsWith("**")) {
      // bold
      parts.push(<strong key={idx++} style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>{m[2]}</strong>);
    } else if (m[0].startsWith("`")) {
      // inline code
      parts.push(
        <code key={idx++} style={{
          background: "rgba(99,102,241,0.15)",
          color: "#a78bfa",
          borderRadius: 4,
          padding: "1px 5px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.9em",
        }}>{m[3]}</code>
      );
    } else if (m[0].startsWith("[")) {
      // link
      parts.push(
        <a key={idx++} href={m[5]} target="_blank" rel="noopener noreferrer"
          style={{ color: "var(--color-accent-blue)", textDecoration: "underline", textDecorationColor: "rgba(99,102,241,0.4)" }}>
          {m[4]}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? <>{parts}</> : text;
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function parseTableRow(line: string): string[] {
  return line.split("|").filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
}
function isSepRow(line: string) { return parseTableRow(line).every(c => /^:?-+:?$/.test(c.trim())); }
function isTableLine(line: string) { return line.trim().startsWith("|") && line.trim().endsWith("|"); }

// ── Code block syntax highlighter ────────────────────────────────────────────
function highlightShell(code: string): React.ReactNode[] {
  return code.split("\n").map((line, i) => {
    if (line.trim().startsWith("#")) {
      return <div key={i} style={{ color: "#6b7280" }}>{line}</div>;
    }
    // color curl/echo/keywords
    const parts: React.ReactNode[] = [];
    const re = /(curl|echo|export|NEXT_ID|python3|if|then|fi|do|done|\$\w+|-[sXH]|POST|PATCH|GET|DELETE|'[^']*'|"[^"]*")/g;
    let last = 0, m: RegExpExecArray | null;
    let ki = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(<span key={ki++}>{line.slice(last, m.index)}</span>);
      const tok = m[0];
      let color = "#e5e7eb";
      if (/^(curl|echo|export|python3|if|then|fi|do|done)$/.test(tok)) color = "#4ade80";
      else if (/^(POST|PATCH|GET|DELETE)$/.test(tok)) color = "#fb923c";
      else if (tok.startsWith("$")) color = "#fbbf24";
      else if (tok.startsWith("-")) color = "#94a3b8";
      else if (tok.startsWith("'") || tok.startsWith('"')) color = "#86efac";
      parts.push(<span key={ki++} style={{ color }}>{tok}</span>);
      last = m.index + tok.length;
    }
    if (last < line.length) parts.push(<span key={ki++}>{line.slice(last)}</span>);
    return <div key={i}>{parts}</div>;
  });
}

// ── Main renderer ─────────────────────────────────────────────────────────────
export default function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const els: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```...```
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim().toLowerCase();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const code = codeLines.join("\n");
      const isShell = lang === "bash" || lang === "sh" || lang === "shell" || lang === "zsh" || lang === "";
      els.push(
        <div key={`code-${i}`} style={{
          background: "#0d1117",
          border: "1px solid var(--color-bg-border)",
          borderRadius: 6,
          padding: "12px 16px",
          marginBottom: 10,
          overflowX: "auto",
        }}>
          {lang && (
            <div style={{ fontSize: 10, color: "#4b5563", fontFamily: "var(--font-mono,monospace)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {lang}
            </div>
          )}
          <pre style={{ margin: 0, fontFamily: "var(--font-mono, monospace)", fontSize: 12, lineHeight: 1.65, color: "#e5e7eb" }}>
            {isShell ? highlightShell(code) : code}
          </pre>
        </div>
      );
      continue;
    }

    // Table block
    if (isTableLine(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableLine(lines[i])) { tableLines.push(lines[i]); i++; }
      const headers = parseTableRow(tableLines[0]);
      const rows = tableLines.slice(1).filter(l => !isSepRow(l)).map(parseTableRow);
      els.push(
        <div key={`tbl-${i}`} style={{ overflowX: "auto", marginBottom: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>{headers.map((h, ci) => (
                <th key={ci} style={{
                  padding: "5px 10px", textAlign: "left", fontWeight: 600,
                  color: "var(--color-text-dimmed)", fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--color-bg-border)",
                  background: "var(--color-bg-elevated)", whiteSpace: "nowrap",
                }}>{renderInline(h)}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--color-bg-border)" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: "5px 10px", color: "var(--color-text-secondary)",
                      fontFamily: ci === 0 ? "var(--font-mono)" : undefined,
                      fontSize: 12, verticalAlign: "top",
                    }}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      els.push(<h2 key={i} style={{ color: "var(--color-text-primary)", fontWeight: 700, fontSize: 16, marginTop: 20, marginBottom: 8 }}>{renderInline(line.slice(2))}</h2>);
    } else if (line.startsWith("## ")) {
      els.push(<h3 key={i} style={{ color: "var(--color-text-secondary)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 16, marginBottom: 6 }}>{line.slice(3)}</h3>);
    } else if (line.startsWith("### ")) {
      els.push(<h4 key={i} style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: 13, marginTop: 12, marginBottom: 4 }}>{renderInline(line.slice(4))}</h4>);

    // Checkboxes
    } else if (line.startsWith("- [ ] ")) {
      els.push(
        <div key={i} className="flex items-start gap-2" style={{ marginBottom: 4 }}>
          <span style={{ width: 14, height: 14, border: "1.5px solid var(--color-bg-border)", borderRadius: 3, display: "inline-block", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{renderInline(line.slice(6))}</span>
        </div>
      );
    } else if (/^- \[[xX]\] /.test(line)) {
      els.push(
        <div key={i} className="flex items-start gap-2" style={{ marginBottom: 4 }}>
          <span style={{ width: 14, height: 14, background: "var(--color-live)", borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span style={{ fontSize: 13, color: "var(--color-text-dimmed)", textDecoration: "line-through" }}>{renderInline(line.slice(6))}</span>
        </div>
      );

    // Bullet points
    } else if (/^(\s*)-\s/.test(line)) {
      const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
      const text = line.replace(/^\s*-\s/, "");
      els.push(
        <div key={i} className="flex items-start gap-2" style={{ marginBottom: 3, paddingLeft: indent * 8 }}>
          <span style={{ color: "var(--color-accent-blue)", fontSize: 12, flexShrink: 0, marginTop: 3 }}>●</span>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{renderInline(text)}</span>
        </div>
      );

    // HR
    } else if (/^---+$/.test(line.trim())) {
      els.push(<hr key={i} style={{ border: "none", borderTop: "1px solid var(--color-bg-border)", margin: "12px 0" }} />);

    // Blank line
    } else if (!line.trim()) {
      els.push(<div key={i} style={{ height: 6 }} />);

    // Paragraph
    } else {
      els.push(
        <p key={i} style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4, lineHeight: 1.6 }}>
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div>{els}</div>;
}
