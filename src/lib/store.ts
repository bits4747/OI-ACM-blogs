'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewKind = 'home' | 'note'

/** 首次加载时从 URL 恢复视图（?note= / ?h= / ?tag= / ?folder=），保证深链与前进后退正确 */
function initialViewFromUrl(): Pick<
  BlogState,
  'view' | 'slug' | 'activeTag' | 'folder' | 'pendingHeading' | 'pendingText'
> {
  if (typeof window === 'undefined')
    return {
      view: 'home',
      slug: null,
      activeTag: null,
      folder: '',
      pendingHeading: null,
      pendingText: null,
    }
  const params = new URLSearchParams(window.location.search)
  const note = params.get('note')
  const tag = params.get('tag')
  const folder = params.get('folder') || ''
  // ?h= 是「打开时定位到某小节」，由浮窗「打开笔记 ↗」写入；消费一次即清除（note-view）
  const h = params.get('h')
  if (note)
    return {
      view: 'note',
      slug: note,
      activeTag: null,
      // 笔记页也带着来源文件夹：点「返回」回到进来时那一层，而不是根目录
      folder,
      pendingHeading: h,
      pendingText: null,
    }
  if (tag)
    return {
      view: 'home',
      slug: null,
      activeTag: tag,
      folder: '',
      pendingHeading: null,
      pendingText: null,
    }
  return {
    view: 'home',
    slug: null,
    activeTag: null,
    folder,
    pendingHeading: null,
    pendingText: null,
  }
}

/**
 * 全局视图状态。
 *
 * 静态站**没有账号体系**（2026-10-13 与全栈版对齐去掉）：
 * 纯只读站点，没有登录、没有注册、没有本地账号，打开即用。
 * 阅读偏好（字号、折叠等）直接用固定键存在 localStorage 里。
 */
interface BlogState {
  view: ViewKind
  slug: string | null
  pendingHeading: string | null
  /** 打开笔记后要滚到的正文片段（搜索命中正文时由结果行写入，消费一次即清除） */
  pendingText: string | null
  activeTag: string | null
  /** 首页当前所在文件夹（相对库根的路径，'' = 全部）。逐层下钻靠它定位。 */
  folder: string
  search: string
  navigateToNote: (slug: string, heading?: string, text?: string) => void
  goHome: (tag?: string | null) => void
  setTag: (tag: string | null) => void
  /** 下钻到某个文件夹（'' = 回到全部） */
  openFolder: (folder: string) => void
  setSearch: (s: string) => void
  clearPendingHeading: () => void
  clearPendingText: () => void
}

export const useBlog = create<BlogState>()(
  persist(
    (set) => ({
      // initialViewFromUrl() 现在也返回 pendingHeading（深链 ?note=X&h=Y），
      // 故不再写死 pendingHeading: null，否则会把它盖掉。
      ...initialViewFromUrl(),
      activeTag: null,
      search: '',
      navigateToNote: (slug, heading, text) =>
        set((s) => ({
          view: 'note',
          slug,
          pendingHeading: heading ?? null,
          pendingText: text ?? null,
          search: s.search,
        })),
      // 从笔记返回首页时保留当前文件夹：在「比赛/NF」里打开一篇再点返回，
      // 应该回到 NF，而不是被扔回根目录
      goHome: (tag) =>
        set((s) => ({
          view: 'home',
          slug: null,
          activeTag: tag ?? null,
          folder: tag ? '' : s.folder,
        })),
      setTag: (tag) => set({ view: 'home', activeTag: tag, folder: '' }),
      openFolder: (folder) => set({ view: 'home', activeTag: null, folder }),
      setSearch: (s) => set({ search: s }),
      clearPendingHeading: () => set({ pendingHeading: null }),
      clearPendingText: () => set({ pendingText: null }),
    }),
    {
      name: 'obsidian-blog-view',
      // 只记住标签筛选；无账号体系，没有登录态可持久化
      partialize: (s) => ({ activeTag: s.activeTag }),
    }
  )
)
