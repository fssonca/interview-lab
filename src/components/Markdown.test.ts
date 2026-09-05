import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { InlineMarkdown, Markdown } from './Markdown'

describe('study Markdown', () => {
  it('renders inline code, emphasis, lists, and fenced code', () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        children:
          'Given `a = [1, 2]`, **mutate** the list.\n\n- *One reference*\n- Another reference\n\n```python\na.append(3)\n```',
        leadHeading: 2,
      }),
    )
    expect(html).toContain(
      '<h2>Given <code>a = [1, 2]</code>, <strong>mutate</strong> the list.</h2>',
    )
    expect(html).toContain('<li><em>One reference</em></li>')
    expect(html).toContain('<pre><code class="language-python">a.append(3)')
  })
  it('renders GFM tables and strikethrough', () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        children: '| Name | Value |\n| --- | --- |\n| a | ~~old~~ new |',
      }),
    )
    expect(html).toContain('<table>')
    expect(html).toContain('<del>old</del>')
  })
  it('does not execute raw HTML, load embedded images, or permit javascript links', () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        children:
          '<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n![tracking](https://example.com/pixel)\n\n[bad](javascript:alert%281%29) [good](https://example.com)',
      }),
    )
    expect(html).not.toMatch(/<script|<img|onerror|javascript:/)
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('rel="noopener noreferrer"')
  })
  it('keeps answer labels inline and noninteractive', () => {
    const html = renderToStaticMarkup(
      createElement(InlineMarkdown, {
        children: '**Choose** `[1, 2, 3]` or [read more](https://example.com)',
      }),
    )
    expect(html).toContain('<strong>Choose</strong>')
    expect(html).toContain('<code>[1, 2, 3]</code>')
    expect(html).toContain('read more')
    expect(html).not.toMatch(/<p>|<a |<input/)
  })
})
