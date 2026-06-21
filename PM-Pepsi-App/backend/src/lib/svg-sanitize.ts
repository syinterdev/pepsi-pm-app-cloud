/** Minimal SVG sanitizer (strip scripts/event handlers) before rasterize or store. */
export function sanitizeSvgMarkup(raw: string): string {
  const trimmed = raw.trim()
  if (!/<svg[\s>]/i.test(trimmed)) {
    throw new Error('Invalid SVG document')
  }
  let svg = trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
  svg = svg.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  svg = svg.replace(/javascript:/gi, '')
  if (/<script/i.test(svg)) {
    throw new Error('SVG contains disallowed script content')
  }
  return svg
}
