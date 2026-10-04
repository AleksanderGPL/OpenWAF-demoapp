import { workspace } from '../../utils/workspace.mjs'

// POST actions work with CRS's default allowed HTTP methods.
export default defineEventHandler(async event => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid task ID' })
  }
  let changes: number | bigint
  if (body?.action === 'complete' && typeof body.done === 'boolean') {
    changes = workspace.update(id, body.done).changes
  } else if (body?.action === 'delete') {
    changes = workspace.remove(id).changes
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Invalid task action' })
  }
  if (!changes) throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  return { ok: true }
})
