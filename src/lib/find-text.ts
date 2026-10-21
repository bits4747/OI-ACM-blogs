/**
 * 「跳到正文里的那段文字」：搜索命中正文时，点结果应该落到那句话上，
 * 而不是把笔记从头打开让人自己找。
 *
 * 三件事：
 *  1) 找位置：搜索索引是构建时剥掉 markdown 标记后的**纯文本**，不能直接拿去和
 *     渲染后的 DOM 比字符串（`**加粗**词` 会被标签切成两个文本节点）。所以按「块」
 *     找：把同一段落 / 列表项 / 标题里的文本节点拼起来再找，被行内标记切开的词也能命中。
 *  2) 滚过去：算 Range 的 rect 再滚，落点留一点上边距（贴着窗口顶端读着难受）。
 *  3) 跟着 reflow 校正：图片 / 公式是懒加载的，滚完还会把正文继续往下推，所以像
 *     大纲那样持续校正到落点稳定为止 —— 否则又会出现「点一次只挪一小段」。
 *
 * 高亮用 CSS Custom Highlight API（只登记 Range，不改 DOM，不会和 React 抢节点）；
 * 浏览器不支持就只滚动，功能不受影响。
 */

const HIGHLIGHT_NAME = 'blog-search-hit'

/** 可以独立承载一句话的块级元素：按块匹配，避免跨段落拼出假命中 */
const BLOCK_SELECTOR =
  'p, li, td, th, h1, h2, h3, h4, h5, h6, pre, blockquote, figcaption, dt, dd, summary'

type AnyWindow = Window & {
  Highlight?: new (...ranges: Range[]) => unknown
  CSS?: { highlights?: Map<string, unknown> }
}

function textNodesIn(root: Node): Text[] {
  const out: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node) {
      const v = node.nodeValue
      if (!v || !v.trim()) return NodeFilter.FILTER_REJECT
      const p = (node as Text).parentElement
      if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })
  let node = walker.nextNode()
  while (node) {
    out.push(node as Text)
    node = walker.nextNode()
  }
  return out
}

/** 在一个块里找到 needle 对应的 Range（可能跨多个文本节点） */
function rangeIn(block: Node, needle: string): Range | null {
  const nodes = textNodesIn(block)
  if (!nodes.length) return null
  let joined = ''
  const starts: number[] = []
  for (const n of nodes) {
    starts.push(joined.length)
    joined += n.nodeValue ?? ''
  }
  const at = joined.toLowerCase().indexOf(needle)
  if (at < 0) return null
  const end = at + needle.length
  const nodeAt = (pos: number) => {
    let k = 0
    for (let j = 0; j < nodes.length; j++) if (starts[j] <= pos) k = j
    return k
  }
  const a = nodeAt(at)
  const b = nodeAt(end - 1)
  try {
    const range = document.createRange()
    range.setStart(nodes[a], at - starts[a])
    range.setEnd(nodes[b], end - starts[b])
    return range
  } catch {
    return null
  }
}

/** 在已渲染的正文里找 query，返回第一个命中的 Range */
export function findTextRange(root: HTMLElement, query: string): Range | null {
  const needle = query.trim().toLowerCase()
  if (!needle) return null
  for (const block of Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR))) {
    const r = rangeIn(block, needle)
    if (r) return r
  }
  // 兜底：整块正文当一个文本流（命中跨段落 / 直接写在容器里的文字）
  return rangeIn(root, needle)
}

export function clearSearchHighlight(): void {
  try {
    ;(window as unknown as AnyWindow).CSS?.highlights?.delete(HIGHLIGHT_NAME)
  } catch {
    /* 忽略 */
  }
}

function highlightRange(range: Range): void {
  const w = window as unknown as AnyWindow
  try {
    if (typeof w.Highlight === 'function' && w.CSS?.highlights) {
      w.CSS.highlights.set(HIGHLIGHT_NAME, new w.Highlight(range))
    }
  } catch {
    /* 不支持就只滚动 */
  }
}

const MAX_TICKS = 50
const TICK_MS = 120

function scrollRangeIntoView(range: Range): void {
  const margin = () => Math.min(140, Math.max(40, window.innerHeight * 0.18))
  const desiredTop = (): number | null => {
    let rect: DOMRect
    try {
      rect = range.getBoundingClientRect()
    } catch {
      return null
    }
    if (!rect || (rect.width === 0 && rect.height === 0)) return null
    return Math.max(0, window.scrollY + rect.top - margin())
  }

  const first = desiredTop()
  if (first !== null) window.scrollTo({ top: first, behavior: 'auto' })

  // 懒加载的图片 / 公式会在随后几百毫秒里继续把正文往下推，持续校正到落点稳定
  let prev = -1
  let stable = 0
  let ticks = 0
  const tick = () => {
    if (ticks++ >= MAX_TICKS) return
    const want = desiredTop()
    if (want !== null) {
      if (Math.abs(want - window.scrollY) > 1) window.scrollTo({ top: want, behavior: 'auto' })
      if (Math.abs(want - prev) <= 2) stable++
      else stable = 0
      prev = want
    }
    if (stable < 4) setTimeout(tick, TICK_MS)
  }
  setTimeout(tick, TICK_MS)
}

/** 找到并跳过去；返回是否找到（调用方据此决定要不要再试几次） */
export function jumpToText(root: HTMLElement, query: string): boolean {
  const range = findTextRange(root, query)
  if (!range) return false
  highlightRange(range)
  scrollRangeIntoView(range)
  return true
}
