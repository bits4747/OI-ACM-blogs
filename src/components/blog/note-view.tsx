'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  FileText,
  Hash,
  Link2,
  ListTree,
  Lock,
  Minus,
  Move,
  Pencil,
  RotateCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchLinkIndex,
  fetchNoteDetail,
  type RefItem,
} from '@/lib/api'
import katex from 'katex'
import {
  extractHeadings,
  splitHeadingSegments,
  stripInlineFormatting,
  type HeadingEntry,
} from '@/lib/obsidian'
import { useBlog } from '@/lib/store'
import { clearSearchHighlight, jumpToText } from '@/lib/find-text'
import { useT } from '@/lib/i18n'
import { T } from '@/components/blog/t-text'
import { MarkdownRenderer } from '@/components/blog/markdown'

/**
 * 大纲条目文字：公式交给 KaTeX，行内排版（**粗体**、*斜体*、~~删除线~~、
 * ==高亮==、`代码`）全部渲染成真正的元素 —— 大纲里不允许出现 markdown 原文标记。
 */
function HeadingText({ text }: { text: string }) {
  const segs = useMemo(() => splitHeadingSegments(text), [text])
  return (
    <>
      {segs.map((s, i) =>
        s.type === 'math' ? (
          <span
            key={i}
            className="toc-math"
            dangerouslySetInnerHTML={{
              __html: renderMath(s.value),
            }}
          />
        ) : (
          <span key={i}>{renderInlineMarkup(s.value)}</span>
        )
      )}
    </>
  )
}

/**
 * 把一段标题文字里的行内标记渲染成元素（递归支持嵌套）。
 * `_斜体_` 只在词边界上识别，避免把 `snake_case` 这类标题吃掉下划线；
 * 这里刻意不用后行断言（lookbehind），旧版 Safari 会在解析阶段直接报错。
 */
function renderInlineMarkup(src: string): ReactNode {
  const out: ReactNode[] = []
  // 顺序很重要：*** / ** / * 由长到短，且收尾不允许是更长星号串的一部分
  //（`**嵌套*斜体***` 若让 `**` 先吃掉 `***` 的前两个星号，就会漏掉里面的斜体）。
  const re =
    /\*\*\*([\s\S]+?)\*\*\*|\*\*([\s\S]+?)\*\*(?!\*)|__([\s\S]+?)__(?!_)|~~([\s\S]+?)~~|==([\s\S]+?)==|`([^`\n]+)`|(^|[^\w])_([^_\n]+?)_(?=[^\w]|$)|(\*)([^*\n]+?)\*/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push(src.slice(last, m.index))
    if (m[1] !== undefined) {
      // ***粗斜*** = 加粗 + 斜体
      out.push(
        <strong key={key++}>
          <em>{renderInlineMarkup(m[1])}</em>
        </strong>
      )
    } else if (m[2] !== undefined) {
      out.push(<strong key={key++}>{renderInlineMarkup(m[2])}</strong>)
    } else if (m[3] !== undefined) {
      out.push(<strong key={key++}>{renderInlineMarkup(m[3])}</strong>)
    } else if (m[4] !== undefined) {
      out.push(<s key={key++}>{renderInlineMarkup(m[4])}</s>)
    } else if (m[5] !== undefined) {
      out.push(
        <mark key={key++} className="toc-hl">
          {renderInlineMarkup(m[5])}
        </mark>
      )
    } else if (m[6] !== undefined) {
      out.push(
        <code key={key++} className="toc-code">
          {m[6]}
        </code>
      )
    } else if (m[8] !== undefined) {
      if (m[7]) out.push(m[7])
      out.push(<em key={key++}>{renderInlineMarkup(m[8])}</em>)
    } else if (m[10] !== undefined) {
      out.push(<em key={key++}>{renderInlineMarkup(m[10])}</em>)
    }
    last = re.lastIndex
  }
  if (last < src.length) out.push(src.slice(last))
  // 残留的孤立标记（如标题写成「二度进阶***」，CommonMark 也不会把它当强调）
  // 在首尾一并清掉，避免大纲里出现光秃秃的 *** —— 但只动两端，
  // 中间的文字（`a=b`、`snake_case`、`__int128`）原样保留。
  if (out.length && typeof out[0] === 'string') {
    out[0] = (out[0] as string).replace(/^[*~=]+/, '')
  }
  const tail = out.length - 1
  if (tail >= 0 && typeof out[tail] === 'string') {
    out[tail] = (out[tail] as string).replace(/[*~=]+$/, '')
  }
  return out
}

function renderMath(tex: string): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: false })
  } catch {
    return tex
  }
}

function RefList({
  title,
  items,
  onOpen,
}: {
  title: string
  items: RefItem[]
  onOpen: (slug: string) => void
}) {
  const t = useT()
  if (items.length === 0) return null
  return (
    <div className="mt-10 rounded-xl border border-border/70 bg-muted/30 p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Link2 className="size-3.5" aria-hidden />
        {title}
        <span className="text-xs opacity-60">{items.length}</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((r) => (
          <button
            key={r.slug}
            type="button"
            onClick={() => onOpen(r.slug)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary"
          >
            {r.isPublic === false && <Lock className="size-3 text-muted-foreground" aria-hidden />}
            {r.resolved === false && (
              <span className="text-xs text-muted-foreground/70" title={t.notUploaded}>
                {t.notCreated}
              </span>
            )}
            {r.title}
          </button>
        ))}
      </div>
    </div>
  )
}

function PrivateLock({ slug }: { slug: string }) {
  const goHome = useBlog((s) => s.goHome)
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed p-10 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
        <Lock className="size-7 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-4 font-serif text-xl font-semibold">
        <T k="notPublic" />
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        <T k="notPublicBody" />
      </p>
      <p className="mt-1 break-all text-xs text-muted-foreground/60">{slug}</p>
      <Button variant="outline" className="mt-4" onClick={() => goHome()}>
        <T k="goHome" />
      </Button>
    </div>
  )
}

export function NoteView({ slug }: { slug: string }) {
  const goHome = useBlog((s) => s.goHome)
  const openFolder = useBlog((s) => s.openFolder)
  const navigateToNote = useBlog((s) => s.navigateToNote)
  const setTag = useBlog((s) => s.setTag)
  const pendingHeading = useBlog((s) => s.pendingHeading)
  const clearPendingHeading = useBlog((s) => s.clearPendingHeading)
  const pendingText = useBlog((s) => s.pendingText)
  const clearPendingText = useBlog((s) => s.clearPendingText)
  const t = useT()
  // 静态站是纯只读的：没有管理视图，frontmatter / 原文 Tab 一律不可用
  const isAdmin = false

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['note', slug, isAdmin],
    queryFn: () => fetchNoteDetail(slug),
  })

  const { data: linkIndex } = useQuery({
    queryKey: ['link-index', isAdmin],
    queryFn: () => fetchLinkIndex(),
  })

  const queryClient = useQueryClient()

  // 重试：resetQueries 重置查询状态并重新拉取。只调 refetch() 不够 ——
  // 查询若被 React Query 挂起（fetchStatus 为 'paused'），refetch 不会真的发请求，
  // 表现成「按钮点了没反应」；重置状态能保证重新走一次请求。
  const retryLoad = () => {
    void queryClient.resetQueries({ queryKey: ['note', slug, isAdmin] })
  }

  // 大纲数据必须在所有提前 return 之前计算（Rules of Hooks：每次渲染 hook 数量要一致）
  const headings = useMemo(
    () =>
      data && data !== 'private' && data !== 'not_found'
        ? extractHeadings(data.note.content)
        : [],
    [data],
  )

  useEffect(() => {
    if (data && data !== 'private' && data !== 'not_found' && pendingHeading) {
      // 多级标题路径（[[笔记#A#B]]）取最后一段作为跳转目标
      const target = pendingHeading.split('#').pop() ?? pendingHeading
      const id = target
        .replace(/^#+/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}\-_]/gu, '')
      clearPendingHeading()
      if (!id) return
      // 新标签页打开时内容是「现加载现排版」的：代码块语法高亮 / 公式 / 图片会在几百毫秒后
      // 还在把目标小节往下推，旧的「固定 300ms 滚一次」在 SPA 里够用（内容早已缓存），
      // 但新标签冷加载会落空（实测长笔记里一次性滚动后 scrollY 仍是 0）。
      // 改为轮询到元素出现再滚，并在其后连续多滚几次吸收后续 reflow，直到稳定或超时。
      // 注意：本 effect 不能 return cleanup —— 上面 clearPendingHeading() 会把 pendingHeading
      // dep 同步置 null 触发 effect 立即重跑，React 先执行旧 cleanup，cancelled 反杀刚起的轮询。
      // 让轮询自己用 tries 上限收尾即可（离开页面后定时器至多多跑约 4 秒，无副作用）。
      let tries = 0
      const MAX_TRIES = 40
      const step = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' })
          if (tries++ < MAX_TRIES && tries < 8) return void setTimeout(step, 200)
          return
        }
        if (tries++ < MAX_TRIES) setTimeout(step, 100)
      }
      setTimeout(step, 80)
    }
  }, [data, pendingHeading, clearPendingHeading])

  // 换笔记 / 离开时清掉上一处的高亮（CSS Custom Highlight 是文档级的）。
  // 必须排在下面「跳到正文片段」的 effect 之前：同一批 effect 按声明顺序执行，
  // 反过来的话挂载时会先高亮再被这里清掉。
  useEffect(() => {
    clearSearchHighlight()
    return () => clearSearchHighlight()
  }, [slug])

  // 搜索命中正文时，结果行会带一句话过来（pendingText）：打开后滚到那句话上并高亮。
  // 与上面的 pendingHeading 一样，这里**不能 return cleanup** —— clearPendingText() 会把
  // dep 同步置空触发 effect 重跑，React 先跑旧 cleanup 会反杀刚起的定时器。
  useEffect(() => {
    if (!data || data === 'private' || data === 'not_found' || !pendingText) return
    clearPendingText()
    // 正文根节点：避开悬浮预览里的 .markdown-body（那份是另一个组件）
    const bodyRoot = () => {
      const all = Array.from(document.querySelectorAll<HTMLElement>('.markdown-body'))
      return all.find((el) => !el.closest('.note-preview')) ?? null
    }
    let tries = 0
    const run = () => {
      const root = bodyRoot()
      // 数据已就绪，正文在同一次提交里就渲染完了，所以第一次基本都能同步命中；
      // 没命中（嵌入的块还在懒加载 / 片段被标记切开）就再试几次。
      if (root && jumpToText(root, pendingText)) return
      if (tries++ < 20) setTimeout(run, 150)
    }
    run()
  }, [data, pendingText, clearPendingText])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (data === 'private') return <PrivateLock slug={slug} />

  // 「加载失败」与「笔记不存在」是两回事：网络断了 / 服务器 5xx 时不该说
  // 「笔记不存在或已被删除」，那会让人以为内容被删了。这里分开并给重试按钮。
  // 注意「没有数据」不等于「笔记不存在」：请求还没落地（或 React Query 因网络
  // 状态把查询挂起 paused）时 data 同样是 undefined，那种情况要给重试而不是
  // 报「已被删除」。只有明确拿到 'not_found' 才说笔记不存在。
  if (isError || (!data && !isLoading)) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <RotateCw className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
        <p className="mt-3 font-medium">
          <T k="noteLoadFailed" />
        </p>
        <Button variant="outline" className="mt-4" disabled={isFetching} onClick={retryLoad}>
          {isFetching ? t.loading : <T k="retry" />}
        </Button>
      </div>
    )
  }

  if (data === 'not_found') {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <FileText className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
        <p className="mt-3 font-medium">
          <T k="notFound" />
        </p>
        <Button variant="outline" className="mt-4" onClick={() => goHome()}>
          <T k="goHome" />
        </Button>
      </div>
    )
  }

  // 纯类型收窄：上面的分支已经把「加载中 / 私密 / 失败 / 不存在」都返回掉了，
  // 这里 data 必然是笔记对象。保留这个 return 是为了让 TS 能推断出来。
  if (!data) return null

  const { note, backlinks, outlinks } = data
  const fm = note.frontmatter

  return (
    <div className="mx-auto w-full max-w-[var(--content-w)]" data-region="note">
      <article className="mx-auto w-full" data-region="article">
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" aria-label={t.back}>
        <button
          type="button"
          onClick={() => goHome()}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <T k="back" />
        </button>
        {note.folder && (
          <span className="opacity-60">
            /{' '}
            <button
              type="button"
              onClick={() => openFolder(note.folder)}
              className="rounded px-0.5 transition-colors hover:text-foreground hover:underline"
              title={t.openFolder(note.folder)}
            >
              {note.folder.split('/').join(' › ')}
            </button>{' '}
            /
          </span>
        )}
        <span className="truncate font-medium text-foreground/80">{note.title}</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {note.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" aria-hidden />
            {(note.noteDate ?? note.updatedAt).slice(0, 10)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Pencil className="size-3.5" aria-hidden />
            <T k="words" args={[note.wordCount]} />
          </span>
          {note.tags.length > 0 && (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              {note.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer font-normal hover:bg-primary/20"
                  onClick={() => setTag(tag)}
                >
                  <Hash className="size-2.5" aria-hidden />
                  {tag}
                </Badge>
              ))}
            </span>
          )}
        </div>
      </header>

      {/* 静态站没有「源码」视图：原样输出 Markdown 是管理端的职责，这里只渲染正文。
          曾用 Tabs 做过「阅读 / 源码」切换，但 isAdmin 恒为 false，源码那个 Tab 永远
          是 disabled 的假切换，点不动反而让人以为坏了，故整个 Tabs 外壳一并去掉。 */}
      <MarkdownRenderer raw={note.raw} linkIndex={linkIndex ?? null} currentSlug={slug} />

      <footer className="mt-12 space-y-6 border-t pt-6">
        {backlinks.length > 0 && (
          <RefList title={t.backlinks} items={backlinks} onOpen={(s) => navigateToNote(s)} />
        )}
        {outlinks.length > 0 && (
          <RefList title={t.outlinks} items={outlinks} onOpen={(s) => navigateToNote(s)} />
        )}
        {fm && Object.keys(fm).length > 0 && isAdmin && (
          <details className="rounded-lg border bg-muted/30 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              {t.frontmatter}
            </summary>
            <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
              <code>{JSON.stringify(fm, null, 2)}</code>
            </pre>
          </details>
        )}
      </footer>
      </article>
      {headings.length > 1 && <NoteToc headings={headings} />}
      {/* 字号控件已移到应用根节点（components/blog/font-control.tsx）：
          之前它只在这里，导致首页根本没有入口；而且只缩放正文。
          现在它挂在根上，首页和文章页都有，且全站生效。 */}
    </div>
  )
}

const TOC_POS_KEY = 'toc-pos'
const TOC_COLLAPSED_KEY = 'toc-collapsed'
const TOC_SIZE_KEY = 'toc-size'
const TOC_W_MIN = 180
const TOC_W_MAX = 520
const TOC_H_MIN = 140

/**
 * 大纲浮层：固定悬浮于页面上（不参与文章排版，不挤压正文宽度），
 * 可拖动到任意位置、可折叠成小圆钮、右下角可拖拽调整宽高；
 * 位置/尺寸/折叠状态记忆在 localStorage。
 *
 * 拖动入口有两个：
 *   1. 标题栏整条（鼠标/触摸都行）
 *   2. 左侧专门的拖动按键（手柄图标）—— 手机上标题栏容易被误触成滚动，
 *      给一个明确的抓手更可靠；两者都设 touch-action:none，保证触摸拖动不被
 *      浏览器的页面滚动抢走。
 */
function NoteToc({ headings }: { headings: HeadingEntry[] }) {
  const t = useT()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [dragging, setDragging] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // scroll-spy：只读一次布局，用 rAF 合并连续滚动事件。
    // 原先每个 scroll 事件都对每个标题调 getBoundingClientRect()，长笔记 + 高频滚动
    // 会造成明显的强制重排开销。
    let raf = 0
    const measure = () => {
      raf = 0
      let current: string | null = null
      for (const h of headings) {
        const el = document.getElementById(h.id)
        if (el && el.getBoundingClientRect().top <= 140) current = h.id
      }
      setActiveId(current)
    }
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [headings])

  // 恢复上次的浮动位置、尺寸与折叠状态
  useEffect(() => {
    try {
      const raw = localStorage.getItem((TOC_POS_KEY))
      if (raw) {
        const v = JSON.parse(raw) as { x: number; y: number }
        if (typeof v?.x === 'number' && typeof v?.y === 'number') setPos(v)
      }
      const rawSize = localStorage.getItem((TOC_SIZE_KEY))
      if (rawSize) {
        const v = JSON.parse(rawSize) as { w: number; h: number }
        if (typeof v?.w === 'number' && typeof v?.h === 'number') setSize(v)
      }
      if (localStorage.getItem((TOC_COLLAPSED_KEY)) === '1') setCollapsed(true)
    } catch {
      /* 忽略 */
    }
  }, [])

  // 位置/尺寸持久化
  useEffect(() => {
    if (!pos) return
    try {
      localStorage.setItem((TOC_POS_KEY), JSON.stringify(pos))
    } catch {
      /* 忽略 */
    }
  }, [pos])
  useEffect(() => {
    if (!size) return
    try {
      localStorage.setItem((TOC_SIZE_KEY), JSON.stringify(size))
    } catch {
      /* 忽略 */
    }
  }, [size])

  // 窗口缩放时把面板拉回可视范围
  useEffect(() => {
    const onResize = () =>
      setPos((p) => {
        const el = panelRef.current
        if (!p || !el) return p
        return {
          x: Math.min(p.x, Math.max(8, window.innerWidth - el.offsetWidth - 8)),
          y: Math.min(p.y, Math.max(8, window.innerHeight - el.offsetHeight - 8)),
        }
      })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const startDrag = (e: ReactPointerEvent) => {
    // 触摸事件没有 button（恒为 0/-1），只对鼠标左键设限
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const el = panelRef.current
    if (!el || (e.target as HTMLElement).closest('[data-no-drag]')) return
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - rect.left
    const dy = e.clientY - rect.top
    const move = (ev: PointerEvent) => {
      setPos({
        x: Math.min(Math.max(ev.clientX - dx, 8), window.innerWidth - el.offsetWidth - 8),
        y: Math.min(Math.max(ev.clientY - dy, 8), window.innerHeight - el.offsetHeight - 8),
      })
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const startResize = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const base = size ?? { w: 240, h: 460 }
    const move = (ev: PointerEvent) => {
      setSize({
        w: Math.min(Math.max(base.w + (ev.clientX - startX), TOC_W_MIN), TOC_W_MAX),
        h: Math.min(
          Math.max(base.h + (ev.clientY - startY), TOC_H_MIN),
          Math.max(window.innerHeight - 130, TOC_H_MIN)
        ),
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const setCollapsedPersisted = (v: boolean) => {
    setCollapsed(v)
    try {
      localStorage.setItem((TOC_COLLAPSED_KEY), v ? '1' : '0')
    } catch {
      /* 忽略 */
    }
  }

  const floatStyle: CSSProperties = pos ? { left: pos.x, top: pos.y } : { right: 24, top: 88 }

  const min = Math.min(...headings.map((h) => h.level))

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const align = () => Math.round(el.getBoundingClientRect().top + window.scrollY - 96)
    const apply = () => window.scrollTo({ top: align(), behavior: 'auto' })

    apply()

    // 正文图片是 loading="lazy"：点击时它们还没加载、没有高度，文档是「矮」的，
    // 算出的落点偏上（甚至被夹到文档底部），随后图片陆续加载把标题一路往下推
    // —— 这正是「点一次只下滑一小段、要连点几次」的根因。两路一起校正：
    //   1) 监听目标之前的图片 load，每张加载完就重新对齐（最可靠，不依赖帧）；
    //   2) rAF 连续重算，兜住字体/折叠等其它位移。
    let stable = 0
    let frames = 0
    const step = () => {
      if (Math.abs(align() - Math.round(window.scrollY)) <= 2) {
        if (++stable >= 3) return
      } else {
        stable = 0
        apply()
      }
      if (++frames < 120) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)

    const targetTop = el.getBoundingClientRect().top + window.scrollY
    const cleanups: Array<() => void> = []
    for (const img of Array.from(document.querySelectorAll<HTMLImageElement>('.markdown-body img'))) {
      if (img.complete) continue
      if (img.getBoundingClientRect().top + window.scrollY > targetTop) continue
      const onLoad = () => {
        stable = 0
        apply()
      }
      img.addEventListener('load', onLoad, { once: true })
      cleanups.push(() => img.removeEventListener('load', onLoad))
    }
    if (cleanups.length) {
      window.setTimeout(() => cleanups.forEach((fn) => fn()), 10000)
    }
  }

  if (collapsed) {
    return (
      <div
        ref={panelRef}
        className="fixed z-40 flex items-center gap-1 rounded-full border border-border bg-background/95 py-1 pl-3 pr-1 shadow-lg backdrop-blur"
        style={floatStyle}
        data-region="toc-panel"
      >
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setCollapsedPersisted(false)}
          aria-label={t.tocExpand}
        >
          <ListTree className="size-3.5" aria-hidden />
          <T k="toc" />
        </button>
        {/* 收起态也要能挪位置：同样的四向十字手柄 */}
        <div
          className="flex size-5 shrink-0 cursor-move touch-none items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          onPointerDown={startDrag}
          title={t.tocDrag}
          aria-hidden
          role="presentation"
        >
          <Move className="size-3.5" />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      className={
        'fixed z-40 max-w-[calc(100vw-16px)] rounded-xl border border-border bg-background/95 shadow-xl backdrop-blur' +
        (dragging ? ' shadow-2xl ring-1 ring-primary/30' : '')
      }
      style={{ width: size?.w ?? 240, ...floatStyle }}
      data-region="toc-panel"
    >
      <div
        className="flex touch-none cursor-grab select-none items-center gap-1.5 border-b px-3 py-2 active:cursor-grabbing"
        onPointerDown={startDrag}
      >
        <ListTree className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <T k="toc" />
        </span>
        <span className="fs-tiny text-muted-foreground/60">{headings.length}</span>
        <button
          type="button"
          data-no-drag
          className="ml-auto rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setCollapsedPersisted(true)}
          aria-label={t.tocCollapse}
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
      </div>
      <nav
        className="toc mx-2 max-h-[min(62vh,460px)] overflow-y-auto pt-2 pb-4"
        style={size ? { maxHeight: size.h } : undefined}
        aria-label={t.toc}
      >
        <ul>
          {headings.map((h, i) => (
            <li key={h.id + '-' + i} style={{ paddingLeft: (h.level - min) * 12 }}>
              <a
                href={'#' + h.id}
                className={'toc-item block truncate py-1 pr-2 text-xs leading-5 ' + (activeId === h.id ? 'toc-active' : '')}
                title={stripInlineFormatting(h.text)}
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo(h.id)
                }}
              >
                <HeadingText text={h.text} />
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {/* 移动手柄：通用的四向十字箭头，固定在左下角（右下角留给缩放） */}
      <div
        className="absolute bottom-0 left-0 z-10 flex size-5 cursor-move touch-none items-center justify-center rounded-bl-xl text-muted-foreground/60 transition-colors hover:text-foreground"
        onPointerDown={startDrag}
        title={t.tocDrag}
        aria-hidden
        role="presentation"
      >
        <Move className="size-3.5" />
      </div>
      <div
        className="absolute bottom-0 right-0 z-10 size-5 cursor-nwse-resize touch-none"
        onPointerDown={startResize}
        role="presentation"
      >
        <div className="absolute bottom-1 right-1 size-2 rounded-[2px] border-b-2 border-r-2 border-muted-foreground/50" />
      </div>
    </div>
  )
}
