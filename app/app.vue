<script setup lang="ts">
import en from './locales/en'
import pl from './locales/pl'
type Todo = { id: number; title: string; done: number; priority: 'high' | 'medium' | 'low' }
const locale = ref<'en' | 'pl'>('en')
const dark = ref(false)
const t = (key: keyof typeof en) => (locale.value === 'pl' ? pl : en)[key]
const section = ref<'tasks' | 'lab'>('tasks')
const todos = ref<Todo[]>([])
const query = ref('')
const filter = ref('all')
const title = ref('')
const priority = ref('medium')
const error = ref('')
const busy = ref(false)
const searchBusy = ref(false)
let searchSequence = 0
const total = ref(0)
const completed = ref(0)
const visible = computed(() => todos.value.filter(todo => filter.value === 'all' || Boolean(todo.done) === (filter.value === 'done')))
const progress = computed(() => total.value ? Math.round(completed.value / total.value * 100) : 0)
async function refresh() {
  const sequence = ++searchSequence
  searchBusy.value = true
  error.value = ''
  try {
    const result = await $fetch<Todo[]>('/api/todos', { query: { q: query.value, lang: locale.value } })
    if (sequence !== searchSequence) return
    todos.value = result
    if (!query.value) { total.value = result.length; completed.value = result.filter(todo => todo.done).length }
  } catch { if (sequence === searchSequence) error.value = t('error') }
  finally { if (sequence === searchSequence) searchBusy.value = false }
}
async function mutate(action: () => Promise<unknown>) {
  busy.value = true
  error.value = ''
  try { await action(); query.value = ''; await refresh() }
  catch { error.value = t('error') }
  finally { busy.value = false }
}
async function add() {
  if (!title.value.trim()) return
  await mutate(async () => { await $fetch('/api/todos', { method: 'POST', body: { title: title.value, priority: priority.value } }); title.value = '' })
}
const scenarios = [
  { id: 'sql', name: 'sql', description: 'sqlDescription', family: 'sqlFamily', path: '/api/todos', param: 'q', payload: "' UNION SELECT id,title,done,priority FROM internal_notes-- " },
  { id: 'xss', name: 'xss', description: 'xssDescription', family: 'xssFamily', path: '/api/preview', param: 'text', payload: '<script>document.body.textContent="XSS executed · JavaScript ran in the preview"</' + 'script>' },
  { id: 'env', name: 'env', description: 'envDescription', family: 'envFamily', path: '/demo/.env', param: '', payload: '' },
  { id: 'git', name: 'git', description: 'gitDescription', family: 'gitFamily', path: '/demo/.git/config', param: '', payload: '' }
] as const
const selected = ref(0)
const scenario = computed(() => scenarios[selected.value]!)
const requestPath = computed(() => scenario.value.path + (scenario.value.param ? '?' + new URLSearchParams({ [scenario.value.param]: scenario.value.payload, lang: locale.value }).toString() : ''))
const sending = ref(false)
const result = ref<{ status: number; body: string } | null>(null)
const previewSrc = ref('')
const note = ref(en.defaultNote)
watch(selected, () => { result.value = null; previewSrc.value = '' })
async function run() {
  sending.value = true
  result.value = null
  previewSrc.value = ''
  const path = requestPath.value
  try {
    const response = await fetch(path)
    const body = await response.text()
    result.value = { status: response.status, body }
    // srcdoc displays the exact fetched response; scripts are isolated from the parent.
    if (scenario.value.id === 'xss' && response.ok) previewSrc.value = body
  } catch { result.value = { status: 0, body: t('failed') } }
  finally { sending.value = false }
}
async function previewNote() {
  try {
    const response = await fetch('/api/preview?' + new URLSearchParams({ text: note.value, lang: locale.value }))
    const body = await response.text()
    result.value = { status: response.status, body }
    previewSrc.value = response.ok ? body : ''
  } catch { error.value = t('error') }
}
onMounted(() => {
  locale.value = localStorage.getItem('openwaf-demo-language') === 'pl' ? 'pl' : 'en'
  dark.value = localStorage.getItem('openwaf-demo-theme') === 'dark'
  refresh()
})
watch(locale, (value, previous) => {
  localStorage.setItem('openwaf-demo-language', value)
  if (note.value === (previous === 'pl' ? pl : en).defaultNote) note.value = t('defaultNote')
  refresh()
})
watch(dark, value => localStorage.setItem('openwaf-demo-theme', value ? 'dark' : 'light'))
useHead(() => ({ htmlAttrs: { lang: locale.value, class: dark.value ? 'dark' : '' } }))
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <a class="brand" href="/" aria-label="OpenWAF Todo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/></svg><span>OpenWAF <span class="brand-light">/ todo</span></span></a>
      <p class="nav-label">{{ t('workspace') }}</p>
      <nav><button :class="{ selected: section === 'tasks' }" @click="section = 'tasks'"><span class="nav-icon">☷</span>{{ t('tasks') }}<span class="nav-count">{{ total }}</span></button><button :class="{ selected: section === 'lab' }" @click="section = 'lab'"><span class="nav-icon">◇</span>{{ t('lab') }}</button></nav>
      <div class="sidebar-bottom"><div class="avatar">OW</div><div><strong>{{ t('shared') }}</strong><small>{{ t('demo') }}</small></div><span class="online-dot" /></div>
    </aside>
    <div class="main-shell">
      <header class="topbar"><span>{{ t(section) }}</span><div class="top-actions"><span class="environment"><span class="online-dot" />{{ t('local') }}</span><button class="theme-button" :aria-label="t('theme')" @click="dark = !dark">{{ dark ? '☀' : '☾' }}</button><select v-model="locale" :aria-label="t('language')"><option value="en">English</option><option value="pl">Polski</option></select></div></header>
      <main>
        <template v-if="section === 'tasks'">
          <div class="page-heading"><div><p class="eyebrow">OPENWAF / TODO</p><h1>{{ t('title') }}</h1><p class="subtitle">{{ t('subtitle') }}</p></div><span class="badge neutral">{{ t('shared') }}</span></div>
          <div class="stats"><div class="stat"><span>{{ t('total') }}</span><strong>{{ total }}<span class="stat-symbol">☷</span></strong></div><div class="stat"><span>{{ t('pending') }}</span><strong>{{ total - completed }}<span class="stat-symbol sky">◷</span></strong></div><div class="stat"><span>{{ t('completed') }}</span><strong>{{ completed }}<span class="stat-symbol green">✓</span></strong></div></div>
          <section class="card task-card"><div class="card-heading"><div><h2>{{ t('list') }}</h2><p>{{ t('listHint') }}</p></div><span class="badge sky">{{ progress }}%</span></div>
            <form class="add-form" @submit.prevent="add"><input v-model="title" required maxlength="200" :placeholder="t('taskPlaceholder')" :aria-label="t('taskPlaceholder')"><select v-model="priority" :aria-label="t('priority')"><option value="high">{{ t('high') }}</option><option value="medium">{{ t('medium') }}</option><option value="low">{{ t('low') }}</option></select><button class="primary" :disabled="busy">＋ {{ t('add') }}</button></form>
            <div class="list-toolbar"><div class="filters"><button v-for="item in ['all', 'active', 'done'] as const" :key="item" :class="{ current: filter === item }" @click="filter = item">{{ t(item) }}</button></div><form class="search" @submit.prevent="refresh"><span>⌕</span><input v-model="query" :placeholder="t('search')" :aria-label="t('search')"><button :disabled="searchBusy" :aria-label="t('search')">↵</button></form></div>
            <p v-if="error" class="error" role="alert">{{ error }}</p>
            <div class="todo-list" :aria-busy="busy || searchBusy"><div v-for="todo in visible" :key="todo.id" class="todo-row"><input type="checkbox" :checked="Boolean(todo.done)" :disabled="busy" :aria-label="t('toggle') + ': ' + todo.title" @change="mutate(() => $fetch('/api/todos/' + todo.id, { method: 'POST', body: { action: 'complete', done: !todo.done } }))"><span class="todo-title" :class="{ finished: todo.done }">{{ todo.title }}</span><span class="badge" :class="todo.priority">{{ t(todo.priority) }}</span><button class="delete" :disabled="busy" :aria-label="t('delete') + ': ' + todo.title" @click="mutate(() => $fetch('/api/todos/' + todo.id, { method: 'POST', body: { action: 'delete' } }))">×</button></div><p v-if="!visible.length" class="empty">{{ t('empty') }}</p></div>
            <div class="progress-footer"><span>{{ t('progress') }}</span><div class="progress-track"><div :style="{ width: progress + '%' }" /></div><span>{{ completed }} / {{ total }}</span></div>
          </section>
          <button class="lab-callout" @click="section = 'lab'"><span class="callout-icon">◇</span><span><strong>{{ t('lab') }}</strong><small>{{ t('labSubtitle') }}</small></span><span class="arrow">→</span></button>
        </template>
        <template v-else>
          <div class="page-heading"><div><p class="eyebrow">OPENWAF / LAB</p><h1>{{ t('labTitle') }}</h1><p class="subtitle">{{ t('labSubtitle') }}</p></div><span class="badge sky">{{ t('builtin') }}</span></div>
          <p class="info">ⓘ {{ t('labHint') }}</p>
          <div class="lab-grid"><div class="scenario-list"><button v-for="(item, index) in scenarios" :key="item.id" class="scenario" :class="{ chosen: selected === index }" @click="selected = index"><span class="eyebrow">0{{ index + 1 }} / {{ t(item.family) }}</span><strong>{{ t(item.name) }}</strong><span>{{ t(item.description) }}</span></button></div>
            <section class="card request-panel"><div class="card-heading"><h2>{{ t(scenario.name) }}</h2><span class="badge neutral">GET</span></div><div class="request-content"><label>{{ t('request') }}</label><pre>{{ requestPath }}</pre><button class="primary" :disabled="sending" @click="run">{{ sending ? t('running') : t('run') }} <span>↗</span></button><div class="response-heading"><label>{{ t('response') }}</label><span v-if="result" class="badge" :class="result.status === 403 ? 'high' : 'sky'">{{ result.status || '—' }}</span></div><template v-if="result"><p class="result-label">{{ result.status === 403 ? t('blocked') : result.status >= 200 && result.status < 300 ? t('reached') : t('failed') }}</p><pre class="response-body">{{ result.body }}</pre><small>{{ t('inspect') }}</small></template><div v-else class="waiting">{{ t('waiting') }}</div><template v-if="scenario.id === 'xss'"><label class="note-label">{{ t('note') }}</label><textarea v-model="note" maxlength="4000" :placeholder="t('notePlaceholder')" :aria-label="t('note')" /><button class="secondary" @click="previewNote">{{ t('openPreview') }}</button></template><template v-if="previewSrc"><label class="note-label">{{ t('preview') }}</label><iframe :srcdoc="previewSrc" sandbox="allow-scripts" :title="t('preview')" /><small>{{ t('previewHint') }}</small></template></div></section>
          </div>
        </template>
        <footer><span>{{ t('footer') }}</span><span>{{ t('synthetic') }}</span></footer>
      </main>
    </div>
  </div>
</template>
