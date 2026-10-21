#!/usr/bin/env node
/**
 * 内容构建脚本：content/（发布工具生成的公开笔记+附件）→ public/data/*.json + public/assets/*
 *
 * - 每篇笔记生成 /data/notes/<base64url(slug)>.json（原文、frontmatter、反链、出链）
 * - 生成 /data/index.json（列表 + 附件路径索引，供搜索/文件夹/悬浮预览使用）
 * - 附件原样拷贝到 /assets/<相对路径>（页面里按相同规则引用）
 * 反链/出链/标签/摘要等与全栈版同一套算法（此文件内为对应实现）。
 */

import fsSync from 'node:fs'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
/**
 * 内容目录：优先用发布管理器所在的用户数据目录里的 content/，
 * 其次用环境变量 CONTENT_DIR，最后才用仓库里的 content/（CI 走这条）。
 *
 * 这样源目录（可以开源的那份）里不放任何个人笔记，
 * CI 在 GitHub 上构建时用户目录不存在，自然回落到仓库自带 content/，行为不变。
 */
const CONTENT = (() => {
  const fromEnv = (process.env.CONTENT_DIR || '').trim()
  if (fromEnv) return path.resolve(fromEnv)
  const home = os.homedir() || ''
  let dataDir = ''
  const fromData = (process.env.OBSIDIAN_BLOG_DATA || '').trim()
  if (fromData) dataDir = path.resolve(fromData)
  else if (process.platform === 'win32') dataDir = path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'obsidian-blog')
  else if (process.platform === 'darwin') dataDir = path.join(home, 'Library', 'Application Support', 'obsidian-blog')
  else dataDir = path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'obsidian-blog')
  const inUserData = path.join(dataDir, 'content')
  try {
    if (fsSync.statSync(inUserData).isDirectory()) return inUserData
  } catch {
    /* 用户数据目录里没有，回落 */
  }
  return path.join(ROOT, 'content')
})()
const PUBLIC = path.join(ROOT, 'public')
// ⚠️ 这个常量必须定义在文件顶部：finalize() 在 --finalize 模式下会被提前调用，
// 那时主流程还没执行到，晚定义的变量会让 finalize 内部抛 ReferenceError，
// 被 catch 静默吞掉（症状：源码目录里的站名/内容摘要没被换成占位值）。
const generatedDir = path.join(ROOT, 'src', 'lib')

/**
 * 用户数据目录：与 manager.mjs 保持同一套解析规则。
 * 构建产物（public/data、public/assets、out）会搬到这里的 build/ 下，
 * 让源码目录（可以开源的那份）里不留任何笔记内容。
 */
const DATA_DIR = (() => {
  const fromEnv = (process.env.OBSIDIAN_BLOG_DATA || '').trim()
  if (fromEnv) return path.resolve(fromEnv)
  const home = os.homedir() || ''
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'obsidian-blog')
  }
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'obsidian-blog')
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'obsidian-blog')
})()

/**
 * CI 环境（GitHub Actions 会自动设 CI=true）下不搬运：
 * Actions 需要 out/ 留在仓库工作目录里给 upload-pages-artifact 用，
 * 而且 Actions 这台机器上本来就没有用户数据目录。
 */
const IS_CI = !!(process.env.CI || process.env.GITHUB_ACTIONS)

/**
 * 站名（网页左上角标题 / <title>）从仓库里的 site-name.txt 读，
 * 由发布管理器在发布时写入并随本次提交一起推上来。
 *
 * 这样网页标题不依赖 GitHub 的 Actions 变量接口：
 *   - 推送这条路一直是通的，名字跟着代码走，改名 + 发布即可生效；
 *   - 仓库里看得见、可追溯，换机器/换网络也一样。
 * 兼容旧的 Actions 变量方式：site-name.txt 不存在时回落到
 * NEXT_PUBLIC_SITE_NAME（工作流里的 vars.SITE_NAME），仍然没有才用「笔记」。
 */
function resolveSiteName() {
  // 本地构建优先用用户数据目录里的站名，CI 只认仓库里那份（随提交推上来的）
  const candidates = IS_CI
    ? [path.join(ROOT, 'site-name.txt')]
    : [path.join(DATA_DIR, 'site-name.txt'), path.join(ROOT, 'site-name.txt')]
  for (const file of candidates) {
    try {
      const raw = fsSync.readFileSync(file, 'utf8')
      const name = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n')[0].trim()
      if (name) return { name, from: 'site-name.txt' }
    } catch {
      /* 没有这个文件就试下一个 */
    }
  }
  const env = (process.env.NEXT_PUBLIC_SITE_NAME || '').trim()
  if (env) return { name: env, from: 'NEXT_PUBLIC_SITE_NAME' }
  return { name: '笔记', from: '默认值' }
}

const SKIP = ['.obsidian', '.trash', '.smart-env', '.git']
const ASSET_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico', '.avif', '.pdf', '.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm'])

// ---------- 与 src/lib/obsidian.ts 一致的工具 ----------
const normalize = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '')
const toSlug = (p) => normalize(p).replace(/\.(md|markdown)$/i, '')
const basenameOf = (p) => {
  const n = normalize(p)
  const base = n.split('/').pop() || n
  return base.replace(/\.(md|markdown)$/i, '')
}
const folderOf = (p) => {
  const n = normalize(p)
  const i = n.lastIndexOf('/')
  return i <= 0 ? '' : n.slice(0, i)
}
const headingIdOf = (text) => {
  const id = text.replace(/#/g, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}\-_]/gu, '').slice(0, 60)
  return id || 'h'
}
const titleOf = (p, data) => {
  const t = data.title
  return typeof t === 'string' && t.trim() ? t.trim() : basenameOf(p)
}
const parseNoteDate = (data) => {
  const raw = data.date ?? data.day ?? data.created
  if (raw === undefined || raw === null) return null
  const d = new Date(raw)
  return isNaN(+d) ? null : d
}
const wordCountOf = (content) => {
  const text = content.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[\[[^\]]*\]\]/g, ' ')
  const cjk = (text.match(/\p{Script=Han}/gu) || []).length
  const words = (text.match(/[A-Za-z0-9]+/g) || []).length
  return cjk + words
}
const excerptOf = (content, len = 120) => {
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
/**
 * 全文搜索用的纯文本（不截断）：剥掉 frontmatter、图片/链接语法、标题井号、
 * 引用符号与强调标记，保留正文（含公式与代码，方便搜函数名/符号）。
 * 上限 20000 字防止个别超长笔记把索引撑爆。
 */
const searchTextOf = (content) => {
  const text = content
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/!\[\[[^\]]*\]\]/g, ' ')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^ {0,3}#{1,6}\s+/gm, '')
    .replace(/^>\s?\[![^\]]*\]\s?/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_~`#>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, 20000)
}
function extractTags(data, content) {
  const out = new Set()
  const add = (v) => {
    if (typeof v === 'string') v.split(/[,，]/).forEach((s) => s.trim() && out.add(s.trim()))
    else if (Array.isArray(v)) v.forEach((x) => typeof x === 'string' && x.trim() && out.add(x.trim()))
  }
  add(data.tags)
  add(data.tag)
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
/**
 * 修「markdown 链接被塞进 wikilink」的坏行（与 src/lib/obsidian.ts 的
 * repairObsidianArtifacts 同一实现）。
 *
 * Obsidian 允许 wikilink 目标里带成对方括号，但早期导出/手滑会写出
 *   ![[P8820 [CSP-S 2022] 数据传输](https //x)](CSP-S.md#[P8820%20...](https%20//x))
 * 这种「两层 markdown 链接套在 [[ ]] 里、且没有闭合 ]]」的行。按方括号配平
 * 扫描时它没有结束符，整段引用直接失效。这里只处理「整行、含 [[、不含 ]]」
 * 的行，把它重写成 [[外层链接目标|显示文字]]。
 */
const ARTIFACT_LINE = /^(\s*)(!?)\[\[(.+?)\]\(([^)]*)\)\]\((.+)\)\s*$/
const MD_LINK_RE = /\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]\([^()]*\)/g
function stripMdLinks(input) {
  let cur = input
  let prev
  let guard = 0
  do {
    prev = cur
    cur = cur.replace(MD_LINK_RE, '$1')
  } while (cur !== prev && ++guard < 8)
  return cur
}
function repairObsidianArtifacts(content) {
  if (!content.includes('[[')) return content
  let inFence = false
  const lines = content.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      return line
    }
    if (inFence || !line.includes('[[')) return line
    let l = line
    if (!l.includes(']]')) {
      const m = ARTIFACT_LINE.exec(l)
      if (m) {
        const [, indent, bang, label, , target] = m
        l = `${indent}${bang}[[${target.trim()}|${label.trim()}]]`
      }
    }
    // wikilink 内部含 markdown 链接语法时，mdast 解析会把 [[ 与 ]] 拆散，
    // 这里先剥成纯文字（与 src/lib/obsidian.ts 同一实现）
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

/**
 * 按方括号配平扫描 wikilink（与 src/lib/obsidian.ts 的 scanWikilinks 同一规则）。
 * 不能用 /\[\[([^\][\n]+?)\]\]/ 这种朴素正则：本库存在目标里带成对方括号的
 * wikilink（标题本身就是 markdown 链接），朴素正则会漏掉或截断它们。
 */
function scanWikilinks(text) {
  const out = []
  for (let i = 0; i < text.length; i++) {
    const isEmbed = text[i] === '!' && text[i + 1] === '[' && text[i + 2] === '['
    const start = isEmbed ? i + 1 : i
    if (text[start] !== '[' || text[start + 1] !== '[') continue
    let j = start + 2
    let depth = 0
    let inner = ''
    while (j < text.length) {
      const ch = text[j]
      if (ch === '\\') {
        inner += text[j + 1] ?? ''
        j += 2
        continue
      }
      if (ch === '\n') break
      if (ch === '[') depth++
      else if (ch === ']') {
        if (depth === 0 && text[j + 1] === ']') {
          out.push({ start: i, end: j + 2, isEmbed, inner })
          i = j + 1
          break
        }
        if (depth > 0) depth--
      }
      inner += ch
      j++
    }
  }
  return out
}

function extractWikiRefs(raw) {
  const all = []
  const embeds = []
  const links = []
  for (const tk of scanWikilinks(repairObsidianArtifacts(raw))) {
    all.push(tk.inner)
    ;(tk.isEmbed ? embeds : links).push(tk.inner)
  }
  return { all, embeds, links }
}
function extractMdImagePaths(raw) {
  const out = []
  for (const m of raw.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    let p = m[1] || ''
    try { p = decodeURIComponent(p) } catch { /* 保留原值 */ }
    if (p && !/^(https?:|data:|mailto:)/i.test(p)) out.push(normalize(p))
  }
  return out
}
function parseWikilink(link) {
  let s = link.trim()
  let alias = null
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
  s = normalize(s.replace(/\.(md|markdown)$/i, ''))
  return { target: s, heading, alias }
}
const refSlugOf = (link) => parseWikilink(link).target || '#unresolved'

function walk(dir, out = []) {
  let entries
  try {
    entries = fsSync.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const abs = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (SKIP.includes(e.name)) continue
      walk(abs, out)
    } else if (e.isFile()) {
      out.push(path.relative(CONTENT, abs).replace(/\\/g, '/'))
    }
  }
  return out
}

const slugFile = (slug) => Buffer.from(slug, 'utf8').toString('base64url')

// ---------- 主流程 ----------
// --finalize 只做「把产物搬出源码目录」，不需要重新生成一遍内容：
// 主流程在此直接跳过，末尾再执行 finalize()。
const FINALIZE_ONLY = process.argv.includes('--finalize')
// .markdown 与 .md 是同一类笔记（Obsidian 两种扩展名都认），这里必须一致，
// 否则 toSlug() 接受的 .markdown 会在更早一步被丢掉。
const isPublicMd = (p) => /\.(md|markdown)$/i.test(p)

/**
 * 发布时写入的「本地笔记时间」清单（content/.blog-meta.json）。
 *
 * 为什么需要：git 不保存文件 mtime，CI 全新 checkout 后每篇笔记的 mtime
 * 都是 checkout 那一刻，于是线上所有笔记的日期都变成部署日、排序也全乱。
 * 发布时间在用户本机，能读到真实 mtime/birthtime，所以由发布管理器把它们
 * 记下来随 content/ 一起提交，构建时优先用这份清单。
 */
const META_FILE = path.join(CONTENT, '.blog-meta.json')
let noteMeta = {}
try {
  const j = JSON.parse(fsSync.readFileSync(META_FILE, 'utf8'))
  if (j && j.notes && typeof j.notes === 'object') noteMeta = j.notes
} catch {
  /* 没有清单（首次发布前 / 老仓库）：回落到文件 stat */
}
const metaOf = (rel) => {
  const m = noteMeta[normalize(rel)]
  return m && typeof m === 'object' ? m : {}
}

if (FINALIZE_ONLY) {
  await finalize()
  process.exit(0)
}

const rels = fsSync.existsSync(CONTENT) ? walk(CONTENT) : []
if (rels.length === 0) {
  console.log('[build-content] content/ 为空：先运行发布管理器（npm run manage）推送公开笔记')
}

const mdRels = rels.filter(isPublicMd)
const assetRels = rels.filter((p) => !isPublicMd(p) && ASSET_EXTS.has(path.extname(p).toLowerCase()))

// 没有任何公开笔记时**拒绝构建**：历史上真的发生过 CI 绿灯发布出一个空站点
// （content/ 从未填充，构建照常 exit 0）。空站点比构建失败更难发现。
if (mdRels.length === 0) {
  console.error(
    '[build-content] content/ 里没有任何公开笔记 —— 拒绝构建空站点。' +
      '先运行发布管理器（npm run manage）把笔记标为公开并发布；确实要构建空站请设 ALLOW_EMPTY=1。'
  )
  if (!process.env.ALLOW_EMPTY) process.exit(1)
}

// 附件目录每次全量重建：不清掉上一次的附件，取消引用的旧图会一直留在产物里。
await fs.rm(path.join(PUBLIC, 'assets'), { recursive: true, force: true })

// 附件拷贝到 public/assets/<相对路径>
for (const rel of assetRels) {
  const dest = path.join(PUBLIC, 'assets', rel)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.copyFile(path.join(CONTENT, rel), dest)
}

// 解析笔记
const notes = []
const seenSlugs = new Set()
for (const rel of mdRels) {
  const abs = path.join(CONTENT, rel)
  const raw = await fs.readFile(abs, 'utf8')
  let data, content
  try {
    ;({ data, content } = matter(raw))
  } catch (e) {
    // 单篇 frontmatter 坏了不该让整次构建失败（否则 --finalize 不会执行，
    // 源码目录会残留笔记正文）。跳过并大声报出来。
    console.warn(`[build-content] 跳过 ${rel}：frontmatter 解析失败（${e.message}）`)
    continue
  }
  // 正文里的坏 wikilink 行先修好：摘要 / 字数 / 搜索正文 / 出链都用这份修好的文本
  // （渲染端 parseNote 也会修，那里服务的是未修的原稿 raw，两边结果一致）
  content = repairObsidianArtifacts(content)
  const slug = toSlug(rel)
  if (seenSlugs.has(slug)) {
    // a.md 与 a.markdown 会撞成同一个 slug，后者覆盖前者
    console.warn(`[build-content] 跳过 ${rel}：slug「${slug}」已被占用（.md / .markdown 同名）`)
    continue
  }
  seenSlugs.add(slug)
  const meta = metaOf(rel)
  const st = await fs.stat(abs)
  const mtime = meta.mtime ? new Date(meta.mtime) : st.mtime
  // 笔记日期：frontmatter 显式声明优先，否则用**最后修改时间**。
  // 不用 birthtime：笔记通常是整库拷进 vault 的，birthtime 全部等于拷贝那一刻
  // （实测 116 篇全落在同一天），拿它当日期等于又回到「所有笔记日期都一样」。
  const date = parseNoteDate(data) ?? mtime
  notes.push({
    slug,
    path: normalize(rel),
    title: titleOf(rel, data),
    folder: folderOf(rel),
    raw,
    content,
    frontmatter: data ?? {},
    tags: extractTags(data, content),
    isPublic: true,
    wordCount: wordCountOf(content),
    noteDate: isNaN(+date) ? null : date.toISOString(),
    updatedAt: mtime.toISOString(),
    excerpt: excerptOf(content, 120),
    searchText: searchTextOf(content),
  })
}
notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

// 双链/出链解析（最短路径匹配，与全栈版一致）
const bySlug = new Map()
const byBasename = new Map()
for (const n of notes) {
  bySlug.set(n.slug, n)
  const base = basenameOf(n.path)
  ;(byBasename.get(base) ?? byBasename.set(base, []).get(base)).push(n)
}
function resolveNote(target) {
  if (!target) return null
  const direct = bySlug.get(target)
  if (direct) return direct
  const base = target.split('/').pop() || target
  const arr = byBasename.get(base)
  if (!arr || arr.length === 0) return null
  return [...arr].sort((a, b) => a.path.length - b.path.length)[0]
}

const refRows = new Map() // sourceSlug -> Set<targetSlug>
const linkIndexAssets = assetRels.slice()
const assetSet = new Set(linkIndexAssets.map((p) => normalize(p)))

/** 嵌入目标 → 附件路径。与 src/lib/obsidian.ts 的 resolveEmbedPath 保持同一套规则：
 *  精确路径 → 补全扩展名 → 精确文件名 → 任意目录下同名（大小写不敏感）。 */
function resolveAsset(target, assets) {
  const t = normalize(target)
  if (!t) return null
  const exts = [...ASSET_EXTS]
  const hasExt = (p) => {
    const i = p.lastIndexOf('.')
    return i >= 0 && ASSET_EXTS.has(p.slice(i).toLowerCase())
  }
  const candidates = [t]
  if (!hasExt(t)) for (const e of exts) candidates.push(t + e)
  const base = t.split('/').pop() || t
  if (base !== t) {
    candidates.push(base)
    if (!hasExt(base)) for (const e of exts) candidates.push(base + e)
  }
  for (const c of candidates) if (assets.has(c)) return c
  const lowered = candidates.map((c) => c.toLowerCase())
  for (const p of assets) {
    const pl = p.toLowerCase()
    for (const c of lowered) if (pl === c || pl.endsWith('/' + c)) return p
  }
  return null
}

for (const n of notes) {
  const { links, embeds } = extractWikiRefs(n.raw)
  const targets = []
  for (const link of links) {
    const { target } = parseWikilink(link)
    if (target) targets.push(target)
  }
  for (const emb of embeds) {
    const { target } = parseWikilink(emb)
    if (!target) continue
    // 嵌入解析：附件优先（不算出链），解析到笔记的算出链。
    // 必须与前端 src/lib/obsidian.ts 的 resolveEmbedPath 用同一套规则，
    // 否则 ![[diagram]]（省略扩展名）在页面上能显示成图，构建却把它记成笔记出链，
    // 于是反链区冒出一条假的「未创建」。
    if (resolveAsset(target, assetSet)) continue
    targets.push(target)
  }
  const slugs = new Set()
  for (const target of targets) {
    const note = resolveNote(target)
    slugs.add(note ? note.slug : refSlugOf(target))
  }
  refRows.set(n.slug, slugs)
}

const byTitle = new Map(notes.map((n) => [n.slug, n]))
function refItem(slug) {
  const n = byTitle.get(slug)
  return { slug, title: n ? n.title : slug, folder: n ? n.folder : '', isPublic: !!n, resolved: !!n }
}

// 生成数据文件
await fs.rm(path.join(PUBLIC, 'data'), { recursive: true, force: true })
await fs.mkdir(path.join(PUBLIC, 'data', 'notes'), { recursive: true })

const indexNotes = []
for (const n of notes) {
  const outlinks = [...(refRows.get(n.slug) ?? [])].map(refItem)
  const backlinks = notes
    .filter((other) => other.slug !== n.slug && (refRows.get(other.slug) ?? new Set()).has(n.slug))
    .map((other) => refItem(other.slug))
  const file = {
    note: {
      slug: n.slug,
      path: n.path,
      title: n.title,
      folder: n.folder,
      raw: n.raw,
      content: n.content,
      frontmatter: n.frontmatter,
      tags: n.tags,
      isPublic: true,
      wordCount: n.wordCount,
      noteDate: n.noteDate,
      updatedAt: n.updatedAt,
    },
    backlinks,
    outlinks,
  }
  const name = slugFile(n.slug) + '.json'
  await fs.writeFile(path.join(PUBLIC, 'data', 'notes', name), JSON.stringify(file))
  indexNotes.push({
    slug: n.slug,
    path: n.path,
    title: n.title,
    folder: n.folder,
    tags: n.tags,
    isPublic: true,
    wordCount: n.wordCount,
    noteDate: n.noteDate,
    updatedAt: n.updatedAt,
    excerpt: n.excerpt,
    linkCount: outlinks.length,
  })
}

// 发布标记：把「本次构建的数据」绑定到一个唯一 URL 参数上，
// 让浏览器不可能复用上一版 /data/*.json 的缓存（GitHub Pages 的 max-age=600
// 会导致取消公开后 10 分钟内仍能看到旧内容）。
//
// 注意：不能用 `process.env.NEXT_PUBLIC_*` —— 本脚本与 `next build` 是**两个进程**
// （package.json: "build": "node scripts/build-content.mjs && next build"），
// 在这里设置 env 不会被 next build 看到，Next 也就不会做构建期常量替换，
// 客户端只会拿到一个运行时 undefined。改为直接生成一个源文件供前端 import。
//
// 标记由**内容摘要**得出（而不是时间戳）：内容没变则标记不变，
// 访客可继续用缓存；内容一变则标记立刻改变，旧缓存整体失效。
const payload = JSON.stringify({ notes: indexNotes, assets: linkIndexAssets })
const releaseTag = createHash('sha256').update(payload).digest('hex').slice(0, 12)

await fs.writeFile(
  path.join(PUBLIC, 'data', 'index.json'),
  JSON.stringify({
    notes: indexNotes,
    assets: linkIndexAssets,
    // 把发布标记也写进索引：前端的 HTML/JS 会被 GitHub Pages 缓存 10 分钟，
    // 旧页面里的 RELEASE_TAG 是旧的；只有从「刚拉下来的索引」里读到新标记，
    // 才能立刻按新标记去取笔记，不用等缓存过期。
    releaseTag,
    // Actions 会给每个步骤自动注入 GITHUB_SHA，不需要改 workflow。
    // 发布管理器用它判断「线上这一版是不是我刚推的那次提交」，比比时间更准（不受本机时钟影响）。
    commit: process.env.GITHUB_SHA || '',
    generatedAt: new Date().toISOString(),
  })
)

// 全文搜索索引：slug → 纯文本。首页搜索框按需懒加载（只有真的输入时才拉），
// 这样「搜索标题、正文、路径、标签」才名副其实 —— 原先只匹配 120 字摘要。
const searchNotes = {}
for (const n of notes) searchNotes[n.slug] = n.searchText
await fs.writeFile(
  path.join(PUBLIC, 'data', 'search.json'),
  JSON.stringify({ v: 1, notes: searchNotes })
)

await fs.mkdir(generatedDir, { recursive: true })
await fs.writeFile(
  path.join(generatedDir, 'release-tag.ts'),
  [
    '// 本文件由 scripts/build-content.mjs 自动生成，请勿手改。',
    '// 值为笔记数据的内容摘要，用作 /data/*.json 请求上的 ?v= 参数，',
    '// 绕开 GitHub Pages 的 max-age=600 缓存（否则取消公开后旧内容仍可见）。',
    '// 内容未变时该值不变，访客可继续命中缓存。',
    `export const RELEASE_TAG = '${releaseTag}'`,
    '',
  ].join('\n')
)

// 站名同样要传给 `next build` 那个进程，做法与 release-tag 一致：
// 生成一个源文件供前端 import（本脚本设置 env 不会被 next build 看到）。
const siteName = resolveSiteName()
await fs.writeFile(
  path.join(generatedDir, 'site-name.generated.ts'),
  [
    '// 本文件由 scripts/build-content.mjs 自动生成，请勿手改。',
    '// 值来自仓库根目录的 site-name.txt（发布管理器在发布时写入）。',
    '// 改站名请用发布管理器，或直接改 site-name.txt 后重新发布。',
    `export const SITE_NAME = ${JSON.stringify(siteName.name)}`,
    '',
  ].join('\n')
)

console.log(`[build-content] 笔记 ${indexNotes.length} 篇，附件 ${linkIndexAssets.length} 个 → public/data/ + public/assets/`)
console.log(`[build-content] 站名「${siteName.name}」（来源：${siteName.from}）`)
console.log(`[build-content] 发布标记 releaseTag=${releaseTag}`)

// ---------- --finalize：把构建产物搬出源码目录 ----------
/**
 * 供 `npm run build` 在 `next build` 之后调用（`node scripts/build-content.mjs --finalize`）。
 *
 * 源码目录要能直接开源，就不能留着笔记正文、附件和完整站点副本。
 * 本步骤把 public/data、public/assets、out 搬到用户数据目录的 build/ 下，
 * 再把源码目录里这些目录删掉。
 *
 * CI 上不做任何事：Actions 需要 out/ 原地不动给 upload-pages-artifact，
 * 而且那台机器上没有用户数据目录，搬过去也没用。
 *
 * 用 move 而不是 copy：附件可能几十上百 MB，复制既慢又会在源目录留一份残留。
 */
async function finalize() {
  if (IS_CI) {
    console.log('[build-content] CI 环境，构建产物留在仓库目录（Actions 需要 out/）')
    return
  }
  const BUILD_DIR = path.join(DATA_DIR, 'build')
  await fs.mkdir(BUILD_DIR, { recursive: true })

  const moves = [
    [path.join(PUBLIC, 'data'), path.join(BUILD_DIR, 'data')],
    [path.join(PUBLIC, 'assets'), path.join(BUILD_DIR, 'assets')],
    [path.join(ROOT, 'out'), path.join(BUILD_DIR, 'site')],
  ]

  let moved = 0
  for (const [src, dst] of moves) {
    // 目标已存在（上一次构建的残留）先清掉，否则 move 在跨目录时会失败
    await fs.rm(dst, { recursive: true, force: true })
    try {
      await fs.rename(src, dst)
      moved += 1
      console.log(`[build-content] 已把 ${path.relative(ROOT, src) || src} 移到用户数据目录`)
    } catch (e) {
      if (e.code === 'ENOENT') continue // 没构建出来就跳过
      if (e.code === 'EXDEV') {
        // 跨盘（源码在 C:，用户数据目录在 D: 等）rename 会失败。
        // 不处理的话上次的产物已被上面 rm 掉、新的又搬不走，等于两头落空。
        try {
          await fs.cp(src, dst, { recursive: true })
          await fs.rm(src, { recursive: true, force: true })
          moved += 1
          console.log(`[build-content] 已把 ${path.relative(ROOT, src) || src} 复制到用户数据目录（跨盘）`)
          continue
        } catch (e2) {
          console.warn(`[build-content] ${path.relative(ROOT, src)} 跨盘搬移失败：${e2.message}`)
          continue
        }
      }
      console.warn(`[build-content] ${path.relative(ROOT, src)} 未能移走（留在源码目录）：${e.message}`)
    }
  }

  // 生成的源文件不能删（src/lib/site.ts 与 api.ts 会 import 它们，删了下个 build 起不来），
  // 改成写回「中性占位值」：源码目录里看不到站名和内容摘要，
  // 而下一次构建时本脚本会重新生成真实值覆盖掉。
  const placeholders = {
    'release-tag.ts': [
      '// 本文件由 scripts/build-content.mjs 自动生成，请勿手改。',
      '// 构建时会写入笔记数据的内容摘要；此处为占位值（源码目录不保留个人信息）。',
      "export const RELEASE_TAG = ''",
      '',
    ].join('\n'),
    'site-name.generated.ts': [
      '// 本文件由 scripts/build-content.mjs 自动生成，请勿手改。',
      '// 构建时会写入用户数据目录里的站名；此处为中性占位值。',
      'export const SITE_NAME = "笔记"',
      '',
    ].join('\n'),
  }
  for (const [name, content] of Object.entries(placeholders)) {
    try {
      await fs.writeFile(path.join(generatedDir, name), content)
    } catch {
      /* 写不进去也不影响已经搬走的产物 */
    }
  }

  if (moved > 0) {
    console.log(`[build-content] 构建产物已移到：${BUILD_DIR}`)
  }
}

if (process.argv.includes('--finalize')) {
  await finalize()
}
