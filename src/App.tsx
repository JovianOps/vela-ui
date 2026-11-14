import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FilePlus2,
  FolderOpen,
  Save,
  Moon,
  Sun,
  X,
  FileCode2,
} from 'lucide-react'

type Mode = 'quality' | 'perf'

interface Tab {
  id: number
  name: string
  text: string
}

let nextId = 1
const newTab = (name = 'untitled'): Tab => ({ id: nextId++, name, text: '' })

const STORAGE = 'vela.prefs'

function loadPrefs(): { mode: Mode; dark: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (raw) {
      const p = JSON.parse(raw)
      return { mode: p.mode === 'perf' ? 'perf' : 'quality', dark: !!p.dark }
    }
  } catch {
    /* ignore */
  }
  return { mode: 'quality', dark: false }
}

export default function App() {
  const prefs = useMemo(loadPrefs, [])
  const [mode, setMode] = useState<Mode>(prefs.mode)
  const [dark, setDark] = useState(prefs.dark)
  const [tabs, setTabs] = useState<Tab[]>(() => [newTab('main.klo')])
  const [activeId, setActiveId] = useState(1)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  // reflect prefs onto <html> and persist
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('quality', mode === 'quality')
    el.classList.toggle('perf', mode === 'perf')
    el.classList.toggle('dark', dark)
    localStorage.setItem(STORAGE, JSON.stringify({ mode, dark }))
  }, [mode, dark])

  const setText = useCallback(
    (text: string) => {
      setTabs((ts) => ts.map((t) => (t.id === activeId ? { ...t, text } : t)))
    },
    [activeId],
  )

  const updateCursor = useCallback(() => {
    const el = areaRef.current
    if (!el) return
    const upto = el.value.slice(0, el.selectionStart)
    const rows = upto.split('\n')
    setCursor({ line: rows.length, col: (rows[rows.length - 1]?.length ?? 0) + 1 })
  }, [])

  const newFile = useCallback(() => {
    const t = newTab()
    setTabs((ts) => [...ts, t])
    setActiveId(t.id)
  }, [])

  const openFile = useCallback(() => fileRef.current?.click(), [])

    const saveFile = useCallback(() => {
    const blob = new Blob([active.text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = active.name
    a.click()
    URL.revokeObjectURL(a.href)
  }, [active])

  const closeTab = useCallback(
    (id: number) => {
      setTabs((ts) => {
        if (ts.length === 1) {
          const t = newTab()
          setActiveId(t.id)
          return [t]
        }
        const next = ts.filter((t) => t.id !== id)
        if (id === activeId) setActiveId(next[next.length - 1].id)
        return next
      })
    },
    [activeId],
  )

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return
      const k = e.key.toLowerCase()
      if (k === 'n') {
        e.preventDefault()
        newFile()
      } else if (k === 'o') {
        e.preventDefault()
        openFile()
      } else if (k === 's') {
        e.preventDefault()
        saveFile()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newFile, openFile, saveFile])

  const chars = active.text.length
  const bytes = new TextEncoder().encode(active.text).length
  const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const t: Tab = { id: nextId++, name: file.name, text: String(reader.result ?? '') }
      setTabs((ts) => [...ts, t])
      setActiveId(t.id)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const pill = (m: Mode, label: string) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={`press rounded px-2 py-1 text-[13px] ${
        mode === m ? 'bg-accent text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* top bar */}
      <header
        className="glass flex h-12 items-center gap-3 border-b px-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <FileCode2 size={16} className="text-accent" />
          <span className="text-[15px] font-semibold tracking-tight">vela</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded border p-0.5"
            style={{ borderColor: 'var(--border)' }}
            role="group"
            aria-label="quality or performance mode"
          >
            {pill('quality', 'Quality')}
            {pill('perf', 'Perf')}
          </div>

          <button
            onClick={() => setDark((d) => !d)}
            aria-label="toggle dark mode"
            className="press flex h-7 w-7 items-center justify-center rounded hover:bg-[var(--panel)]"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <div className="mx-1 h-5 w-px" style={{ background: 'var(--border)' }} />

          <button onClick={newFile} className="press flex items-center gap-1.5 rounded px-2 py-1 text-[13px] hover:bg-[var(--panel)]">
            <FilePlus2 size={14} /> New
          </button>
          <button onClick={openFile} className="press flex items-center gap-1.5 rounded px-2 py-1 text-[13px] hover:bg-[var(--panel)]">
            <FolderOpen size={14} /> Open
          </button>
          <button onClick={saveFile} className="press flex items-center gap-1.5 rounded px-2 py-1 text-[13px] hover:bg-[var(--panel)]">
            <Save size={14} /> Save
          </button>
        </div>
      </header>

      {/* tab bar */}
      <div
        className="glass flex h-9 items-stretch gap-1 border-b px-2"
        style={{ borderColor: 'var(--border)' }}
      >
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`fade-in group flex items-center gap-2 rounded px-2 text-[13px] ${
              t.id === activeId ? 'bg-[var(--panel)]' : 'hover:bg-[var(--panel)]'
            }`}
          >
            <button
              onClick={() => setActiveId(t.id)}
              className="flex items-center gap-1.5 py-1.5"
            >
              <FileCode2 size={13} className={t.id === activeId ? 'text-accent' : ''} />
              <span className="max-w-40 truncate">{t.name}</span>
            </button>
            <button
              onClick={() => closeTab(t.id)}
              aria-label={`close ${t.name}`}
              className="rounded p-0.5 opacity-50 hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* editor */}
      <textarea
        ref={areaRef}
        value={active.text}
        onChange={(e) => setText(e.target.value)}
        onKeyUp={updateCursor}
        onClick={updateCursor}
        spellCheck={false}
        wrap="off"
        aria-label="editor"
        className="fade flex-1 resize-none border-0 p-4 outline-none"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      />

      {/* status bar */}
      <footer
        className="flex h-7 items-center gap-4 border-t px-4 text-[12px]"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <span>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span>{chars} chars</span>
        <span>{size}</span>
        <span className="ml-auto uppercase">{mode}</span>
      </footer>

      <input
        ref={fileRef}
        type="file"
        accept=".klo,.txt,.md,.rs,.py,.js,.json"
        className="hidden"
        onChange={onPick}
      />
    </div>
  )
}