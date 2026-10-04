import { DatabaseSync } from 'node:sqlite'

// Deliberately ephemeral: restart to restore the shared demo workspace.
export function createWorkspace() {
  const db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE todos (id INTEGER PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, priority TEXT NOT NULL, title_pl TEXT);
    CREATE TABLE internal_notes (id INTEGER PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL, priority TEXT NOT NULL);
    INSERT INTO todos (id, title, done, priority) VALUES
      (1, 'Connect the demo workspace to OpenWAF', 0, 'high'),
      (2, 'Review the built-in security rules', 0, 'high'),
      (3, 'Compare direct and protected requests', 0, 'medium'),
      (4, 'Capture blocked requests in the dashboard', 0, 'medium'),
      (5, 'Prepare the presentation checklist', 1, 'low');
    INSERT INTO internal_notes VALUES (9001, 'INTERNAL DEMO NOTE: release token = demo-only-7c92', 0, 'high');
    UPDATE todos SET title_pl = 'Połącz aplikację demonstracyjną z OpenWAF' WHERE id = 1;
    UPDATE todos SET title_pl = 'Przejrzyj wbudowane reguły bezpieczeństwa' WHERE id = 2;
    UPDATE todos SET title_pl = 'Porównaj żądania bezpośrednie i chronione' WHERE id = 3;
    UPDATE todos SET title_pl = 'Zarejestruj zablokowane żądania w panelu' WHERE id = 4;
    UPDATE todos SET title_pl = 'Przygotuj listę kontrolną prezentacji' WHERE id = 5;`)
  return {
    // INTENTIONAL SQL injection. All other writes use prepared statements.
    search(query = '', language = 'en') {
      const title = language === 'pl' ? 'COALESCE(title_pl, title)' : 'title'
      return db.prepare(`SELECT id, ${title} AS title, done, priority FROM todos WHERE ${title} LIKE '%${query}%' ORDER BY id`).all()
    },
    add(title, priority) { return db.prepare('INSERT INTO todos (title, priority) VALUES (?, ?)').run(title, priority) },
    update(id, done) { return db.prepare('UPDATE todos SET done = ? WHERE id = ?').run(done ? 1 : 0, id) },
    remove(id) { return db.prepare('DELETE FROM todos WHERE id = ?').run(id) },
    close() { db.close() }
  }
}
export const workspace = createWorkspace()
export const exposedFiles = {
  '/demo/.env': '# Synthetic demonstration data only\nAPP_NAME=OpenWAF Todos\nDATABASE_URL=sqlite://demo-memory\nAPI_KEY=demo-only-not-a-real-secret\n',
  '/demo/.git/config': '[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = https://example.invalid/demo/todos.git\n'
}
// INTENTIONAL reflected XSS. This endpoint renders caller input as HTML.
export function previewHTML(text, language = 'en') {
  const title = language === 'pl' ? 'Podgląd notatki' : 'Note preview'
  const lang = language === 'pl' ? 'pl' : 'en'
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${title}</title><style>body{font:14px system-ui;color:#3f3f46;padding:20px;line-height:1.7}h3{margin:0 0 12px;color:#18181b}</style></head><body><h3>${title}</h3><div>${text}</div></body></html>`
}
