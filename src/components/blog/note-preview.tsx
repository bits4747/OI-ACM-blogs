'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { fetchLinkIndex, fetchNoteDetail } from '@/lib/api'
import { extractBlockText, extractHeadingSection, headingIdFromText } from '@/lib/obsidian'
import { useBlog } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { MarkdownRenderer } from '@/components/blog/markdown'

/** 是否处于悬浮预览内部（预览里的链接不再嵌套弹窗） */
const PreviewDepth = createContext(false)
export function useInsidePreview(): boolean {
  return useContext(PreviewDepth)
}

interface NotePreviewPopupProps {
  slug: string
  /** 段落标题（headingLabel 之后的形式）或块 ID（^xxx） */
  heading?: string
  anchor: HTMLElement
  onClose: () => void
  onKeepOpen: () => void
}

/** Obsidian 风格的链接悬浮预览浮窗 */
export function NotePreviewPopup({ slug, heading, anchor, onClose, onKeepOpen }: NotePreviewPopupProps) {
  const t = useT()
  // 静态站纯只读：无管理视图
  const isAdmin = false
  const cardRef = useRef<HTMLDivElement | null>(null)

  // 与正文页共用 react-query 缓存（同样的 key，不重复请求）
  const { data, isLoading } = useQuery({
    queryKey: ['note', slug, isAdmin],
    queryFn: () => fetchNoteDetail(slug),
    staleTime: 60_000,
  })
  const { data: linkIndex } = useQuery({
    queryKey: ['link-index', isAdmin],
    queryFn: () => fetchLinkIndex(),
    staleTime: 30_000,
  })

  // 定位：宽=原文宽度，高=视口的 80%；贴着链接下方展开，空间不足翻到上方，夹在视口内
  const article = document.querySelector('article')
  const width = Math.min(article?.clientWidth ?? 600, window.innerWidth - 24)
  const rect = anchor.getBoundingClientRect()
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
  const maxH = Math.round(window.innerHeight * 0.8)
  let top = rect.bottom + 8
  if (top + maxH > window.innerHeight - 12) {
    const above = rect.top - 8 - maxH
    top = above > 12 ? above : Math.max(12, window.innerHeight - maxH - 12)
  }

  // Escape / 页面滚动 / 点击浮窗外关闭（浮窗内部的滚动除外，否则没法在浮窗里滚读）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onScroll = (e: Event) => {
      if (cardRef.current && e.target instanceof Node && cardRef.current.contains(e.target)) return
      onClose()
    }
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (cardRef.current?.contains(t) || anchor.contains(t)) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('mousedown', onDocMouseDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('mousedown', onDocMouseDown)
    }
  }, [onClose, anchor])

  const blockId = heading?.startsWith('^') ? heading.slice(1) : undefined
  const isBlockRef = !!blockId

  // 「打开笔记 ↗」改为新标签页打开，所以这里必须是真实可跳转的 URL，
  // 不能走 navigateToNote（那是 SPA 内部改状态，只会换掉当前页）。
  // 带 h 是为了 [[笔记#小节]]：新标签加载后 store 从 ?h= 恢复 pendingHeading，同样定位到小节。
  // ^块引用不适用小节定位（isBlockRef），跳过。
  const noteHref = (() => {
    const p = new URLSearchParams()
    p.set('note', slug)
    if (heading && !isBlockRef) p.set('h', heading)
    return '?' + p.toString()
  })()

  // 段落链接：渲染完成后滚动到目标标题并短暂高亮
  // 多级标题路径（[[笔记#A#B]]）以最后一段为准，与 Obsidian 语义一致
  useEffect(() => {
    if (!data || data === 'private' || data === 'not_found' || isBlockRef || !heading) return
    const targetHeading = heading.split('#').pop()?.trim() || heading
    const timer = window.setTimeout(() => {
      const el = cardRef.current?.querySelector('#' + CSS.escape(headingIdFromText(targetHeading)))
      if (!el) return
      el.scrollIntoView({ block: 'start' })
      const node = el as HTMLElement
      node.style.transition = 'background-color 0.3s'
      node.style.backgroundColor = 'color-mix(in srgb, var(--primary) 18%, transparent)'
      window.setTimeout(() => {
        node.style.backgroundColor = ''
      }, 1600)
    }, 120)
    return () => window.clearTimeout(timer)
  }, [data, heading, isBlockRef])

  let title: string = t.loading
  let body: ReactNode = (
    <div className="space-y-2 py-1">
      <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
    </div>
  )
  if (data === 'private') {
    title = t.notPublic
    body = (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Lock className="size-4" aria-hidden />
        {t.privateByAuthor}
      </div>
    )
  } else if (data === 'not_found') {
    title = t.noteMissing
    body = <div className="py-3 text-sm text-muted-foreground">{t.noteMissingBody}</div>
  } else if (data) {
    const note = data.note
    title = note.title
    if (isBlockRef) {
      const block = extractBlockText(note.content, blockId)
      body = block ? (
        <MarkdownRenderer raw={block} linkIndex={linkIndex ?? null} currentSlug={slug} />
      ) : (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">{t.blockNotFound}</p>
          <MarkdownRenderer raw={note.raw} linkIndex={linkIndex ?? null} currentSlug={slug} />
        </div>
      )
    } else {
      // 引用的是某一小节时，只显示那一节的区间（到下一个同级/更高级标题为止），
      // 而不是把整篇笔记都塞进浮窗 —— 与 Obsidian 的悬浮预览一致。
      const section = heading ? extractHeadingSection(note.content, heading) : null
      if (heading && section == null) {
        body = (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">{t.sectionMissing}</p>
            <MarkdownRenderer raw={note.raw} linkIndex={linkIndex ?? null} currentSlug={slug} />
          </div>
        )
      } else {
        body = <MarkdownRenderer raw={section ?? note.raw} linkIndex={linkIndex ?? null} currentSlug={slug} />
      }
    }
  }

  return createPortal(
    <PreviewDepth.Provider value={true}>
      <div
        ref={cardRef}
        className="note-preview fixed z-[60] overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        style={{ left, top, width, maxHeight: maxH }}
        onMouseEnter={onKeepOpen}
        onMouseLeave={onClose}
      >
        <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
          <span className="truncate text-xs font-medium text-foreground/80">{title}</span>
          <a
            href={noteHref}
            target="_blank"
            rel="noopener noreferrer"
            title={t.openNoteNewTab}
            className="shrink-0 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-primary"
            onClick={(e) => {
              // 浮窗是 createPortal 渲染在正文链接 <a> 的 children 里的，React 事件按组件树冒泡，
              // 不 stopPropagation 会一路冒到外层 <a onClick> → navigateToNote → 当前页也被换掉，
              // 变成「新标签 + 当前页一起跳」。这里只该开新标签，当前页保持不动。
              e.stopPropagation()
              onClose()
            }}
          >
            {t.openNoteArrow}
          </a>
        </div>
        <div className="max-h-[calc(80vh-34px)] overflow-y-auto px-4 py-3">{body}</div>
      </div>
    </PreviewDepth.Provider>,
    document.body
  )
}
