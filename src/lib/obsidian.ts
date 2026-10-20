import matter from 'gray-matter'

/** 解析笔记：剥离 frontmatter */
export interface ParsedNote {
  data: Record<string, unknown>
  content: string
}

export function parseNote(raw: string): ParsedNote {
  try {
    const m = matter(raw)
    return { data: (m.data ?? {}) as Record<string, unknown>, content: m.content ?? '' }
  } catch {
    return { data: {}, content: raw }
  }
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

/** 标题锚点 id（中英混合）——大纲与渲染组件共用同一算法 */
export function headingIdOf(text: string): string {
  const id = text
    .replace(/#/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .slice(0, 60)
  return id || 'h'
}

export interface HeadingEntry {
  level: number
  text: string
  id: string
}

/** 标题文本清理：剥掉 wikilink / markdown 链接语法，只留可见文字（大纲展示与锚点共用） */
function stripHeadingMarkup(input: string): string {
  let s = input
  // wikilink：[[目标|别名]] → 别名，[[目标]] → 目标
  s = s.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1')
  // markdown 链接 [文字](url)：支持一层嵌套方括号（如 [P3216 [HNOI2011]数学作业](url)），
  // 多层嵌套时由内向外反复剥，结果与浏览器渲染出的可见文本一致（保证锚点 id 对得上）
  let prev: string
  do {
    prev = s
    s = s.replace(/\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]\([^()]*\)/g, '$1')
  } while (s !== prev)
  // 行尾悬挂的块引用 ID（^xxxxxx）也不进大纲
  s = s.replace(/\s+\^[A-Za-z0-9-]{4,}\s*$/, '')
  return s.trim()
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
      out.push({ type: 'text', value: buf.replace(/~~([\s\S]+?)~~/g, '$1') })
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

/** 提取正文标题（跳过代码块），供大纲侧边栏使用 */
export function extractHeadings(content: string): HeadingEntry[] {
  const out: HeadingEntry[] = []
  const stripped = content.replace(/```[\s\S]*?```/g, ' ').replace(/~~~[\s\S]*?~~~/g, ' ')
  for (const m of stripped.matchAll(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/gm)) {
    const text = stripHeadingMarkup(m[2])
    if (!text) continue
    out.push({ level: m[1].length, text, id: headingIdOf(text) })
  }
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

/** 从正文里提取 ^blockid 所在的文本块（Obsidian 块引用，预览/链接标签共用） */
export function extractBlockText(content: string, blockId: string): string | null {
  const esc = blockId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp('\\^' + esc + '\\s*$')
  const lines = content.split('\n')
  const idx = lines.findIndex((l) => re.test(l.trimEnd()))
  if (idx < 0) return null
  let start = idx
  while (start > 0 && lines[start - 1].trim() !== '' && !/^ {0,3}#{1,6}\s/.test(lines[start])) start--
  const block = lines
    .slice(start, idx + 1)
    .join('\n')
    .replace(new RegExp('\\s*\\^' + esc + '\\s*$'), '')
    .trim()
  if (block) return block
  // 孤立的 ^id 行（前后皆空行、无内容）：回退到上一个非空块
  let end = idx - 1
  while (end >= 0 && lines[end].trim() === '') end--
  if (end < 0) return null
  let s2 = end
  while (s2 > 0 && lines[s2 - 1].trim() !== '' && !/^ {0,3}#{1,6}\s/.test(lines[s2])) s2--
  return lines.slice(s2, end + 1).join('\n').trim() || null
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
