'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewKind = 'home' | 'note'

/** 首次加载时从 URL 恢复视图（?note= / ?h= / ?tag=），保证深链与前进后退正确 */
function initialViewFromUrl(): Pick<BlogState, 'view' | 'slug' | 'activeTag' | 'pendingHeading'> {
  if (typeof window === 'undefined') return { view: 'home', slug: null, activeTag: null, pendingHeading: null }
  const params = new URLSearchParams(window.location.search)
  const note = params.get('note')
  const tag = params.get('tag')
  // ?h= 是「打开时定位到某小节」，由浮窗「打开笔记 ↗」写入；消费一次即清除（note-view）
  const h = params.get('h')
  if (note) return { view: 'note', slug: note, activeTag: null, pendingHeading: h }
  if (tag) return { view: 'home', slug: null, activeTag: tag, pendingHeading: null }
  return { view: 'home', slug: null, activeTag: null, pendingHeading: null }
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
  activeTag: string | null
  search: string
  navigateToNote: (slug: string, heading?: string) => void
  goHome: (tag?: string | null) => void
  setTag: (tag: string | null) => void
  setSearch: (s: string) => void
  clearPendingHeading: () => void
}

export const useBlog = create<BlogState>()(
  persist(
    (set) => ({
      // initialViewFromUrl() 现在也返回 pendingHeading（深链 ?note=X&h=Y），
      // 故不再写死 pendingHeading: null，否则会把它盖掉。
      ...initialViewFromUrl(),
      activeTag: null,
      search: '',
      navigateToNote: (slug, heading) =>
        set((s) => ({ view: 'note', slug, pendingHeading: heading ?? null, search: s.search })),
      goHome: (tag) => set({ view: 'home', slug: null, activeTag: tag ?? null }),
      setTag: (tag) => set({ view: 'home', activeTag: tag }),
      setSearch: (s) => set({ search: s }),
      clearPendingHeading: () => set({ pendingHeading: null }),
    }),
    {
      name: 'obsidian-blog-view',
      // 只记住标签筛选；无账号体系，没有登录态可持久化
      partialize: (s) => ({ activeTag: s.activeTag }),
    }
  )
)
