import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage = ({ content }: MarkdownMessageProps) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none markdown-content">
      <style>{`
        .markdown-content .katex-display {
          margin: 1rem 0;
          overflow-x: auto;
          padding: 0.5rem;
          background: hsl(var(--muted) / 0.3);
          border-radius: 0.5rem;
        }
        .markdown-content .katex {
          font-size: 1.1em;
        }
        .markdown-content .diagram-block {
          font-family: 'Courier New', Courier, monospace;
          line-height: 1.4;
          white-space: pre;
          overflow-x: auto;
          background: linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.7) 100%);
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem;
          padding: 1rem;
          margin: 1rem 0;
        }
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          font-size: 0.9em;
        }
        .markdown-content th,
        .markdown-content td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .markdown-content th {
          background: hsl(var(--muted));
          font-weight: 600;
        }
        .markdown-content tr:nth-child(even) {
          background: hsl(var(--muted) / 0.3);
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold mb-2 mt-2 first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-3 italic bg-primary/5 py-2 rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const content = String(children).replace(/\n$/, '');
            
            // Detect ASCII diagrams (contains box-drawing characters or arrows)
            const isDiagram = /[┌┐└┘│─├┤┬┴┼╔╗╚╝║═╠╣╦╩╬→←↑↓↔]/.test(content) ||
                             (/[\-\|+]/.test(content) && content.includes('->'));
            
            if (isDiagram || (match && match[1] === 'diagram')) {
              return (
                <div className="diagram-block text-foreground">
                  {content}
                </div>
              );
            }
            
            return match ? (
              <code className={`${className} block bg-muted p-3 rounded-lg my-3 overflow-x-auto text-sm font-mono`} {...props}>
                {children}
              </code>
            ) : (
              <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-3 overflow-hidden">{children}</pre>,
          hr: () => <hr className="my-4 border-muted-foreground/30" />,
          a: ({ children, href }) => (
            <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
