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
    // No executable tags/attributes/URLs, but the source stays visible as escaped text.
    expect(html).not.toMatch(/<script|<img/)
    expect(html).not.toMatch(/\sonerror="|onerror='/)
    expect(html).not.toContain('javascript:')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('rel="noopener noreferrer"')
  })
  it('preserves angle-bracket content such as JSX and generics as literal text', () => {
    const question = renderToStaticMarkup(
      createElement(Markdown, {
        children: 'When might `<Link prefetch={false}>` be reasonable?',
        leadHeading: 2,
      }),
    )
    expect(question).toContain('&lt;Link prefetch={false}&gt;')
    expect(question).not.toMatch(/When might\s+be reasonable\?/)

    const plain = renderToStaticMarkup(
      createElement(Markdown, {
        children: 'When might <Link prefetch={false}> be reasonable?',
      }),
    )
    expect(plain).toContain('When might')
    expect(plain).toContain('&lt;Link')
    expect(plain).toContain('be reasonable?')

    const generic = renderToStaticMarkup(
      createElement(Markdown, { children: 'function identity<T>(value: T): T' }),
    )
    expect(generic).toContain('identity&lt;T&gt;')

    const inline = renderToStaticMarkup(createElement(InlineMarkdown, { children: '<slug>' }))
    expect(inline).toContain('&lt;slug&gt;')

    const viewTransition = renderToStaticMarkup(
      createElement(InlineMarkdown, { children: '<ViewTransition>' }),
    )
    expect(viewTransition).toContain('&lt;ViewTransition&gt;')
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
