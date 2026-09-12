import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Clean, structured Markdown renderer for AI messages
 * Formats Markdown tables, callouts, lists, bold text, and handles raw <br> tags cleanly.
 */
const FormattedAIMessage = ({ content }) => {
  if (!content) return null;

  // Clean raw HTML linebreaks often returned in Markdown tables or lists
  const preprocessed = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ');

  return (
    <div className="ai-markdown-content" style={{ fontSize: '0.92rem', lineHeight: 1.65 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Structured Table styling
          table: ({ node, ...props }) => (
            <div
              style={{
                overflowX: 'auto',
                margin: '14px 0',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.86rem',
                }}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              style={{
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
              {...props}
            />
          ),
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, isHeader, ...props }) => (
            <tr
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background var(--transition-fast)',
              }}
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              style={{
                padding: '10px 14px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
              }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              style={{
                padding: '10px 14px',
                color: 'var(--text-primary)',
                verticalAlign: 'top',
                lineHeight: 1.55,
              }}
              {...props}
            />
          ),

          // Structured Blockquote / Callout box
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                margin: '14px 0',
                padding: '12px 18px',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                borderLeft: '3px solid var(--primary)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                fontStyle: 'normal',
                boxShadow: 'var(--shadow-xs)',
              }}
              {...props}
            />
          ),

          // Headings
          h1: ({ node, ...props }) => (
            <h4
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                margin: '16px 0 8px',
                color: 'var(--text-primary)',
              }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h5
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                margin: '14px 0 6px',
                color: 'var(--text-primary)',
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h6
              style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                margin: '12px 0 6px',
                color: 'var(--text-primary)',
              }}
              {...props}
            />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p
              style={{
                margin: '8px 0',
                color: 'var(--text-primary)',
                lineHeight: 1.65,
              }}
              {...props}
            />
          ),

          // Strong emphasis
          strong: ({ node, ...props }) => (
            <strong
              style={{
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul
              style={{
                margin: '8px 0 10px',
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{
                margin: '8px 0 10px',
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              style={{
                color: 'var(--text-primary)',
                lineHeight: 1.55,
              }}
              {...props}
            />
          ),

          // Inline Code & Code block
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                style={{
                  background: 'var(--bg-inset)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  color: 'var(--primary)',
                }}
                {...props}
              />
            ) : (
              <pre
                style={{
                  background: 'var(--bg-inset)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  overflowX: 'auto',
                  margin: '10px 0',
                  fontSize: '0.82rem',
                }}
              >
                <code {...props} />
              </pre>
            ),
        }}
      >
        {preprocessed}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedAIMessage;
