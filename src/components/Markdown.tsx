import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Root } from 'mdast'

function leadAsHeading(depth: 2 | 3) {
  return () => (tree: Root) => {
    const first = tree.children[0]
    if (first?.type === 'paragraph') {
      tree.children[0] = { type: 'heading', depth, children: first.children }
    }
  }
}

/** Content stays Markdown data: raw HTML and embedded images are never rendered. */
export function Markdown({
  children,
  className = '',
  id,
  leadHeading,
}: {
  children: string
  className?: string
  id?: string
  leadHeading?: 2 | 3
}) {
  return (
    <div id={id} className={`markdown ${className}`}>
      <ReactMarkdown
        skipHtml
        disallowedElements={['img']}
        remarkPlugins={[remarkGfm, ...(leadHeading ? [leadAsHeading(leadHeading)] : [])]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ href, children }) =>
            href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          table: ({ children }) => (
            <div className="markdown-table">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

/** No nested links or controls inside answer labels and topic-card buttons. */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <span className="markdown markdown-inline">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        allowedElements={['strong', 'em', 'code', 'del', 'br']}
        unwrapDisallowed
      >
        {children}
      </ReactMarkdown>
    </span>
  )
}
