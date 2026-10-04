import { workspace } from '../../utils/workspace.mjs'
export default defineEventHandler(event => {
  const { q, lang } = getQuery(event)
  if (q !== undefined && typeof q !== 'string') throw createError({ statusCode: 400, statusMessage: 'Search must be text' })
  try { return workspace.search(q || '', lang === 'pl' ? 'pl' : 'en') }
  catch { throw createError({ statusCode: 400, statusMessage: 'Invalid search expression' }) }
})
