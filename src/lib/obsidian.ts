import matter from 'gray-matter'

/** 解析笔记：剥离 frontmatter */
export interface ParsedNote {
  data: Record<string, unknown>
  content: string
}

export function parseNote(raw: string): ParsedNote {
  try {
    const m = matter(raw)
    return { data: (m.data ?? {}) as Record<string, unknown>, content: repairObsidianArtifacts(m.content ?? '') }
  } catch {
    return { data: {}, content: repairObsidianArtifacts(raw) }
  }
}

// ---------- wikilink 扫描 ----------

export interface WikiToken {
  /** 起始下标（含 ! 或 [[） */
  start: number
  /** 结束下标（不含） */
  end: number
  isEmbed: boolean
  /** 括号内的原文：`目标#标题|别名` */
  inner: string
}

/**
 * 扫描文本里的 [[...]] / ![[...]]，**允许内部出现成对的方括号**。
 *
 * 不能再用 /\[\[([^\[\]]+?)\]\]/ 这种正则：本库的标题经常本身是 markdown 链接，
 * 例如 `[[CSP-S#[P8820 [CSP-S 2022] 数据传输](https://…)]]`，
 * 正则会在第一个 ] 处截断，整条引用失效（真实踩过）。
 */
export function scanWikilinks(text: string): WikiToken[] {
  const out: WikiToken[] = []
  let i = 0
  while (i < text.length) {
    const isEmbed = text[i] === '!' && text[i + 1] === '[' && text[i + 2] === '['
    const plain = text[i] === '[' && text[i + 1] === '['
    if (!isEmbed && !plain) {
      i += 1
      continue
    }
    const open = i + (isEmbed ? 3 : 2)
    let j = open
    let depth = 0
    let end = -1
    while (j < text.length) {
      const ch = text[j]
      if (ch === '\n') break
      if (ch === '\\') {
        j += 2
        continue
      }
      if (ch === '[') {
        depth += 1
        j += 1
        continue
      }
      if (ch === ']') {
        if (depth > 0) {
          depth -= 1
          j += 1
          continue
        }
        if (text[j + 1] === ']') {
          end = j + 2
          break
        }
        j += 1
        continue
      }
      j += 1
    }
    if (end < 0) {
      i = open
      continue
    }
    out.push({ start: i, end, isEmbed, inner: text.slice(open, end - 2) })
    i = end
  }
  return out
}

/**
 * markdown 链接 `[文字](url)` → `文字`。支持一层嵌套方括号
 * （如 `[P3216 [HNOI2011]数学作业](url)`），由内向外反复剥。
 */
const MD_LINK_RE = /\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]\([^()]*\)/g
export function stripMdLinks(input: string): string {
  let cur = input
  let prev: string
  let guard = 0
  do {
    prev = cur
    cur = cur.replace(MD_LINK_RE, '$1')
  } while (cur !== prev && ++guard < 8)
  return cur
}

/**
 * 修复 Obsidian / 编辑器产生的一类坏引用：把 markdown 链接塞进了 wikilink。
 *
 * 形如 `![[显示文字](网址)](笔记.md#标题)`（没有闭合的 `]]`），本库里真实存在
 * （DP/DDP.md 最后一行）。统一改写成 `![[笔记.md#标题|显示文字]]`。
 * 只处理「整行就是这一条」且没有 `]]` 的行，避免误伤正常内容。
 *
 * 另外，**任何** wikilink 内部只要含 markdown 链接语法都要剥成纯文字：
 * mdast 解析阶段 `[文字](url)` 会先变成 link 节点，把 `[[` 与 `]]` 拆到不同
 * 节点里，后面的 wikilink 扫描就再也拼不回来了（Obsidian 复制「标题本身是
 * 链接」的引用正好是这种形态）。extractHeadingSection 匹配标题时同样会剥掉
 * 链接语法，所以这里剥完两边仍然对得上。
 */
export function repairObsidianArtifacts(content: string): string {
  if (!content.includes('[[')) return content
  const ARTIFACT = /^(\s*)(!?)\[\[(.+?)\]\(([^)]*)\)\]\((.+)\)\s*$/
  let inFence = false
  const lines = content.split('\n').map((line) => {
    // 代码块里的 [[ ]] 是示例代码，不是引用
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      return line
    }
    if (inFence || !line.includes('[[')) return line
    let l = line
    if (!l.includes(']]')) {
      const m = ARTIFACT.exec(l)
      if (m) {
        const [, indent, bang, label, , target] = m
        l = `${indent}${bang}[[${target.trim()}|${label.trim()}]]`
      }
    }
    const toks = scanWikilinks(l)
    if (toks.length === 0) return l
    let res = ''
    let last = 0
    for (const tk of toks) {
      res += l.slice(last, tk.start)
      res += (tk.isEmbed ? '!' : '') + '[[' + stripMdLinks(tk.inner) + ']]'
      last = tk.end
    }
    return res + l.slice(last)
  })
  return lines.join('\n')
}

/** 路径归一化：统一斜杠、去 ./ 前缀 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '')
}

/** vault 相对路径 → URL slug（去 .md，保留层级） */
export function toSlug(path: string): string {
  return normalizePath(path).replace(/\.(md|markdown)$/i, '')
}

/** 文件名（不含扩展名）——wikilink 的 basename 匹配依据 */
export function basenameOf(path: string): string {
  const n = normalizePath(path)
  const base = n.split('/').pop() || n
  return base.replace(/\.(md|markdown)$/i, '')
}

export function folderOf(path: string): string {
  const n = normalizePath(path)
  const i = n.lastIndexOf('/')
  return i <= 0 ? '' : n.slice(0, i)
}

export function titleOf(path: string, data: Record<string, unknown>): string {
  const t = data.title
  if (typeof t === 'string' && t.trim()) return t.trim()
  return basenameOf(path)
}

/** 解析可见性：frontmatter 声明优先，其次保留库中已有值，新笔记默认私密 */
export function resolveVisibility(
  data: Record<string, unknown>,
  existing: boolean | null
): { isPublic: boolean; via: 'frontmatter' | 'draft' | 'kept' | 'default' } {
  if (data.draft === true) return { isPublic: false, via: 'draft' }
  const v = data.public ?? data.publish
  if (typeof v === 'boolean') return { isPublic: v, via: 'frontmatter' }
  if (v === 'public' || v === 'true') return { isPublic: true, via: 'frontmatter' }
  if (v === 'private' || v === 'false') return { isPublic: false, via: 'frontmatter' }
  if (existing !== null) return { isPublic: existing, via: 'kept' }
  return { isPublic: false, via: 'default' }
}

/** 标签：frontmatter.tags/tag + 正文行内 #标签 */
export function extractTags(data: Record<string, unknown>, content: string): string[] {
  const out = new Set<string>()
  const add = (v: unknown) => {
    if (typeof v === 'string') {
      v.split(/[,，]/).forEach((s) => {
        const t = s.trim()
        if (t) out.add(t)
      })
    } else if (Array.isArray(v)) {
      v.forEach((x) => {
        if (typeof x === 'string' && x.trim()) out.add(x.trim())
      })
    }
  }
  add(data.tags)
  add(data.tag)
  // 行内标签提取前先移除：
  // - wikilink/锚点（避免 [[#标题]] 被误判）
  // - 代码块与行内代码（避免 #include、#define 等被误判为标签）
  // - HTML 标签及其属性（避免 <font color="#ff0000"> 的颜色代码被误判为标签）
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/<[^>\n]+>/g, ' ')
    .replace(/\[\[[^\]\n]*\]\]/g, ' ')
  for (const m of plain.matchAll(/(^|[^\w#])#([\p{L}\p{N}][\p{L}\p{N}_/-]*)/gu)) {
    const t = m[2]
    if (t && !/^\d+$/.test(t) && !/^[0-9a-fA-F]{3,8}$/.test(t)) out.add(t)
  }
  return [...out].slice(0, 30)
}

/** 标题文本清理：剥掉 wikilink / markdown 链接语法，只留可见文字（大纲展示与锚点共用） */
export function stripHeadingMarkup(input: string): string {
  let s = input
  // wikilink：[[目标|别名]] → 别名，[[目标]] → 目标
  s = s.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1')
  // markdown 链接 [文字](url)：支持一层嵌套方括号（如 [P3216 [HNOI2011]数学作业](url)），
  // 多层嵌套时由内向外反复剥，结果与浏览器渲染出的可见文本一致（保证锚点 id 对得上）
  s = stripMdLinks(s)
  // 行尾悬挂的块引用 ID（^xxxxxx）也不进大纲
  s = s.replace(/\s+\^[A-Za-z0-9-]{4,}\s*$/, '')
  return s.trim()
}

/**
 * 剥掉标题里的**行内排版标记**（加粗/斜体/删除线/高亮/行内代码），只留可见文字。
 *
 * 用途只有一处：算锚点 id。正文一侧的 id 来自 mdast 的文本节点（`**粗**` 早已
 * 解析成 strong 节点，文本就是「粗」），所以大纲一侧也必须先把标记剥干净，
 * 否则 `_斜体_` 这类标题会算出 `_斜体_` 而正文算出 `斜体`，锚点直接对不上。
 * 注意不能无脑删 `_`：`snake_case` 这种标题正文一侧是保留 `_` 的。
 */
export function stripInlineFormatting(input: string): string {
  let s = String(input ?? '')
  let prev = ''
  // 嵌套（**粗*斜***）需要反复剥，直到不再变化
  while (prev !== s) {
    prev = s
    s = s
      .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
      .replace(/__([\s\S]+?)__/g, '$1')
      .replace(/~~([\s\S]+?)~~/g, '$1')
      .replace(/==([\s\S]+?)==/g, '$1')
      .replace(/`([^`\n]+)`/g, '$1')
      .replace(/\*([^*\n]+?)\*/g, '$1')
      // `_斜体_` 只在词边界上剥，避免把 snake_case 变成 snakecase
      .replace(/(^|[^\w])_([^_\n]+?)_(?=[^\w]|$)/g, '$1$2')
  }
  return s.trim()
}

/**
 * 标题匹配用的归一化文本：URL 解码 → 剥掉 markdown 语法 → 压空白 → 小写。
 *
 * Obsidian 写出的 `[[笔记#标题]]` 里，标题可能是原文，也可能是百分号编码过的，
 * 而且标题本身还可能是个 markdown 链接。三者必须能对上同一个标题。
 */
export function headingIdOf(text: string): string {
  const id = String(text ?? '')
    .replace(/#/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .slice(0, 60)
  return id || 'h'
}

export function normalizeHeadingText(input: string): string {
  let s = String(input ?? '')
  try {
    s = decodeURIComponent(s)
  } catch {
    /* 含非法 % 序列时保留原样 */
  }
  s = stripHeadingMarkup(s)
  s = s
    .replace(/[`*_~]/g, ' ')
    .replace(/[#^]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  return s
}

/** 由任意标题原文算出锚点 id（与 extractHeadings / remark 阶段共用同一算法） */
export function headingIdFromText(text: string): string {
  return headingIdOf(stripInlineFormatting(stripHeadingMarkup(text)))
}

/** 标题的**展示**文字：URL 解码 + 剥掉 markdown/wikilink 语法（保留原大小写） */
export function headingDisplayText(input: string): string {
  let s = String(input ?? '')
  try {
    s = decodeURIComponent(s)
  } catch {
    /* 含非法 % 序列时保留原样 */
  }
  return stripHeadingMarkup(s).trim()
}

/**
 * 提取某一小节的正文（Obsidian 的 `![[笔记#标题]]` / 悬浮预览都用它）。
 * 区间 = 该标题的下一行 → 下一个「同级或更高级」标题之前，
 * 因此不会把后面没有引用的内容一起带出来。
 */
export function extractHeadingSection(content: string, heading: string): string | null {
  const want = normalizeHeadingText((heading || '').split('#').pop() || heading)
  if (!want) return null
  const lines = content.split('\n')
  const heads: { idx: number; level: number; text: string }[] = []
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (/^\s{0,3}(```|~~~)/.test(l)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(l)
    if (m) heads.push({ idx: i, level: m[1].length, text: normalizeHeadingText(m[2]) })
  }
  const k = heads.findIndex((h) => h.text === want)
  if (k < 0) return null
  let end = lines.length
  for (let j = k + 1; j < heads.length; j++) {
    if (heads[j].level <= heads[k].level) {
      end = heads[j].idx
      break
    }
  }
  return lines.slice(heads[k].idx + 1, end).join('\n').trim()
}

export interface HeadingEntry {
  level: number
  text: string
  id: string
}

/** 提取正文标题（跳过代码块），供大纲侧边栏使用 */
export function extractHeadings(content: string): HeadingEntry[] {
  const out: HeadingEntry[] = []
  const stripped = content.replace(/```[\s\S]*?```/g, ' ').replace(/~~~[\s\S]*?~~~/g, ' ')
  // 重复标题必须去重：两处「## 总结」若共用 id，TOC 第二项、?h= 深链、
  // scroll-spy 会全部指向第一个标题。规则与 GitHub/Obsidian 一致：-1、-2…
  const seen = new Map<string, number>()
  for (const m of stripped.matchAll(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/gm)) {
    // text 保留行内排版标记（加粗等），大纲里按格式渲染而不是显示 `**`；
    // id 必须用剥干净的纯文字，才能和正文一侧（mdast 文本节点）算出的 id 一致。
    const text = stripHeadingMarkup(m[2])
    if (!text) continue
    const base = headingIdOf(stripInlineFormatting(text))
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    out.push({ level: m[1].length, text, id: n === 0 ? base : `${base}-${n}` })
  }
  return out
}

export interface HeadingSegment {
  type: 'text' | 'math'
  /** text：可见文字；math：TeX 源码（交给 KaTeX 渲染） */
  value: string
}

/**
 * 把标题文本切成「普通文字 / 公式」片段，供大纲里用 KaTeX 渲染公式。
 * 识别 $$..$$ 与 $..$，跳过 \$ 转义；其余部分一律当文字（顺带剥删除线）。
 */
export function splitHeadingSegments(input: string): HeadingSegment[] {
  const out: HeadingSegment[] = []
  let i = 0
  let buf = ''
  const flush = () => {
    if (buf) {
      // 行内排版标记原样保留，交给大纲的 renderInlineMarkup 渲染（不再预先剥掉）
      out.push({ type: 'text', value: buf })
      buf = ''
    }
  }
  while (i < input.length) {
    const ch = input[i]
    if (ch === '\\') {
      buf += input.slice(i, i + 2)
      i += 2
      continue
    }
    if (ch !== '$') {
      buf += ch
      i += 1
      continue
    }
    const display = input.startsWith('$$', i)
    const closer = display ? '$$' : '$'
    const end = input.indexOf(closer, i + closer.length)
    if (end < 0) {
      buf += ch
      i += 1
      continue
    }
    const tex = input.slice(i + closer.length, end)
    // 空公式（$$ 或 $ $）不当公式，避免把纯文本里的美元符号吞掉
    if (!tex.trim()) {
      buf += ch
      i += 1
      continue
    }
    flush()
    out.push({ type: 'math', value: tex.trim() })
    i = end + closer.length
  }
  flush()
  return out
}

/** 字数：汉字逐字 + 英文数字按词 */
export function wordCountOf(content: string): number {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[[^\]]*\]\]/g, ' ')
  const cjk = (text.match(/\p{Script=Han}/gu) || []).length
  const words = (text.match(/[A-Za-z0-9]+/g) || []).length
  return cjk + words
}

export function parseNoteDate(data: Record<string, unknown>): Date | null {
  const raw = data.date ?? data.day ?? data.created
  if (raw === undefined || raw === null) return null
  const d = new Date(raw as string | number | Date)
  if (!isNaN(+d)) return d
  return null
}

/** 提取纯文本摘要（供列表与嵌入卡片） */
export function excerptOf(content: string, len = 120): string {
  const text = content
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!\[\[[^\]]*\]\]/g, ' ')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?\[![^\]]*\]\s?/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~$]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > len ? text.slice(0, len) + '…' : text
}

// ---------- wikilink 解析 ----------

export interface LinkParts {
  target: string
  heading: string
  alias: string | null
}

/** `[[path#heading|alias]]` → { target, heading, alias } */
export function parseWikilink(link: string): LinkParts {
  let s = link.trim()
  let alias: string | null = null
  const bi = s.indexOf('|')
  if (bi >= 0) {
    alias = s.slice(bi + 1).trim() || null
    s = s.slice(0, bi)
  }
  let heading = ''
  const hi = s.indexOf('#')
  if (hi >= 0) {
    heading = s.slice(hi)
    s = s.slice(0, hi)
  }
  // 块引用 [[笔记#^blockid]]：保留块 ID（悬浮预览用），跳转时按整篇笔记处理
  s = normalizePath(s.replace(/\.(md|markdown)$/i, ''))
  return { target: s, heading, alias }
}

export interface WikiRefs {
  all: string[]
  embeds: string[]
  links: string[]
}

export function extractWikiRefs(raw: string): WikiRefs {
  const all: string[] = []
  const embeds: string[] = []
  const links: string[] = []
  for (const m of raw.matchAll(/(!?)\[\[([^\][\n]+?)\]\]/g)) {
    all.push(m[2])
    ;(m[1] === '!' ? embeds : links).push(m[2])
  }
  return { all, embeds, links }
}

/** markdown 标准图片语法中的 vault 相对路径（排除外链/data URI） */
export function extractMdImagePaths(raw: string): string[] {
  const out: string[] = []
  for (const m of raw.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    let p = m[1] || ''
    try {
      p = decodeURIComponent(p)
    } catch {
      /* 保留原值 */
    }
    if (p && !/^(https?:|data:|mailto:)/i.test(p)) out.push(normalizePath(p))
  }
  return out
}

// ---------- 附件类型 ----------

export const ASSET_EXTS: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

export function isMarkdownPath(p: string): boolean {
  return /\.(md|markdown)$/i.test(p)
}

export function assetExt(path: string): string {
  const i = path.lastIndexOf('.')
  return i >= 0 ? path.slice(i).toLowerCase() : ''
}

export function mimeTypeFor(path: string): string | null {
  return ASSET_EXTS[assetExt(path)] ?? null
}

/**
 * 解析嵌入目标（![[x]] 或 ![](x)）到 vault 内附件路径。
 * 匹配顺序：精确路径 → 补全扩展名 → 精确文件名 → 任意目录下同名文件（大小写不敏感）。
 * 最后一步覆盖 Obsidian 常见场景：笔记里写 ![[图片.png]]，实际文件在 attachments/ 子目录。
 */
export function resolveEmbedPath(target: string, assetPaths: Set<string>): string | null {
  const t = normalizePath(target)
  if (!t) return null
  const exts = Object.keys(ASSET_EXTS)
  const candidates = [t]
  if (!exts.includes(assetExt(t))) {
    for (const e of exts) candidates.push(t + e)
  }
  const base = t.split('/').pop() || t
  if (base !== t) {
    candidates.push(base)
    if (!exts.includes(assetExt(base))) {
      for (const e of exts) candidates.push(base + e)
    }
  }
  for (const c of candidates) {
    if (assetPaths.has(c)) return c
  }
  // 兜底：文件名后缀匹配（vault 内任意层级目录，大小写不敏感）
  const lowered = candidates.map((c) => c.toLowerCase())
  for (const p of assetPaths) {
    const pl = p.toLowerCase()
    for (const c of lowered) {
      if (pl === c || pl.endsWith('/' + c)) return p
    }
  }
  return null
}

/**
 * 从正文里提取 ^blockid 所在的文本块（Obsidian 块引用，嵌入/预览共用）。
 * 区间 = 该块自身，不向外扩散：向上遇到空行或标题就停，向下只到带 ^id 的那一行。
 */
export function extractBlockText(content: string, blockId: string): string | null {
  const esc = blockId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp('\\^' + esc + '\\s*$')
  const lines = content.split('\n')
  const idx = lines.findIndex((l) => re.test(l.trimEnd()))
  if (idx < 0) return null

  const isHeading = (l: string) => /^ {0,3}#{1,6}\s/.test(l)
  const stripId = (s: string) => s.replace(new RegExp('\\s*\\^' + esc + '\\s*$'), '').trim()

  // 向上找块首：遇到空行或标题就停（原来的实现判断的是 lines[start] 而不是
  // lines[start-1]，会把紧邻的标题行一起吞进引用区间）
  let start = idx
  while (start > 0 && lines[start - 1].trim() !== '' && !isHeading(lines[start - 1])) start--

  const block = lines.slice(start, idx + 1).join('\n')
  const cleaned = stripId(block)
  if (cleaned) return cleaned

  // 孤立的 ^id 行（前后皆空行、无内容）：回退到上一个非空块
  let end = idx - 1
  while (end >= 0 && lines[end].trim() === '') end--
  if (end < 0) return null
  let s2 = end
  while (s2 > 0 && lines[s2 - 1].trim() !== '' && !isHeading(lines[s2 - 1])) s2--
  return lines.slice(s2, end + 1).join('\n').trim() || null
}

/** 取嵌入/预览要显示的那一段正文：块引用 → 小节 → 整篇 */
export function extractRegion(content: string, heading?: string): string {
  if (!heading) return content
  const h = heading.trim()
  if (h.startsWith('^')) return extractBlockText(content, h.slice(1)) ?? content
  return extractHeadingSection(content, h) ?? content
}

/** 链接目标标准化为 slug（用于引用索引；未创建目标也归一化存储） */
export function refSlugOf(link: string): string {
  const { target } = parseWikilink(link)
  return target || '#unresolved'
}

export const SKIP_DIRS = ['.obsidian', '.trash', '.smart-env', '.git']

export function shouldSkipPath(path: string): string | null {
  const n = normalizePath(path)
  for (const d of SKIP_DIRS) {
    if (n === d || n.startsWith(d + '/')) return `跳过 ${d} 配置目录`
  }
  if (/\.(canvas|excalidraw\.md)$/i.test(n)) return 'Canvas/画板文件暂不支持渲染'
  if (/(^|\/)\.DS_Store$/i.test(n)) return '系统文件'
  return null
}
