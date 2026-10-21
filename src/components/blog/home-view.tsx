'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FileText,
  Folder,
  Hash,
  Lock,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchNotes, fetchSearchIndex, type NoteListItem } from '@/lib/api'
import { useBlog } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { T } from '@/components/blog/t-text'

const FOLDERS_COLLAPSED_KEY = 'collapsed-folders'

/** 大屏 3 列 / 中屏 2 列 / 小屏 1 列。文件夹按列独立排布，展开一个不影响其它列。 */
function useColumnCount() {
  const [n, setN] = useState(1)
  useEffect(() => {
    const calc = () => setN(window.innerWidth >= 1280 ? 3 : window.innerWidth >= 1024 ? 2 : 1)
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return n
}

/** 紧凑列表行：标题 + 日期/状态，一行搞定 */
const NoteRow = memo(function NoteRow({ note, snippet }: { note: NoteListItem; snippet?: string }) {
  const navigateToNote = useBlog((s) => s.navigateToNote)
  const t = useT()
  return (
    <li className="break-inside-avoid">
      <button
        type="button"
        onClick={() => navigateToNote(note.slug)}
        className="group flex w-full items-start gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-muted/70"
        aria-label={t.openNote(note.title)}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-foreground transition-colors group-hover:text-primary">
            {note.title}
          </span>
          {snippet && (
            <span className="mt-0.5 block truncate text-[11px] leading-4 text-muted-foreground/80">
              {snippet}
            </span>
          )}
        </span>
        {!note.isPublic && <Lock className="mt-0.5 size-3 shrink-0 text-muted-foreground/70" aria-hidden />}
        <span className="mt-0.5 shrink-0 text-[11px] tabular-nums text-muted-foreground/80">
          {(note.noteDate ?? note.updatedAt).slice(0, 10)}
        </span>
      </button>
    </li>
  )
})

export function HomeView() {
  const search = useBlog((s) => s.search)
  const activeTag = useBlog((s) => s.activeTag)
  const setTag = useBlog((s) => s.setTag)
  const t = useT()
  const q = search.trim().toLowerCase()

  const { data: notes, isLoading, isError } = useQuery({
    queryKey: ['notes'],
    queryFn: () => fetchNotes(false),
  })

  // 全文索引：只在真的输入了搜索词时才拉（几十 KB，别拖慢首屏）。
  // 原先搜索只匹配「标题 + 120 字摘要」，正文中部的词根本搜不到，
  // 与界面上「搜索标题、正文、路径、标签」的承诺不符。
  const { data: bodyIndex } = useQuery({
    queryKey: ['search-index'],
    queryFn: fetchSearchIndex,
    enabled: q.length > 0,
    staleTime: 5 * 60_000,
  })

  const { visible, snippets } = useMemo(() => {
    let list = notes ?? []
    const snips = new Map<string, string>()
    if (q) {
      list = list.filter((n) => {
        const meta = [n.title, n.path, n.tags.join(' '), n.excerpt].join('\n').toLowerCase()
        if (meta.includes(q)) return true
        const body = bodyIndex?.[n.slug]
        if (!body) return false
        const i = body.toLowerCase().indexOf(q)
        if (i < 0) return false
        const start = Math.max(0, i - 24)
        const end = Math.min(body.length, i + q.length + 70)
        snips.set(
          n.slug,
          (start > 0 ? '…' : '') +
            body.slice(start, end).replace(/\s+/g, ' ').trim() +
            (end < body.length ? '…' : '')
        )
        return true
      })
    }
    if (activeTag) list = list.filter((n) => n.tags.includes(activeTag))
    return { visible: list, snippets: snips }
  }, [notes, q, activeTag, bodyIndex])

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of notes ?? []) for (const t of n.tags) m.set(t, (m.get(t) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)
  }, [notes])

  // 未分组（库根目录下的笔记）单独一块，不混进文件夹列
  const { rootNotes, folders } = useMemo(() => {
    const m = new Map<string, NoteListItem[]>()
    for (const n of visible) {
      const key = n.folder || ''
      const arr = m.get(key) ?? []
      arr.push(n)
      m.set(key, arr)
    }
    const root = m.get('') ?? []
    m.delete('')
    return { rootNotes: root, folders: [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)) }
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
  // 「未分组」也参与一键折叠，所以把它的 key（''）一起算进分组集合
  const sectionKeys = useMemo(
    () => [...(rootNotes.length > 0 ? [''] : []), ...folders.map(([f]) => f)],
    [rootNotes, folders]
  )
  const allCollapsed = sectionKeys.length > 0 && sectionKeys.every((f) => collapsed[f])
  const toggleAll = () => {
    const next: Record<string, boolean> = {}
    if (!allCollapsed) for (const f of sectionKeys) next[f] = true
    setCollapsed(next)
    persist(next)
  }

  // 文件夹按列分配：第 i 个文件夹固定落在第 i % N 列，展开/收起只影响它自己那一列
  const cols = useColumnCount()
  const folderColumns = useMemo(() => {
    const n = Math.max(1, Math.min(3, cols))
    const arr: [string, NoteListItem[]][][] = Array.from({ length: n }, () => [])
    folders.forEach((entry, i) => arr[i % n].push(entry))
    return arr
  }, [folders, cols])

  return (
    <div>
      {/* 紧凑标题行：站名 + 数量统计 + 一键折叠 */}
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-serif text-xl font-bold tracking-tight">
          <T k="allNotes" />
        </h1>
        {notes && (
          <span className="text-xs text-muted-foreground">
            <T k="publicCount" args={[notes.filter((n) => n.isPublic).length]} />
            {search.trim() && <T k="filteredCount" args={[visible.length]} />}
          </span>
        )}
        {sectionKeys.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {allCollapsed ? (
              <>
                <ChevronsUpDown className="size-3.5" aria-hidden />
                <T k="expandAll" />
              </>
            ) : (
              <>
                <ChevronsDownUp className="size-3.5" aria-hidden />
                <T k="collapseAll" />
              </>
            )}
          </button>
        )}
      </div>

      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Hash className="size-2.5" aria-hidden />
            <T k="tagFilter" /> {activeTag}
            <span className="text-muted-foreground">
              <T k="noteCountSuffix" args={[visible.length]} />
            </span>
          </span>
          <button
            type="button"
            onClick={() => setTag(null)}
            className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <T k="clearFilter" />
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
            <T k="all" />
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
        <p className="text-center text-sm text-destructive">
          <T k="loadFailed" />
        </p>
      )}

      {!isLoading && notes && visible.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
          <p className="mt-3 font-medium">
            <T k={notes.length === 0 ? 'emptyVault' : 'noMatch'} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <T k={notes.length === 0 ? 'emptyVaultHint' : 'emptyHint'} />
          </p>
        </div>
      )}

      {/* 未分组：单独一块放在文件夹列之上，笔记按列排（没有分组习惯时就是全部笔记） */}
      {rootNotes.length > 0 && (
        <section className="mb-4 overflow-hidden rounded-xl border border-border/70 bg-card">
          <button
            type="button"
            onClick={() => toggleFolder('')}
            className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/60"
            aria-expanded={!collapsed['']}
            aria-label={t.uncategorized + (collapsed[''] ? ' — ' + t.expandAll : ' — ' + t.collapseAll)}
          >
            <ChevronRight
              className={'size-4 shrink-0 text-muted-foreground transition-transform ' + (collapsed[''] ? '' : 'rotate-90')}
              aria-hidden
            />
            <FileText className="size-4 shrink-0 text-primary/80" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-serif text-base font-semibold text-foreground">
              <T k="uncategorized" />
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              <T k="folderCount" args={[rootNotes.length]} />
            </span>
          </button>
          {!collapsed[''] && (
            <ul className="columns-1 gap-x-2 border-t border-border/60 px-1.5 py-1.5 sm:columns-2 xl:columns-3">
              {rootNotes.map((n) => (
                <NoteRow key={n.slug} note={n} snippet={snippets.get(n.slug)} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 文件夹分栏：每列是独立的纵向流，展开一个文件夹只撑高它自己那一列，其它列不动、也不留白 */}
      {folders.length > 0 && (
        <div className="flex items-start gap-4">
          {folderColumns.map((column, ci) => (
            <div key={ci} className="flex min-w-0 flex-1 flex-col gap-4">
              {column.map(([folder, items]) => {
                const isCollapsed = !!collapsed[folder]
                return (
                  <section
                    key={folder}
                    className="overflow-hidden rounded-xl border border-border/70 bg-card"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFolder(folder)}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                      aria-expanded={!isCollapsed}
                      aria-label={folder + (isCollapsed ? ' — ' + t.expandAll : ' — ' + t.collapseAll)}
                    >
                      <ChevronRight
                        className={'size-4 shrink-0 text-muted-foreground transition-transform ' + (isCollapsed ? '' : 'rotate-90')}
                        aria-hidden
                      />
                      <Folder className="size-4 shrink-0 text-primary/80" aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-serif text-base font-semibold text-foreground">
                        {folder}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        <T k="folderCount" args={[items.length]} />
                      </span>
                    </button>
                    {!isCollapsed && (
                      <ul className="border-t border-border/60 px-1.5 py-1.5">
                        {items.map((n) => (
                          <NoteRow key={n.slug} note={n} snippet={snippets.get(n.slug)} />
                        ))}
                      </ul>
                    )}
                  </section>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
