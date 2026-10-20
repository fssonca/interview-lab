import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Html, Paragraph, Parent, Root, Text } from 'mdast'

function leadAsHeading(depth: 2 | 3) {
  return () => (tree: Root) => {
    const first = tree.children[0]
    if (first?.type === 'paragraph') {
      tree.children[0] = { type: 'heading', depth, children: first.children }
    }
  }
}

/**
 * Angle-bracket content such as `<Link prefetch={false}>`, `<slug>`, or
 * `identity<T>` is parsed by micromark as HTML. With `skipHtml` that content
 * was silently dropped ("When might be reasonable?"). Convert HTML nodes back
 * to literal text so they stay visible without ever rendering raw HTML.
 */
function preserveHtmlAsText() {
  const flowParents = new Set(['root', 'blockquote', 'list', 'listItem', 'footnoteDefinition'])
  const toText = (value: string): Text => ({ type: 'text', value })
  const visit = (parent: Parent) => {
    const children = parent.children ?? []
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child.type === 'html') {
        const value = (child as Html).value
        if (flowParents.has(parent.type)) {
          const paragraph: Paragraph = { type: 'paragraph', children: [toText(value)] }
          children[i] = paragraph
        } else {
          children[i] = toText(value)
        }
      } else if ('children' in child && Array.isArray((child as Parent).children)) {
        visit(child as Parent)
      }
    }
  }
  return (tree: Root) => {
    visit(tree)
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
        remarkPlugins={[
          remarkGfm,
          preserveHtmlAsText,
          ...(leadHeading ? [leadAsHeading(leadHeading)] : []),
        ]}
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
        remarkPlugins={[remarkGfm, preserveHtmlAsText]}
        allowedElements={['strong', 'em', 'code', 'del', 'br']}
        unwrapDisallowed
      >
        {children}
      </ReactMarkdown>
    </span>
  )
}
