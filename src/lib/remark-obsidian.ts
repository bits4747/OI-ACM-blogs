import type { Blockquote, Link, Paragraph, PhrasingContent, Root } from 'mdast'
import { SKIP, visit } from 'unist-util-visit'
import { DICT } from './i18n'
import {
  basenameOf,
  extractBlockText,
  headingIdOf,
  normalizePath,
  parseWikilink,
  resolveEmbedPath,
  type LinkParts,
} from './obsidian'

/** 渲染时可用的笔记索引（link-index API 提供） */
export interface NoteIndexEntry {
  slug: string
  path: string
  title: string
  isPublic: boolean
  excerpt?: string
}

export interface AssetIndexEntry {
  path: string
}

export interface RemarkObsidianOptions {
  notes: NoteIndexEntry[]
  assets: AssetIndexEntry[]
  /** 当前笔记的 slug（渲染 [[#^块id]] 纯块引用时定位用） */
  currentSlug?: string
  /** 当前笔记正文（提取块内容作为链接文字） */
  currentRaw?: string
  /** 当前语言的 callout 默认标题（键为规范类型）。不给就回落中文。 */
  labels?: Record<string, string>
  /** 纯块引用兜底文案（当前语言） */
  blockRefLabel?: string
}

/** 渲染时可用的完整索引（link-index API 返回结构） */
export interface LinkIndex {
  notes: NoteIndexEntry[]
  assets: AssetIndexEntry[]
}

interface IndexCtx {
  bySlug: Map<string, NoteIndexEntry>
  byBasename: Map<string, NoteIndexEntry[]>
  assetSet: Set<string>
  currentSlug?: string
  currentRaw?: string
  /** 纯块引用的兜底链接文字（当前语言） */
  blockRefLabel: string
}

function buildIndex(
  notes: NoteIndexEntry[],
  assets: AssetIndexEntry[],
  currentSlug?: string,
  currentRaw?: string,
  blockRefLabel?: string
): IndexCtx {
  const bySlug = new Map<string, NoteIndexEntry>()
  const byBasename = new Map<string, NoteIndexEntry[]>()
  for (const n of notes) {
    bySlug.set(n.slug, n)
    const base = basenameOf(n.path)
    const arr = byBasename.get(base) ?? []
    arr.push(n)
    byBasename.set(base, arr)
  }
  const assetSet = new Set<string>()
  for (const a of assets) assetSet.add(normalizeAsset(a.path))
  return {
    bySlug,
    byBasename,
    assetSet,
    currentSlug,
    currentRaw,
    blockRefLabel: blockRefLabel ?? '块引用',
  }
}

function normalizeAsset(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '')
}

/** 中文 callout 默认标题（服务端 / 静态导出的兜底，此时读不到浏览器语言） */
const CALLOUT_LABELS_ZH: Record<string, string> = DICT.zh.calloutLabel as unknown as Record<
  string,
  string
>

/** Obsidian callout 类型表：别名 → 规范类型。
 *  默认标题不写死在这里——它属于界面文案，由 i18n 字典按当前语言提供（见 calloutLabels）。 */
const CALLOUTS: Record<string, string> = {
  note: 'note',
  abstract: 'abstract',
  summary: 'abstract',
  tldr: 'abstract',
  info: 'info',
  todo: 'todo',
  tip: 'tip',
  hint: 'tip',
  important: 'tip',
  success: 'success',
  check: 'success',
  done: 'success',
  question: 'question',
  help: 'question',
  faq: 'question',
  warning: 'warning',
  caution: 'warning',
  attention: 'warning',
  failure: 'failure',
  fail: 'failure',
  missing: 'failure',
  danger: 'danger',
  error: 'danger',
  bug: 'bug',
  example: 'example',
  quote: 'quote',
  cite: 'quote',
}

/** 标题锚点 id（与 obsidian.ts 的 headingIdOf 保持同一实现，大纲与渲染共用） */
export const headingId = headingIdOf

function headingLabel(heading: string): string {
  return heading.replace(/^#+/, '').trim()
}

function findNote(target: string, ctx: IndexCtx): NoteIndexEntry | null {
  if (!target) return null
  const direct = ctx.bySlug.get(target)
  if (direct) return direct
  const base = target.split('/').pop() || target
  const arr = ctx.byBasename.get(base)
  if (!arr || arr.length === 0) return null
  if (arr.length === 1) return arr[0]
  // 同名笔记：取路径最短者（Obsidian 最短路径规则）
  return [...arr].sort((a, b) => a.path.length - b.path.length)[0]
}

function makeText(value: string): PhrasingContent {
  return { type: 'text', value }
}

/**
 * 取 mdast 短语节点的纯文本，用于生成标题锚点 id。
 * inlineMath 取 TeX 原文（不带 $ 定界符），与 obsidian.ts 的 extractHeadings 口径一致：
 * 那边标题文本是 "$trans$"，headingIdOf 会吃掉 $ 只剩 trans。
 */
function plainTextOf(nodes: PhrasingContent[]): string {
  let out = ''
  for (const n of nodes) {
    const node = n as unknown as { type: string; value?: string; children?: PhrasingContent[] }
    if (typeof node.value === 'string') {
      out += node.value
      continue
    }
    if (node.children) out += plainTextOf(node.children)
  }
  return out.trim()
}

/** 生成 wikilink / 嵌入 / 锚点链接节点 */
function wikilinkNode(isEmbed: boolean, raw: string, ctx: IndexCtx): PhrasingContent | Paragraph {
  const { target, heading, alias }: LinkParts = parseWikilink(raw)
  const trimmedRaw = raw.trim()

  // 纯锚点链接 [[#标题]] / 纯块引用 [[#^blockid]]
  if (!target && heading) {
    if (heading.startsWith('#^') && ctx.currentSlug) {
      // 本文块引用：转成内链以便悬停预览；链接文字显示块内容摘要（剥掉 md 语法）
      const blockId = heading.slice(2)
      const blockText = ctx.currentRaw ? extractBlockText(ctx.currentRaw, blockId) : null
      const plain = blockText
        ?.replace(/^ {0,3}#{1,6}\s+/, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
      const short = plain ? plain.slice(0, 26) + (plain.length > 26 ? '…' : '') : null
      return makeLink(
        'obsidian-note:' + ctx.currentSlug + '?h=' + encodeURIComponent('^' + blockId),
        alias ?? short ?? ctx.blockRefLabel,
        'internal-link anchor-link'
      )
    }
    const label = headingLabel(heading)
    return makeLink('#' + headingId(label), alias ?? label, 'internal-link anchor-link')
  }

  if (isEmbed) {
    // 嵌入：优先附件（图片等），其次笔记
    const assetPath = resolveEmbedPath(target, ctx.assetSet)
    if (assetPath) {
      return {
        type: 'image',
        url: '/api/asset?path=' + encodeURIComponent(assetPath),
        title: null,
        alt: alias ?? basenameOf(assetPath),
        data: { hProperties: { className: ['obsidian-image'] } },
      } as PhrasingContent
    }
    const note = findNote(target, ctx)
    if (note) {
      return {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { className: ['note-embed'] },
        },
        children: [
          makeLink(
            'obsidian-note:' +
              note.slug +
              (heading ? '?h=' + encodeURIComponent(headingLabel(heading)) : ''),
            note.title,
            'internal-link embed-title' + (note.isPublic ? '' : ' private-link')
          ),
          ...(note.excerpt ? [makeText('\n' + note.excerpt)] : []),
        ],
      } as Paragraph
    }
  }

  // 普通 wikilink
  const note = findNote(target, ctx)
  if (note) {
    const label =
      alias ??
      (heading && !heading.startsWith('#^')
        ? note.title +
          ' > ' +
          headingLabel(heading)
            .split('#')
            .map((s) => s.trim())
            .filter(Boolean)
            .join(' > ')
        : note.title)
    return makeLink(
      'obsidian-note:' +
        note.slug +
        (heading ? '?h=' + encodeURIComponent(headingLabel(heading)) : ''),
      label,
      'internal-link' + (note.isPublic ? '' : ' private-link')
    )
  }

  // 未创建的目标（Obsidian 风格：灰色虚线）
  return makeLink(
    'obsidian-unresolved:' + encodeURIComponent(trimmedRaw),
    alias ?? trimmedRaw,
    'internal-link unresolved-link'
  )
}

function makeLink(url: string, label: string, className: string): Link {
  return {
    type: 'link',
    url,
    title: null,
    data: { hProperties: { className: className.split(/\s+/).filter(Boolean) } },
    children: [makeText(label)],
  }
}

/** 普通文本段：处理 ==高亮== 与 #行内标签 */
function plainNodes(text: string): PhrasingContent[] {
  const nodes: PhrasingContent[] = []
  const TOKEN = /==([^=\n]+)==|(^|\s)(#[\p{L}\p{N}][\p{L}\p{N}_/-]*)/gmu
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    const lead = m[3] !== undefined ? m[2] : ''
    const start = (m.index ?? 0) + lead.length
    if (start > last) nodes.push(makeText(text.slice(last, start)))
    if (m[1] !== undefined) {
      // ==高亮==
      nodes.push({
        type: 'emphasis',
        data: { hName: 'mark', hProperties: { className: ['obsidian-highlight'] } },
        children: [makeText(m[1])],
      })
      last = start + m[0].length - lead.length
    } else if (m[3] !== undefined) {
      // #标签
      const tag = m[3]
      nodes.push(makeLink('obsidian-tag:' + encodeURIComponent(tag.slice(1)), tag, 'inline-tag'))
      last = start + tag.length
    }
  }
  if (last < text.length) nodes.push(makeText(text.slice(last)))
  return nodes
}

/** 文本节点 → 行内节点数组（wikilink 优先拆分） */
function inlineNodes(text: string, ctx: IndexCtx): PhrasingContent[] {
  const nodes: PhrasingContent[] = []
  const WIKI = /(!?)\[\[([^[\]\n]+?)\]\]/g
  let last = 0
  for (const m of text.matchAll(WIKI)) {
    if (m.index > last) nodes.push(...plainNodes(text.slice(last, m.index)))
    nodes.push(wikilinkNode(m[1] === '!', m[2], ctx) as PhrasingContent)
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(...plainNodes(text.slice(last)))
  return nodes
}

/** blockquote → Obsidian callout 转换。
 *  labels 为当前语言的 callout 默认标题（键是规范类型）；不给就回落中文。 */
function tryCallout(node: Blockquote, labels: Record<string, string>): boolean {
  const first = node.children[0]
  if (!first || first.type !== 'paragraph') return false
  const fc = first.children[0]
  if (!fc || fc.type !== 'text') return false
  const m = /^\[!(\w+)\]([+-]?)\s?/.exec(fc.value)
  if (!m) return false
  const rawType = m[1].toLowerCase()
  const canonical = CALLOUTS[rawType] ?? 'note'
  const label = labels[canonical] ?? CALLOUT_LABELS_ZH[canonical] ?? rawType
  const fold = m[2] === '-' ? 'closed' : m[2] === '+' ? 'open' : null
  let rest = fc.value.slice(m[0].length)
  let bodyText: string | null = null
  const nl = rest.indexOf('\n')
  if (nl >= 0) {
    bodyText = rest.slice(nl + 1)
    rest = rest.slice(0, nl)
  }
  fc.value = rest.trim() || label
  first.data = {
    hName: fold ? 'summary' : 'div',
    hProperties: { className: ['callout-title'], 'data-callout-type': canonical },
  }
  node.data = {
    hName: fold ? 'details' : 'div',
    hProperties: {
      className: ['callout', 'callout-' + canonical],
      ...(fold === 'open' ? { open: true } : {}),
    },
  }
  if (bodyText && bodyText.trim()) {
    const para: Paragraph = { type: 'paragraph', children: [makeText(bodyText)] }
    node.children.splice(1, 0, para)
  }
  return true
}

/** 块引用 ID（Obsidian 复制块链接时自动生成，如行尾 ^735c76）——正文里按乱码剥离。
 *  两种形态：跟在块尾（前面有空白）、或整个段落只有一行块 ID（Obsidian 阅读视图同样隐藏）。 */
const BLOCK_ID_TAIL = /(?:\s+|^)\^[A-Za-z0-9-]{4,}\s*$/

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** remark 插件：Obsidian 语法（wikilink / 嵌入 / callout / 高亮 / 标签 / 块引用清理） */
export function remarkObsidian(this: unknown, opts: RemarkObsidianOptions) {
  const ctx = buildIndex(
    opts.notes,
    opts.assets,
    opts.currentSlug,
    opts.currentRaw,
    opts.blockRefLabel
  )
  const labels = (opts.labels ?? CALLOUT_LABELS_ZH) as Record<string, string>
  const blockRefLabel = opts.blockRefLabel ?? 'Block reference'
  return (tree: Root) => {
    // 第一轮：callout 转换（产生的 text 会参与第二轮行内处理）
    visit(tree, 'blockquote', (node) => {
      tryCallout(node as Blockquote, labels)
    })
    // 第一轮 B：给标题打锚点 id。必须在 mdast（remark）阶段算：此时公式还是
    // inlineMath 节点（值为 TeX 原文），而 rehype 之后 KaTeX 会把同一公式展开成
    // mathml + annotation + html 三份，textOf 会把 "trans" 取三遍，导致正文 id
    // 与大纲 id 对不上、点击大纲不跳转。
    visit(tree, 'heading', (node) => {
      const h = node as { children: PhrasingContent[]; data?: { hProperties?: Record<string, unknown> } }
      const plain = plainTextOf(h.children)
      if (!plain) return
      h.data = h.data || {}
      h.data.hProperties = { ...(h.data.hProperties || {}), id: headingIdOf(plain) }
    })
    // 第二轮：剥离悬挂的块引用 ID（段落/标题末尾的 ^xxxxxx），避免渲染成乱码
    visit(tree, ['paragraph', 'heading'], (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      const children = (node as { children: PhrasingContent[] }).children
      const last = children[children.length - 1]
      if (!last || last.type !== 'text') return
      const value = (last as { value: string }).value
      const m = BLOCK_ID_TAIL.exec(value)
      if (!m) return
      const rest = value.slice(0, m.index)
      if (rest.trim()) {
        ;(last as { value: string }).value = rest
      } else if (children.length === 1) {
        // 整个块只剩块 ID：直接移除该块
        parent.children.splice(index, 1)
        return [SKIP, index] as never
      } else {
        children.pop()
      }
    })
    // 第三轮：markdown 链接指向库内笔记（[文字](笔记.md)）→ 转内链，支持 #标题/#^块id 片段
    visit(tree, 'link', (node) => {
      const link = node as Link
      const url = link.url
      if (!url || /^(https?:|mailto:|data:|#|obsidian-)/i.test(url)) return
      const decoded = decodeURIComponentSafe(url)
      const hi = decoded.indexOf('#')
      const targetPart = hi >= 0 ? decoded.slice(0, hi) : decoded
      const frag = hi >= 0 ? decoded.slice(hi) : ''
      const target = normalizePath(targetPart.replace(/\.(md|markdown)$/i, ''))
      if (!target) return
      const note = findNote(target, ctx)
      if (note) {
        link.url =
          'obsidian-note:' +
          note.slug +
          (frag ? '?h=' + encodeURIComponent(headingLabel(frag)) : '')
        link.data = {
          hProperties: { className: ['internal-link' + (note.isPublic ? '' : ' private-link')] },
        }
      } else if (/\.(md|markdown)$/i.test(targetPart)) {
        // 明显是想链库内笔记但目标不存在：按未创建处理（点击搜索），避免 404
        link.url = 'obsidian-unresolved:' + encodeURIComponent(target)
        link.data = { hProperties: { className: ['internal-link', 'unresolved-link'] } }
      }
    })
    // 第四轮：行内语法（wikilink / ==高亮== / #标签）
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      const p = parent as unknown as {
        type: string
        url?: string
        children: PhrasingContent[]
      }
      if (p.type === 'link' && typeof p.url === 'string' && p.url.startsWith('obsidian-')) {
        return
      }
      const value = (node as { value: string }).value
      if (!value.includes('[[') && !value.includes('==') && !/#[\p{L}\p{N}]/u.test(value)) {
        return
      }
      const replacement = inlineNodes(value, ctx)
      if (
        replacement.length === 1 &&
        replacement[0].type === 'text' &&
        (replacement[0] as { value: string }).value === value
      ) {
        return
      }
      p.children.splice(index, 1, ...replacement)
    })
  }
}
