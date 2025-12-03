export function parseMarkdown(markdown: string): string {
  if (!markdown) return ""

  let html = markdown

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

  // Links
  html = html.replace(
    /\[([^\]]+)\]$$([^)]+)$$/g,
    '<a href="$2" class="text-[#8B1538] hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
  )

  // Unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
  html = html.replace(/(<li class="ml-4">.*<\/li>)/s, '<ul class="list-disc list-inside my-4 space-y-2">$1</ul>')

  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')

  // Paragraphs
  html = html
    .split("\n\n")
    .map((para) => {
      if (para.trim() && !para.startsWith("<")) {
        return `<p class="mb-4 leading-relaxed">${para}</p>`
      }
      return para
    })
    .join("\n")

  // Line breaks
  html = html.replace(/\n/g, "<br />")

  return html
}
