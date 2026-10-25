'use client'

import { memo, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, FileText, Folder, FolderOpen, Hash, Home, Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchFolders, fetchNotes, fetchSearchIndex, type FolderNode, type NoteListItem } from '@/lib/api'
import { useBlog } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { T } from '@/components/blog/t-text'

/** 紧凑列表行：标题 + 日期/状态，一行搞定 */
const NoteRow = memo(function NoteRow({
  note,
  snippet,
  hitText,
}: {
  note: NoteListItem
  snippet?: string
  /** 命中的是正文时带上搜索词：打开后直接滚到那句话，而不是从头读 */
  hitText?: string
}) {
  const navigateToNote = useBlog((s) => s.navigateToNote)
  const t = useT()
  return (
    <li className="break-inside-avoid">
      <button
        type="button"
        onClick={() => navigateToNote(note.slug, undefined, hitText)}
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

/** 面包屑：全部 › 父 › 当前。点任意一段回到那一层。 */
function Crumbs({ path }: { path: string }) {
  const openFolder = useBlog((s) => s.openFolder)
  const t = useT()
  const parts = path ? path.split('/') : []
  const segs = parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }))
  return (
    <nav aria-label={t.crumbRoot} className="flex flex-wrap items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => openFolder('')}
        className={
          'inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground ' +
          (segs.length === 0 ? 'font-medium text-foreground' : 'text-muted-foreground')
        }
      >
        <Home className="size-3.5" aria-hidden />
        <T k="crumbRoot" />
      </button>
      {segs.map((s, i) => {
        const last = i === segs.length - 1
        return (
          <span key={s.path} className="inline-flex items-center gap-1">
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
            {last ? (
              <span className="rounded px-1.5 py-0.5 font-medium text-foreground">{s.name}</span>
            ) : (
              <button
                type="button"
                onClick={() => openFolder(s.path)}
                className="rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s.name}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/** 子文件夹卡片：点整张卡进入下一层 */
function FolderCard({ node }: { node: FolderNode }) {
  const openFolder = useBlog((s) => s.openFolder)
  const t = useT()
  const subs = node.children.length
  return (
    <button
      type="button"
      onClick={() => openFolder(node.path)}
      aria-label={t.openFolder(node.name)}
      className="group flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
    >
      <Folder className="size-5 shrink-0 text-primary/80" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-base font-semibold text-foreground">{node.name}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          <T k="folderCount" args={[node.totalCount]} />
          {subs > 0 && (
            <>
              <span className="px-1 opacity-50">·</span>
              <T k="subfolderCount" args={[subs]} />
            </>
          )}
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </button>
  )
}

export function HomeView() {
  const search = useBlog((s) => s.search)
  const activeTag = useBlog((s) => s.activeTag)
  const setTag = useBlog((s) => s.setTag)
  const folder = useBlog((s) => s.folder)
  const t = useT()
  const q = search.trim().toLowerCase()

  const { data: notes, isLoading, isError } = useQuery({
    queryKey: ['notes'],
    queryFn: () => fetchNotes(false),
  })

  // 目录树由构建时生成（index.json 的 folders 字段），比每次遍历全部笔记现算更省，
  // 也能表达「自己没笔记、只有子目录」的容器目录。
  const { data: tree } = useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
    staleTime: 60_000,
  })

  // 全文索引：只在真的输入了搜索词时才拉（几十 KB，别拖慢首屏）。
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

  // 命中正文（有 snippet）才带跳转词：只命中标题 / 路径时正文里没有可跳的位置
  const hitOf = (slug: string) => (q && snippets.has(slug) ? search.trim() : undefined)

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of notes ?? []) for (const t of n.tags) m.set(t, (m.get(t) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)
  }, [notes])

  /** 当前层的子文件夹（搜索 / 标签筛选时不做目录限定，直接平铺结果） */
  const browsing = !q && !activeTag
  // 旧索引没有 folders 字段时，按 notes[].folder 现推一棵最小树，保证老站点不会变成空白
  const effectiveTree = useMemo(() => {
    if (tree && tree.length > 0) return tree
    if (!notes) return []
    const root: FolderNode = { path: '', name: '', directCount: 0, totalCount: 0, children: [] }
    const map = new Map<string, FolderNode>()
    for (const n of notes) {
      const f = n.folder || ''
      if (!f) continue
      const parts = f.split('/')
      let cur = root
      for (let i = 0; i < parts.length; i += 1) {
        const p = parts.slice(0, i + 1).join('/')
        let node = map.get(p)
        if (!node) {
          node = { path: p, name: parts[i], directCount: 0, totalCount: 0, children: [] }
          map.set(p, node)
          cur.children.push(node)
        }
        node.totalCount += 1
        cur = node
      }
      cur.directCount += 1
    }
    return root.children
  }, [tree, notes])

  const current = useMemo(() => {
    if (!browsing) return null
    if (!folder) return { path: '', name: '', directCount: 0, totalCount: 0, children: effectiveTree } as FolderNode
    const walk = (nodes: FolderNode[]): FolderNode | null => {
      for (const n of nodes) {
        if (n.path === folder) return n
        const hit = walk(n.children)
        if (hit) return hit
      }
      return null
    }
    return walk(effectiveTree)
  }, [browsing, effectiveTree, folder])

  // 搜索/筛选时展示全库结果；正常浏览时只展示当前文件夹直属的笔记
  const shown = useMemo(() => {
    if (!browsing) return visible
    return visible.filter((n) => (n.folder || '') === folder)
  }, [browsing, visible, folder])

  const subFolders = current?.children ?? []
  // 深链里的文件夹不存在（改名/删除/手改 URL）：退回根目录，而不是留一个空页面
  const nothingHere = browsing && !isLoading && effectiveTree.length > 0 && !current
  const openFolder = useBlog((s) => s.openFolder)
  useEffect(() => {
    if (nothingHere && folder) openFolder('')
  }, [nothingHere, folder, openFolder])

  return (
    <div>
      {/* 标题行：面包屑 + 数量统计（搜索/筛选时结果来自全库，面包屑退回根） */}
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Crumbs path={browsing ? folder : ''} />
        {notes && (
          <span className="text-xs text-muted-foreground">
            {/* 在文件夹里时给当前层的篇数，而不是全库公开数 —— 否则进「比赛」
                还写着「共 116 篇公开」，和下面只有 19 篇的内容对不上 */}
            {browsing && current && current.path ? (
              <T k="folderPublicCount" args={[current.totalCount]} />
            ) : (
              <T k="publicCount" args={[notes.filter((n) => n.isPublic).length]} />
            )}
            {search.trim() && <T k="filteredCount" args={[visible.length]} />}
          </span>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-destructive">
          <T k="loadFailed" />
        </p>
      )}

      {/* 子文件夹：当前层的下一级，网格排布（同一父级的兄弟必然相邻，不再被列打散） */}
      {!isLoading && subFolders.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subFolders.map((node) => (
            <FolderCard key={node.path} node={node} />
          ))}
        </div>
      )}

      {/* 当前文件夹的直属笔记（根目录时即「未分组」；搜索/筛选时是全库结果） */}
      {!isLoading && shown.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
            <FolderOpen className="size-4 shrink-0 text-primary/80" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-serif text-sm font-semibold text-foreground">
              {!browsing ? (
                <T k="searchResults" />
              ) : folder ? (
                folder.split('/').pop()
              ) : (
                <T k="uncategorized" />
              )}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              <T k="folderCount" args={[shown.length]} />
            </span>
          </div>
          <ul className="columns-1 gap-x-2 px-1.5 py-1.5 sm:columns-2 xl:columns-3">
            {shown.map((n) => (
              <NoteRow key={n.slug} note={n} snippet={snippets.get(n.slug)} hitText={hitOf(n.slug)} />
            ))}
          </ul>
        </section>
      )}

      {!isLoading && notes && visible.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
          <p className="mt-3 font-medium">
            <T k={notes.length === 0 ? 'emptyVault' : browsing && folder ? 'emptyFolder' : 'noMatch'} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <T
              k={
                notes.length === 0
                  ? 'emptyVaultHint'
                  : browsing && folder
                    ? 'emptyFolderHint'
                    : 'emptyHint'
              }
            />
          </p>
        </div>
      )}

      {nothingHere && (
        <p className="text-center text-sm text-muted-foreground">
          <T k="emptyFolder" />
        </p>
      )}    </div>
  )
}
