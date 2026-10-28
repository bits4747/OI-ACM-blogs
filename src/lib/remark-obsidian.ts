import type { Blockquote, Link, Paragraph, PhrasingContent, Root } from 'mdast'
import { SKIP, visit } from 'unist-util-visit'
import { DICT } from './i18n'
import {
  basenameOf,
  extractBlockText,
  headingIdFromText,
  headingIdOf,
  normalizePath,
  parseWikilink,
  resolveEmbedPath,
  scanWikilinks,
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
    return makeLink('#' + headingIdFromText(label), alias ?? label, 'internal-link anchor-link')
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
      // 真·嵌入：交给渲染层把目标笔记的对应区间（整篇 / 某小节 / 某个块）
      // 直接展开在当前位置，而不是弹悬浮窗或只放一张摘要卡片。
      // 这里只输出占位节点，区间截取和异步取数在 Transclusion 组件里做。
      return {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: {
            className: ['note-embed'],
            'data-embed-slug': note.slug,
            ...(heading ? { 'data-embed-heading': headingLabel(heading) } : {}),
          },
        },
        children: [],
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

/**
 * 一个 `#xxx` 到底算不算 Obsidian 标签。
 *
 * 两条排除规则（与 obsidian.ts 的 extractTags 保持一致，两边不能各写一套，
 * 否则「正文渲染成标签、标签页里却没有」这种自相矛盾就会出现）：
 * - 纯数字：`#2427` 是题目编号，不是标签（Obsidian 本身也不允许纯数字标签）；
 * - 3~8 位十六进制：多半是颜色值 `#ff0000`，不是标签。
 */
function isValidTag(t: string): boolean {
  if (!t) return false
  if (/^\d+$/.test(t)) return false
  if (/^[0-9a-fA-F]{3,8}$/.test(t)) return false
  return true
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
      if (!isValidTag(tag.slice(1))) {
        // 不算标签就原样留下（比如题目编号 #2427），不能吞掉
        nodes.push(makeText(tag))
      } else {
        nodes.push(makeLink('obsidian-tag:' + encodeURIComponent(tag.slice(1)), tag, 'inline-tag'))
      }
      last = start + tag.length
    }
  }
  if (last < text.length) nodes.push(makeText(text.slice(last)))
  return nodes
}

/** 文本节点 → 行内节点数组（wikilink 优先拆分；支持标题里带成对方括号） */
function inlineNodes(text: string, ctx: IndexCtx): PhrasingContent[] {
  const nodes: PhrasingContent[] = []
  const tokens = scanWikilinks(text)
  if (tokens.length === 0) return plainNodes(text)
  let last = 0
  for (const tk of tokens) {
    if (tk.start > last) nodes.push(...plainNodes(text.slice(last, tk.start)))
    nodes.push(wikilinkNode(tk.isEmbed, tk.inner, ctx) as PhrasingContent)
    last = tk.end
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
    // 第一轮 B（原位置）已移到最后一轮：标题锚点 id 必须在 wikilink / 行内语法
    // 展开**之后**再算，否则 `## [[笔记|别名]]` 这类标题会得到 notealias（原文）
    // 而大纲侧得到 alias（可见文字），正文 id 与 TOC id 对不上、点击大纲不跳转。
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
      // 链接文字里不再解析行内标签/高亮：HTML 不允许 <a> 套 <a>，浏览器会强行
      // 把内层拆出去，结果就是「链接被截断、后半截变成普通文字」——
      // 正是 `### [#2427. 珍珠项链](https://loj.ac/p/2427)` 渲染坏掉的原因。
      // Obsidian 自己也一样：链接文字是纯文字，不认 #标签。
      if (p.type === 'link') {
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
    // 最后一轮：给标题打锚点 id（见第一轮 B 的说明）。
    // 仍然在 mdast 阶段算：此时公式还是 inlineMath（TeX 原文），而 rehype 之后
    // KaTeX 会把同一公式展开成 mathml + annotation + html 三份，取文本会取三遍。
    // 重复标题按出现顺序加 -1 / -2 后缀，与 extractHeadings（大纲侧）完全一致。
    const seenIds = new Map<string, number>()
    visit(tree, 'heading', (node) => {
      const h = node as { children: PhrasingContent[]; data?: { hProperties?: Record<string, unknown> } }
      const plain = plainTextOf(h.children)
      if (!plain) return
      const base = headingIdOf(plain)
      const n = seenIds.get(base) ?? 0
      seenIds.set(base, n + 1)
      h.data = h.data || {}
      h.data.hProperties = { ...(h.data.hProperties || {}), id: n === 0 ? base : `${base}-${n}` }
    })
  }
}

/** 把前缀文字插到 hast 子树最靠前的文本节点上（找不到就返回 false） */
function prependToFirstText(nodes: unknown[], prefix: string): boolean {
  for (const raw of nodes) {
    const n = raw as { type?: string; value?: string; children?: unknown[] }
    if (!n || typeof n !== 'object') continue
    if (n.type === 'text' && typeof n.value === 'string') {
      n.value = prefix + n.value
      return true
    }
    if (Array.isArray(n.children) && prependToFirstText(n.children, prefix)) return true
  }
  return false
}

/**
 * 修 remark-math 的 `$$` 同行写法。
 *
 * micromark 的数学块沿用代码围栏语义：`$$` 后面同一行的内容被当成 **meta**
 * （类似 ```js 的 info string），真正的公式体从下一行开始。于是
 *
 *   $$\left(\begin{matrix}
 *   a & b \\
 *   \end{matrix}\right)$$
 *
 * 的首行被丢进 meta 里再没人读，公式体只剩 `a & b \\ \end{matrix}\right)`，
 * `\left` 没有配对的 `\right`，KaTeX 直接报错。Obsidian 没有 math meta 概念，
 * 那里 `$$` 后面的内容就是公式第一行，所以这里把 meta 并回公式体。
 * 同时要改 data.hChildren —— rehype-katex 读的是那份预先烘好的文本。
 */
export function remarkMathMetaFix() {
  return (tree: Root) => {
    visit(tree, (node) => {
      const n = node as unknown as {
        type: string
        meta?: string | null
        value?: string
        data?: { hChildren?: unknown[] }
      }
      if (n.type !== 'math' || !n.meta) return
      const head = n.meta
      n.meta = null
      n.value = head + '\n' + (n.value ?? '')
      const kids = n.data?.hChildren
      if (Array.isArray(kids)) prependToFirstText(kids, head + '\n')
    })
  }
}
