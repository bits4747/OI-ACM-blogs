'use client'

/**
 * 静态站数据适配层：
 * 与全栈版 blog 的 lib/api.ts 导出完全相同的函数签名，
 * 但数据来自构建时生成的 /data/*.json（GitHub Pages 直接托管），
 * 不再需要服务器、数据库和登录。
 */

import { withBase } from '@/lib/site'
import { tNow } from '@/lib/i18n'
// 构建时生成（scripts/build-content.mjs），每次发布换一个新值，
// 用来给 /data/*.json 打上版本参数、绕开 GitHub Pages 的 10 分钟缓存。
import { RELEASE_TAG } from '@/lib/release-tag'

export interface NoteListItem {
  slug: string
  path: string
  title: string
  folder: string
  tags: string[]
  isPublic: boolean
  wordCount: number
  noteDate: string | null
  updatedAt: string
  excerpt: string
  linkCount: number
}

export interface NoteDetail {
  slug: string
  path: string
  title: string
  folder: string
  raw: string
  content: string
  frontmatter: Record<string, unknown>
  tags: string[]
  isPublic: boolean
  wordCount: number
  noteDate: string | null
  updatedAt: string
}

export interface RefItem {
  slug: string
  title: string
  folder?: string
  isPublic: boolean | null
  resolved?: boolean
}

export interface LinkIndex {
  notes: { slug: string; path: string; title: string; isPublic: boolean; excerpt?: string }[]
  assets: { path: string }[]
}

export interface SiteInfo {
  name: string
  title: string
}

interface NoteFile {
  note: NoteDetail
  backlinks: RefItem[]
  outlinks: RefItem[]
}

/** slug → 安全文件名（base64url：不含斜杠/百分号，GitHub Pages 可直接托管） */
function slugFile(slug: string): string {
  const bytes = new TextEncoder().encode(slug)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// 索引拉取一次，全站共享
let indexPromise: Promise<{ notes: NoteListItem[]; assets: string[] }> | null = null

// GitHub Pages 给 /data/*.json 发的是 `Cache-Control: max-age=600`，
// 即发布后最多 10 分钟内浏览器会直接用本地缓存，**连 revalidate 都不做**。
// 后果：取消公开某篇后，访客在旧缓存窗口里仍能看到它（表现为「已取消公开但没隐藏」）。
//
// 这里统一加 `cache: 'no-cache'`：仍然允许本地缓存，但每次都必须回源校验 ETag，
// 未变更时服务端返回 304，开销极小；已变更则立刻拿到新内容。
// 再叠加 `?v=<发布标记>`（见 releaseTag）：让「已发布的那个版本」整体换一个 URL，
// 彻底绕开旧缓存 —— 即使页面是发布前打开的旧标签页，刷新后也会命中新数据。
//
// 另外支持 `?fresh=<时间戳>`（「检查更新」按钮加的）：CDN 与浏览器都是按 URL 缓存的，
// 换一个从没出现过的 URL 就等于强制回源，用来对付「已经发布但 CDN 还在发 10 分钟旧货」。
function freshTag(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('fresh') ?? ''
}

// 当前线上索引里的发布标记。构建期常量 RELEASE_TAG 只用于「还没拿到索引」的那一小段，
// 以及索引里没有该字段的旧站点；正常情况下以索引里的值为准。
let liveTag = ''

function dataFetch(path: string): Promise<Response> {
  const sep = path.indexOf('?') >= 0 ? '&' : '?'
  const fresh = freshTag()
  const suffix = 'v=' + (liveTag || RELEASE_TAG) + (fresh ? '&fresh=' + encodeURIComponent(fresh) : '')
  return fetch(withBase(path + sep + suffix), { cache: 'no-cache' })
}

/**
 * 分钟级时间桶。
 *
 * 索引是「线上有没有新内容」的唯一入口，而 GitHub Pages 给静态文件的头是
 * `Cache-Control: max-age=600`：浏览器与边缘节点都会直接用 10 分钟旧缓存，
 * 期间连回源都不做。所以索引不能带固定 URL —— 换成每分钟才变一次的 URL：
 * 跨分钟就是一次全新的 URL，边缘缓存立刻失效（最多旧 60 秒）；
 * 同一分钟内的所有访客仍然共用同一份缓存，不会把 CDN 打穿。
 */
function indexBucket(): string {
  return String(Math.floor(Date.now() / 60000))
}

function fetchIndex(): Promise<{ notes: NoteListItem[]; assets: string[] }> {
  if (!indexPromise) {
    const fresh = freshTag()
    const q = '?b=' + indexBucket() + (fresh ? '&fresh=' + encodeURIComponent(fresh) : '')
    // 注意不能用 dataFetch：它的 URL 里带着 liveTag，而 liveTag 正是要从这个响应里读出来的。
    indexPromise = fetch(withBase('/data/index.json' + q), { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(tNow().indexFailed)
        return r.json()
      })
      .then((data: { notes: NoteListItem[]; assets: string[]; releaseTag?: string }) => {
        if (data && typeof data.releaseTag === 'string' && data.releaseTag) liveTag = data.releaseTag
        return { notes: data.notes || [], assets: data.assets || [] }
      })
      .catch((e) => {
        // 失败不要污染单例，否则整站会一直卡在报错态
        indexPromise = null
        throw e
      })
  }
  return indexPromise
}

/**
 * 标签页重新可见时丢弃索引单例，下次读取会重新回源。
 *
 * 场景：访客把页面留在后台，期间你发布了新内容。GitHub Pages 的 HTML 有 10 分钟
 * max-age，浏览器不会自己去重新校验；这里只做「数据层」的刷新（成本很小：一个
 * 带 ETag 的 JSON 请求），配合 dataFetch 的 `cache: 'no-cache'`，未变更时就是 304。
 * 不自动 `location.reload()`，避免打断正在阅读的访客。
 */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') indexPromise = null
  })
  // 首次进入也算一次「可见」，让 indexPromise 为 null 以便后续按需拉取
  indexPromise = null
}

/**
 * 拉单篇笔记。
 * 返回 null 表示「真的没有这篇」（404）；其余失败（500/502/网络中断/超时）**必须抛错**，
 * 由调用方区分成「加载失败，可重试」而不是「笔记不存在」。
 * 原先任何 !res.ok 都返回空笔记，导致 500 和超时都显示成「笔记不存在或已被删除」。
 */
async function fetchNoteFile(slug: string): Promise<NoteFile | null> {
  const res = await dataFetch('/data/notes/' + slugFile(slug) + '.json')
  if (res.status === 404) return null
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return (await res.json()) as NoteFile
}

function emptyDetail(slug: string): NoteDetail {
  return {
    slug,
    path: slug + '.md',
    title: slug,
    folder: '',
    raw: '',
    content: '',
    frontmatter: {},
    tags: [],
    isPublic: true,
    wordCount: 0,
    noteDate: null,
    updatedAt: '',
  }
}

// ---------- 与全栈版同签名的接口（无账号体系） ----------
//
// 静态站是**纯只读**的：数据在构建时导出成 /data/*.json，随站点一起托管。
// 因此这里没有任何"管理"类接口 —— 与全栈版不同的是，全栈版那些函数
// （改公开、删笔记、上传、统计、发布）在静态站**根本不存在**，
// 组件里也不应引用；需要这些能力请用全栈版或发布管理器。

export async function fetchSiteInfo(): Promise<SiteInfo> {
  const { SITE_NAME } = await import('@/lib/site')
  // 站名在管理器里填什么就显示什么（不自动补「的博客」）；来源与标题一致，见 lib/site.ts。
  const name = SITE_NAME
  return { name, title: name }
}

export async function fetchNotes(_all = false): Promise<NoteListItem[]> {
  const idx = await fetchIndex()
  return idx.notes
}

export async function fetchNoteDetail(
  slug: string
): Promise<{ note: NoteDetail; backlinks: RefItem[]; outlinks: RefItem[] } | 'private' | 'not_found'> {
  const file = await fetchNoteFile(slug)
  if (!file || !file.note.raw) return 'not_found'
  return file
}

/** 全文搜索索引：slug → 纯文本（构建时生成，只有真的开始搜索时才拉） */
let searchPromise: Promise<Record<string, string>> | null = null
export function fetchSearchIndex(): Promise<Record<string, string>> {
  if (!searchPromise) {
    searchPromise = dataFetch('/data/search.json')
      .then((r) => {
        if (!r.ok) throw new Error(tNow().indexFailed)
        return r.json() as Promise<{ notes: Record<string, string> }>
      })
      .then((j) => j.notes ?? {})
      .catch((e) => {
        // 失败不要污染单例，下次输入还能重试
        searchPromise = null
        throw e
      })
  }
  return searchPromise
}

export async function fetchLinkIndex(): Promise<LinkIndex> {
  const idx = await fetchIndex()
  return {
    notes: idx.notes.map((n) => ({
      slug: n.slug,
      path: n.path,
      title: n.title,
      isPublic: n.isPublic,
      excerpt: n.excerpt,
    })),
    assets: idx.assets.map((p) => ({ path: p })),
  }
}
