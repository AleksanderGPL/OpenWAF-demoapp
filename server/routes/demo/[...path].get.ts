import { exposedFiles } from '../../utils/workspace.mjs'
export default defineEventHandler(event => {
  const content = exposedFiles[getRequestURL(event).pathname as keyof typeof exposedFiles]
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Demo file not found' })
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-store')
  return content
})
