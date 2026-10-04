import { previewHTML } from '../utils/workspace.mjs'
export default defineEventHandler(event => {
  const { text, lang } = getQuery(event)
  if (typeof text !== 'string' || text.length > 4000) throw createError({ statusCode: 400, statusMessage: 'Enter preview text (up to 4,000 characters)' })
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-store')
  return previewHTML(text, lang === 'pl' ? 'pl' : 'en')
})
