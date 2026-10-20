'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FileText,
  Folder,
  Hash,
  Lock,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchNotes, type NoteListItem } from '@/lib/api'
import { useBlog } from '@/lib/store'
import { useT } from '@/lib/i18n'

const FOLDERS_COLLAPSED_KEY = 'collapsed-folders'

/** 紧凑列表行：标题 + 日期/状态，一行搞定 */
function NoteRow({ note }: { note: NoteListItem }) {
  const navigateToNote = useBlog((s) => s.navigateToNote)
  const t = useT()
  return (
    <li>
      <button
        type="button"
        onClick={() => navigateToNote(note.slug)}
        className="group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-muted/70"
        aria-label={t.openNote(note.title)}
      >
        <span className="min-w-0 flex-1 truncate text-sm text-foreground group-hover:text-primary transition-colors">
          {note.title}
        </span>
        {!note.isPublic && <Lock className="size-3 shrink-0 text-muted-foreground/70" aria-hidden />}
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/80">
          {(note.noteDate ?? note.updatedAt).slice(0, 10)}
        </span>
      </button>
    </li>
  )
}

export function HomeView() {
  const search = useBlog((s) => s.search)
  const activeTag = useBlog((s) => s.activeTag)
  const setTag = useBlog((s) => s.setTag)
  const t = useT()

  const { data: notes, isLoading, isError } = useQuery({
    queryKey: ['notes'],
    queryFn: () => fetchNotes(false),
  })

  const visible = useMemo(() => {
    let list = notes ?? []
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.excerpt.toLowerCase().includes(q) ||
          n.path.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (activeTag) list = list.filter((n) => n.tags.includes(activeTag))
    return list
  }, [notes, search, activeTag])

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of notes ?? []) for (const t of n.tags) m.set(t, (m.get(t) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)
  }, [notes])

  const folders = useMemo(() => {
    const m = new Map<string, NoteListItem[]>()
    for (const n of visible) {
      const key = n.folder || ''
      const arr = m.get(key) ?? []
      arr.push(n)
      m.set(key, arr)
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
  }, [visible])

  // 文件夹折叠状态（记忆在 localStorage，收起的文件夹刷新后仍保持）
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(FOLDERS_COLLAPSED_KEY) || '{}') as Record<string, boolean>
    } catch {
      return {}
    }
  })
  const persist = (next: Record<string, boolean>) => {
    try {
      localStorage.setItem(FOLDERS_COLLAPSED_KEY, JSON.stringify(next))
    } catch {
      /* 忽略 */
    }
  }
  const toggleFolder = (folder: string) =>
    setCollapsed((p) => {
      const next = { ...p, [folder]: !p[folder] }
      persist(next)
      return next
    })
  const allCollapsed = folders.length > 0 && folders.every(([f]) => collapsed[f])
  const toggleAll = () => {
    const next: Record<string, boolean> = {}
    if (!allCollapsed) for (const [f] of folders) next[f] = true
    setCollapsed(next)
    persist(next)
  }

  return (
    <div>
      {/* 紧凑标题行：站名 + 数量统计 + 一键折叠 */}
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-serif text-xl font-bold tracking-tight">{t.allNotes}</h1>
        {notes && (
          <span className="text-xs text-muted-foreground">
            {t.publicCount(notes.filter((n) => n.isPublic).length)}
            {search.trim() && t.filteredCount(visible.length)}
          </span>
        )}
        {folders.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {allCollapsed ? (
              <>
                <ChevronsUpDown className="size-3.5" aria-hidden />
                {t.expandAll}
              </>
            ) : (
              <>
                <ChevronsDownUp className="size-3.5" aria-hidden />
                {t.collapseAll}
              </>
            )}
          </button>
        )}
      </div>

      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Hash className="size-2.5" aria-hidden />
            {t.tagFilter} {activeTag}
            <span className="text-muted-foreground">{t.noteCountSuffix(visible.length)}</span>
          </span>
          <button
            type="button"
            onClick={() => setTag(null)}
            className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {t.clearFilter}
          </button>
        </div>
      )}

      {tagCounts.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag(null)}
            className={'rounded-full border px-3 py-1 text-xs transition-colors ' + (activeTag === null ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground')}
          >
            {t.all}
          </button>
          {tagCounts.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTag(activeTag === tag ? null : tag)}
              className={
                'rounded-full border px-3 py-1 text-xs transition-colors ' +
                (activeTag === tag
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground')
              }
            >
              <Hash className="mr-0.5 inline size-2.5" aria-hidden />
              {tag}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-destructive">{t.loadFailed}</p>
      )}

      {!isLoading && notes && visible.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
          <p className="mt-3 font-medium">
            {notes.length === 0 ? t.emptyVault : t.noMatch}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {notes.length === 0 ? t.emptyVaultHint : t.emptyHint}
          </p>
        </div>
      )}

      {/* 文件夹分栏（大屏 3 栏 / 中屏 2 栏），文件夹名加大 */}
      {folders.length > 0 && (
        <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {folders.map(([folder, items]) => {
            const isCollapsed = !!collapsed[folder]
            return (
              <section
                key={folder || '(root)'}
                className="overflow-hidden rounded-xl border border-border/70 bg-card"
              >
                <button
                  type="button"
                  onClick={() => toggleFolder(folder)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  aria-expanded={!isCollapsed}
                >
                  <ChevronRight
                    className={'size-4 shrink-0 text-muted-foreground transition-transform ' + (isCollapsed ? '' : 'rotate-90')}
                    aria-hidden
                  />
                  <Folder className="size-4 shrink-0 text-primary/80" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-serif text-base font-semibold text-foreground">
                    {folder || t.uncategorized}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{t.folderCount(items.length)}</span>
                </button>
                {!isCollapsed && (
                  <ul className="border-t border-border/60 px-1.5 py-1.5">
                    {items.map((n) => (
                      <NoteRow key={n.slug} note={n} />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
