'use client'

import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLinkIndex, fetchNoteDetail } from '@/lib/api'
import { extractBlockText, extractHeadingSection, headingDisplayText } from '@/lib/obsidian'
import { MarkdownRenderer } from '@/components/blog/markdown'
import { useBlog } from '@/lib/store'
import { useT } from '@/lib/i18n'

/**
 * 嵌入链：记录当前正在展开的笔记 slug，用来防止 A 嵌入 B、B 又嵌入 A 的死循环。
 * 每层 Transclusion 把自己的 slug 压进链里传给下层 MarkdownRenderer。
 */
const EmbedChain = createContext<string[]>([])
export function useEmbedChain(): string[] {
  return useContext(EmbedChain)
}

/** 最多嵌套几层（超过就不再展开，只给一个可点击的链接） */
const MAX_DEPTH = 4

export interface TransclusionProps {
  slug: string
  /** 引用的小节标题，或 `^块id`；不传表示整篇 */
  heading?: string
}

/**
 * Obsidian 式嵌入（transclusion）：把目标笔记的**对应区间**直接展开在当前位置。
 *
 * 区间语义与 Obsidian 一致：
 *   - `![[笔记]]`          → 整篇
 *   - `![[笔记#小节]]`     → 该小节（到下一个同级/更高级标题为止）
 *   - `![[笔记#^块id]]`    → 只有那个文本块
 * 这样就不会出现「引用了某一段，却把后面没引用的内容也一起显示」。
 */
export function Transclusion({ slug, heading }: TransclusionProps) {
  const t = useT()
  const chain = useEmbedChain()
  const navigateToNote = useBlog((s) => s.navigateToNote)
  const cyclic = chain.includes(slug)
  const tooDeep = chain.length >= MAX_DEPTH
  const skip = cyclic || tooDeep

  const { data, isLoading } = useQuery({
    queryKey: ['note', slug, false],
    queryFn: () => fetchNoteDetail(slug),
    staleTime: 60_000,
    enabled: !skip,
  })
  const { data: linkIndex } = useQuery({
    queryKey: ['link-index', false],
    queryFn: () => fetchLinkIndex(),
    staleTime: 30_000,
    enabled: !skip,
  })

  const link = (label: string, hint?: string) => (
    <div className="note-embed note-embed-note">
      <button
        type="button"
        className="embed-title"
        onClick={() => navigateToNote(slug, heading && !heading.startsWith('^') ? heading : undefined)}
      >
        {label}
      </button>
      {hint && <span className="note-embed-hint"> · {hint}</span>}
    </div>
  )

  if (skip) return link(slug, cyclic ? t.embedCycle : t.embedTooDeep)
  if (isLoading) return <div className="note-embed note-embed-loading">{t.loading}</div>
  if (!data || data === 'private' || data === 'not_found') return link(slug, t.noteMissing)

  const note = data.note
  const region = heading
    ? heading.startsWith('^')
      ? extractBlockText(note.content, heading.slice(1))
      : extractHeadingSection(note.content, heading)
    : note.content

  if (region == null || !region.trim()) return link(note.title, t.sectionMissing)

  return (
    <div className="note-embed note-embed-note">
      <div className="note-embed-head">
        <button
          type="button"
          className="embed-title"
          onClick={() => navigateToNote(slug, heading && !heading.startsWith('^') ? heading : undefined)}
          title={t.openNoteNewTab}
        >
          {note.title}
          {heading
            ? ' › ' +
              (heading.startsWith('^') ? '#' + heading.slice(1) : headingDisplayText(heading))
            : ''}
        </button>
      </div>
      <div className="note-embed-body">
        <EmbedChain.Provider value={[...chain, slug]}>
          <MarkdownRenderer raw={region} linkIndex={linkIndex ?? null} currentSlug={slug} />
        </EmbedChain.Provider>
      </div>
    </div>
  )
}
