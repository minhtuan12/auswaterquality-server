import sanitizeHtmlFnc from 'sanitize-html'

export const ConvertHelper = {
  sanitizerSlug: (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },
  sanitizerHtml: (html: string) => {
    const result = sanitizeHtmlFnc(html, {
      allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'img', 'iframe'],
      allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src', 'alt', 'width', 'height'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    })
    return result
  },
}
