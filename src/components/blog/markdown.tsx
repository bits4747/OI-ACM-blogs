'use client'

import { isValidElement, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown'
import type { Pluggable } from 'unified'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  Lightbulb,
  List,
  ListChecks,
  Lock,
  Pencil,
  Quote,
  XCircle,
  Zap,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { parseNote, resolveEmbedPath } from '@/lib/obsidian'
import { headingId, remarkObsidian, type LinkIndex } from '@/lib/remark-obsidian'
import { rehypeSafety } from '@/lib/rehype-safety'
import { useBlog } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { withBase } from '@/lib/site'
import { NotePreviewPopup, useInsidePreview } from '@/components/blog/note-preview'

/** vault 相对路径 → 静态附件地址（构建时附件已拷贝到 /assets/<原路径>） */
function assetUrl(p: string): string {
  return withBase('/assets/') + p.split('/').map((s) => encodeURIComponent(s)).join('/')
}

const CALLOUT_ICONS: Record<string, typeof Pencil> = {
  note: Pencil,
  abstract: ListChecks,
  info: Info,
  todo: CheckCircle2,
  tip: Lightbulb,
  success: CheckCircle2,
  question: HelpCircle,
  warning: AlertTriangle,
  failure: XCircle,
  danger: Zap,
  bug: Bug,
  example: List,
  quote: Quote,
}

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode }
    return textOf(props.children)
  }
  return ''
}

/** 内部链接：obsidian-note: / obsidian-tag: / obsidian-unresolved: / 锚点 / 外链 */
function MdLink({
  href,
  className,
  children,
}: {
  href?: string
  className?: string
  children?: ReactNode
}) {
  const navigateToNote = useBlog((s) => s.navigateToNote)
  const setTag = useBlog((s) => s.setTag)
  const setSearch = useBlog((s) => s.setSearch)
  const goHome = useBlog((s) => s.goHome)
  const inPreview = useInsidePreview()
  // Obsidian 式悬停预览：延时弹出浮窗，移出链接/浮窗后关闭
  const [previewOpen, setPreviewOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const enterTimer = useRef<number | null>(null)
  const leaveTimer = useRef<number | null>(null)
  const clearTimers = () => {
    if (enterTimer.current !== null) window.clearTimeout(enterTimer.current)
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    enterTimer.current = null
    leaveTimer.current = null
  }
  useEffect(() => clearTimers, [])
  const onEnter = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (inPreview) return
    clearTimers()
    setAnchorEl(e.currentTarget)
    enterTimer.current = window.setTimeout(() => setPreviewOpen(true), 350)
  }
  const onLeave = () => {
    clearTimers()
    leaveTimer.current = window.setTimeout(() => setPreviewOpen(false), 250)
  }
  const cn = String(className || '')
  const kids = (
    <>
      {cn.includes('private-link') && <Lock className="inline-block size-3 align-[-1px] mr-0.5" aria-hidden />}
      {children}
    </>
  )

  if (href?.startsWith('obsidian-note:')) {
    const rest = href.slice('obsidian-note:'.length)
    const qi = rest.indexOf('?h=')
    const slug = qi >= 0 ? decodeURIComponent(rest.slice(0, qi)) : decodeURIComponent(rest)
    const heading = qi >= 0 ? decodeURIComponent(rest.slice(qi + 3)) : undefined
    return (
      <a
        href={'?note=' + encodeURIComponent(slug)}
        className={cn}
        title={cn.includes('private-link') ? '目标笔记未公开' : undefined}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={(e) => {
          e.preventDefault()
          clearTimers()
          setPreviewOpen(false)
          navigateToNote(slug, heading && !heading.startsWith('^') ? heading : undefined)
        }}
      >
        {kids}
        {previewOpen &&
          anchorEl &&
          createPortal(
            <NotePreviewPopup
              slug={slug}
              heading={heading}
              anchor={anchorEl}
              onClose={() => setPreviewOpen(false)}
              onKeepOpen={clearTimers}
            />,
            document.body
          )}
      </a>
    )
  }
  if (href?.startsWith('obsidian-unresolved:')) {
    const q = decodeURIComponent(href.slice('obsidian-unresolved:'.length).split('#')[0].split('|')[0])
    return (
      <a
        href={'?search=' + encodeURIComponent(q)}
        className={cn || 'internal-link unresolved-link'}
        title="该笔记尚未上传，点击搜索相关笔记"
        onClick={(e) => {
          e.preventDefault()
          setSearch(q)
          goHome()
        }}
      >
        {children}
      </a>
    )
  }
  if (href?.startsWith('obsidian-tag:')) {
    const tag = decodeURIComponent(href.slice('obsidian-tag:'.length))
    return (
      <a
        href={'?tag=' + encodeURIComponent(tag)}
        className={cn}
        onClick={(e) => {
          e.preventDefault()
          setTag(tag)
        }}
      >
        {children}
      </a>
    )
  }
  if (href?.startsWith('#')) {
    return (
      <a href={href} className={cn}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} className={(cn ? cn + ' ' : '') + 'external-link'} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalLink className="inline-block size-3 align-[-1px] ml-0.5 opacity-60" aria-hidden />
    </a>
  )
}

/**
 * 图片：vault 相对路径 → 附件接口。
 * 先在附件索引里解析真实路径（支持文件名引用、任意子目录、大小写差异），
 * 解析不到时退回原样（交给服务器按 basename 兜底匹配）。
 * 覆盖语法：![[图片.png]] / ![](路径) / 原始 HTML <img src="">
 */
function MdImage({
  src,
  alt,
  assetSet,
}: {
  src?: string
  alt?: string
  assetSet?: Set<string>
}) {
  if (!src) return null
  const isExternal = /^(https?:|\/\/)/i.test(src)
  let url: string | undefined = src
  if (src.startsWith('/api/asset?path=')) {
    // 构建管线生成的 vault 附件路径 → 静态附件地址
    url = assetUrl(decodeURIComponentSafe(src.slice('/api/asset?path='.length)))
  } else if (!isExternal && !/^(data:|#)/i.test(src) && !src.startsWith('/api/')) {
    const cleaned = decodeURIComponentSafe(src.replace(/^\.\//, ''))
    const resolved = assetSet ? resolveEmbedPath(cleaned, assetSet) : null
    url = assetUrl(resolved ?? cleaned)
  }
  if (!url) return null
  const finalUrl = url
  return (
    <img
      src={finalUrl}
      alt={alt || ''}
      className="obsidian-image"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        // 静态站是纯静态导出（next.config.ts 里 output: 'export'），
        // **没有服务端路由**，所以不存在 /api/proxy 这类图片代理 —— 外链图床
        // （CSDN 等）防盗链失败时不可能靠服务端转发救回来。
        // 这里只对**本站静态附件**做一次带缓存击穿参数的重试（应对 CDN 边缘瞬时失败），
        // 外链失败就直接放弃，不再拼一个必然 404 的 /api/proxy 地址。
        if (isExternal) return
        const img = e.currentTarget
        const step = Number(img.dataset.retried ?? '0')
        if (step >= 2) return
        img.dataset.retried = String(step + 1)
        window.setTimeout(
          () => {
            // 只有本站静态附件才重试（加个查询参数绕过 CDN 边缘缓存）
            img.src = finalUrl + (finalUrl.includes('?') ? '&' : '?') + 'r=' + (step + 1)
          },
          700 * (step + 1)
        )
      }}
    />
  )
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** callout 标题（带图标） */
function CalloutTitle({ type, children }: { type: string; children?: ReactNode }) {
  const Icon = CALLOUT_ICONS[type] ?? Pencil
  return (
    <div className={'callout-title callout-title-' + type}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

function MdDiv({
  className,
  children,
  ...rest
}: { className?: string; children?: ReactNode } & Record<string, unknown>) {
  const cn = String(className || '')
  if (cn.includes('callout-title')) {
    const type = String(rest['data-callout-type'] || 'note')
    return <CalloutTitle type={type}>{children}</CalloutTitle>
  }
  if (cn.includes('note-embed')) {
    return <div className="note-embed">{children}</div>
  }
  return <div className={className}>{children}</div>
}

/** 代码块：语言标签 + 复制按钮 + 语法高亮（rehype-highlight） */
function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  let lang = 'text'
  let text = ''
  if (isValidElement(children)) {
    const props = children.props as { className?: string; children?: ReactNode }
    const m = String(props.className || '').match(/language-([\w-]+)/)
    lang = m ? m[1] : 'text'
    text = textOf(props.children)
  } else {
    text = textOf(children)
  }
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 忽略 */
    }
  }
  return (
    <div className="code-block">
      <div className="code-block-head">
        <span>{lang}</span>
        <button type="button" onClick={onCopy} className="code-copy" aria-label="复制代码">
          <Copy className="size-3.5" aria-hidden />
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="code-block-body">{children}</pre>
    </div>
  )
}

/** 组件映射：依赖附件索引（assetSet），随 linkIndex 变化重建 */
function buildComponents(assetSet: Set<string>): Components {
  return {
    a: MdLink as Components['a'],
    img: ((props: { src?: string; alt?: string }) => (
      <MdImage {...props} assetSet={assetSet} />
    )) as Components['img'],
    div: MdDiv as Components['div'],
  details: ({ className, children }) => (
    <details className={className}>{children}</details>
  ),
  summary: ({ className, children, ...rest }) => {
    const cn = String(className || '')
    if (cn.includes('callout-title')) {
      const type = String((rest as Record<string, unknown>)['data-callout-type'] || 'note')
      return <CalloutTitle type={type}>{children}</CalloutTitle>
    }
    return <summary className={className}>{children}</summary>
  },
  mark: ({ children }) => <mark className="obsidian-highlight">{children}</mark>,
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ className, children }) => {
    if (String(className || '').includes('language-')) {
      return <code className={className}>{children}</code>
    }
    return <code className="inline-code">{children}</code>
  },
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
  input: ({ checked, type }) =>
    type === 'checkbox' ? (
      <input type="checkbox" checked={!!checked} readOnly className="task-checkbox" />
    ) : null,
  h1: ({ node, children }) => <h1 id={headingIdOfNode(node, children)}>{children}</h1>,
  h2: ({ node, children }) => <h2 id={headingIdOfNode(node, children)}>{children}</h2>,
  h3: ({ node, children }) => <h3 id={headingIdOfNode(node, children)}>{children}</h3>,
  h4: ({ node, children }) => <h4 id={headingIdOfNode(node, children)}>{children}</h4>,
  h5: ({ node, children }) => <h5 id={headingIdOfNode(node, children)}>{children}</h5>,
  h6: ({ node, children }) => <h6 id={headingIdOfNode(node, children)}>{children}</h6>,
  }
}

/**
 * 标题锚点 id：优先用 remark 阶段算好的（remark-obsidian.ts 在 mdast 上打 id），
 * 因为那里公式还是 inlineMath（TeX 原文），与大纲侧 id 一致。
 * 拿不到（例如没走插件的降级路径）才退回 children 取文本。
 */
function headingIdOfNode(node: unknown, children: ReactNode): string {
  const id = (node as { properties?: { id?: unknown } } | undefined)?.properties?.id
  if (typeof id === 'string' && id) return id
  return headingId(textOf(children))
}

export interface MarkdownRendererProps {
  raw: string
  linkIndex: LinkIndex | null
  /** 当前笔记 slug：渲染 [[#^块id]] 纯块引用链接时需要 */
  currentSlug?: string
}

/** Obsidian Markdown 渲染器（含 wikilink / callout / 高亮 / 公式 / 原始 HTML） */
export function MarkdownRenderer({ raw, linkIndex, currentSlug }: MarkdownRendererProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const content = useMemo(() => parseNote(raw).content, [raw])
  // callout 默认标题/块引用兜底文案是界面文案，跟着当前语言走
  const t = useT()
  const remarkPlugins = useMemo(
    () =>
      [
        remarkGfm,
        remarkMath,
        [
          remarkObsidian,
          {
            notes: linkIndex?.notes ?? [],
            assets: linkIndex?.assets ?? [],
            currentSlug,
            currentRaw: content,
            labels: t.calloutLabel as unknown as Record<string, string>,
            blockRefLabel: t.blockRef,
          },
        ],
      ] as Pluggable[],
    [linkIndex, currentSlug, content, t]
  )
  const components = useMemo(
    () =>
      buildComponents(
        new Set((linkIndex?.assets ?? []).map((a) => a.path.replace(/\\/g, '/').replace(/^\.\//, '')))
      ),
    [linkIndex]
  )
  return (
    <div
      className="markdown-body"
      onClick={(e) => {
        const t = e.target as HTMLElement
        if (t instanceof HTMLImageElement && t.src) {
          e.preventDefault()
          e.stopPropagation()
          setLightbox(t.src)
        }
      }}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={[rehypeRaw, rehypeSafety, rehypeHighlight, rehypeKatex]}
        components={components}
        urlTransform={(url) =>
          // react-markdown 默认会剥掉不认识的协议，导致 obsidian-note:/obsidian-tag: 链接
          // 变成 href=""（点击等于刷新当前页）；这里放行渲染管线自己的三个协议，
          // 其余仍走默认净化（危险协议另有 rehypeSafety 兜底）
          /^(obsidian-note:|obsidian-tag:|obsidian-unresolved:)/i.test(url)
            ? url
            : defaultUrlTransform(url)
        }
      >
        {content}
      </ReactMarkdown>
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-2 [&>button]:bg-background/80 [&>button]:rounded-full">
          {lightbox && (
            <img
              src={lightbox}
              alt="附件预览"
              className="mx-auto max-h-[82vh] w-auto rounded-lg shadow-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
