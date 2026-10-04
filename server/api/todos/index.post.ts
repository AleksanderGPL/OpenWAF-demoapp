import { workspace } from '../../utils/workspace.mjs'
export default defineEventHandler(async event => {
  const body = await readBody(event)
  if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 || !['low', 'medium', 'high'].includes(body.priority)) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a title (1–200 characters) and a valid priority' })
  }
  const result = workspace.add(body.title.trim(), body.priority)
  setResponseStatus(event, 201)
  return { id: Number(result.lastInsertRowid) }
})
