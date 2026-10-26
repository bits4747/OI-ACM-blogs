'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Moon, RefreshCw, Search, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchSiteInfo } from '@/lib/api'
import { useBlog } from '@/lib/store'
import { HomeView } from '@/components/blog/home-view'
import { NoteView } from '@/components/blog/note-view'
import { useLang, useT } from '@/lib/i18n'
import { T } from '@/components/blog/t-text'

const emptySubscribe = () => () => {}

/** popstate（浏览器前进/后退）标志：模块级共享，子组件与父组件的 effect 都要读到 */
let isPopstateNavigation = false

/** SSR 安全的 mounted 检测 */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useMounted()
  const t = useT()
  const current = mounted ? (resolvedTheme ?? theme) : 'light'
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t.toggleTheme}
      title={t.toggleTheme}
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
    >
      {mounted && current === 'dark' ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  )
}

/**
 * 语言切换。只换界面文案，博客内容（标题、正文、文件夹名）保持原样。
 * 默认跟随浏览器语言，手动切过之后记在 localStorage 里。
 */
function LangToggle() {
  const lang = useLang((s) => s.lang)
  const setLang = useLang((s) => s.setLang)
  const t = useT()
  const mounted = useMounted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-2 text-xs font-medium"
      aria-label={t.switchLang}
      title={t.switchLang}
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
    >
      {/* 未挂载前不渲染文字，避免 SSR/CSR 不一致 */}
      {mounted ? (lang === 'zh' ? 'EN' : '中') : '　'}
    </Button>
  )
}

/**
 * 「检查更新」按钮 —— 让访客不必等 GitHub Pages 的 10 分钟缓存，也不必自己清缓存。
 *
 * 背景：GitHub Pages 给 HTML 与 /data/*.json 都发 `Cache-Control: max-age=600`，
 * 且不支持自定义响应头（无 _headers 支持）。发布后最多 10 分钟内，浏览器会直接
 * 用本地缓存，**连 revalidate 都不做**，表现为「已经发布/取消公开了，网页还是旧的」。
 *
 * 这里用两层强刷：
 *   1. `location.reload()`：主文档重新校验，拿到新 HTML 与新 JS（内含新 RELEASE_TAG）。
 *   2. `?fresh=<时间戳>`：新 JS 里的 dataFetch 会把这个参数拼到 /data/*.json 上，
 *      换来一个 CDN 从未见过的 URL，彻底绕开旧缓存。
 *
 * 配合下面 reload-on-focus 的自动逻辑，通常访客什么都不用点就已经是最新的了。
 */
function ReopenButton() {
  const [busy, setBusy] = useState(false)
  const t = useT()
  const onClick = () => {
    if (busy) return
    setBusy(true)
    // 拼上一次性参数，让新页面里的数据请求全部绕开 CDN / 浏览器缓存
    const url = new URL(window.location.href)
    url.searchParams.set('fresh', String(Date.now()))
    window.location.replace(url.toString())
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={busy ? t.fetching : t.checkUpdate}
      title={t.checkUpdateTip}
      onClick={onClick}
      disabled={busy}
    >
      <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden />
    </Button>
  )
}

function Header() {
  const view = useBlog((s) => s.view)
  const goHome = useBlog((s) => s.goHome)
  const search = useBlog((s) => s.search)
  const setSearch = useBlog((s) => s.setSearch)
  const t = useT()
  const { data: site } = useQuery({
    queryKey: ['site'],
    queryFn: fetchSiteInfo,
    staleTime: Infinity,
  })
  const siteName = site?.name ?? t.siteFallback

  // 全库搜索：输入即生效，非首页时自动跳回首页看结果
  const onSearchChange = (v: string) => {
    setSearch(v)
    if (v.trim() && view !== 'home') goHome()
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[68rem] items-center gap-3 px-4 sm:px-6" data-region="header">
        <button
          type="button"
          onClick={() => goHome()}
          className="flex shrink-0 items-center gap-2 font-serif text-lg font-bold tracking-tight"
          aria-label={t.backHome}
        >
          {siteName}
        </button>
        <div className="relative min-w-0 flex-1 sm:max-w-[22rem]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-9 pl-9 pr-8"
            aria-label={t.search}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 size-6 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t.clearSearch}
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <ReopenButton />
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
function Views() {
  const view = useBlog((s) => s.view)
  const slug = useBlog((s) => s.slug)
  useEffect(() => {
    // 浏览器前进/后退时让浏览器自己恢复滚动位置，不强制回顶
    if (isPopstateNavigation) return
    window.scrollTo({ top: 0 })
  }, [view, slug])
  return (
    <main className="mx-auto w-full max-w-[68rem] flex-1 px-4 py-8 sm:px-6" data-region="main">
      {view === 'home' && <HomeView />}
      {view === 'note' && slug && <NoteView slug={slug} />}
        </main>
  )
}

function FooterLine() {
  const { data: site } = useQuery({
    queryKey: ['site'],
    queryFn: fetchSiteInfo,
    staleTime: Infinity,
  })
  return (
    <span>
      {site?.name ?? <T k="siteFallback" />} · <T k="vaultDriven" />
    </span>
  )
}

/** 当前视图对应的 URL 查询串 */
function queryOf(view: string, slug: string | null, activeTag: string | null, folder: string): string {
  const params = new URLSearchParams()
  if (view === 'note' && slug) params.set('note', slug)
  else if (activeTag) params.set('tag', activeTag)
  // 文件夹用 ?folder= 深链，刷新/分享/前进后退都能回到同一层。
  // 笔记页也带上：从「比赛/NF」打开一篇再点返回，要回到 NF 而不是根目录。
  if (folder) params.set('folder', folder)
  return params.toString()
}

export function BlogApp() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            // 默认的 networkMode: 'online' 会在浏览器判定离线时把查询**挂起**：
            // 请求不发、也不报错，isError 永远是 false、data 永远空，界面就卡在
            // 「加载中」或（改版前）误报「笔记不存在」。改成 always：照常发请求，
            // 失败了就是 error，组件能给出「加载失败 + 重试」。
            networkMode: 'always',
          },
        },
      })
  )
  const view = useBlog((s) => s.view)
  const slug = useBlog((s) => s.slug)
  const activeTag = useBlog((s) => s.activeTag)
  const folder = useBlog((s) => s.folder)
  // 有几处文案只能靠 CSS ::before 渲染（如笔记嵌入卡片的角标），CSS 读不到 JS 状态，
  // 所以把当前语言写到 <html data-lang>，让 globals.css 能按语言换 content。
  const lang = useLang((s) => s.lang)
  useEffect(() => {
    document.documentElement.dataset.lang = lang
  }, [lang])
  // 首帧对齐用：初始视图已从 URL 恢复，第一轮同步只 replaceState 不新增历史
  const firstSyncRef = useState(() => ({ v: true }))[0]

  // 浏览器前进/后退：按 URL 恢复视图
  useEffect(() => {
    const onPop = () => {
      isPopstateNavigation = true
      const params = new URLSearchParams(window.location.search)
      const note = params.get('note')
      const tag = params.get('tag')
      const dir = params.get('folder') || ''
      const s = useBlog.getState()
      if (note) {
        // 先对齐来源文件夹，再进笔记：返回时才能回到正确的层级
        if (dir !== s.folder) s.openFolder(dir)
        s.navigateToNote(note)
      } else if (tag) s.goHome(tag)
      else s.openFolder(dir)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // 视图变化 → 写入历史记录（前进/后退可用）；popstate 引起的变更不重复入栈
  useEffect(() => {
    const qs = queryOf(view, slug, activeTag, folder)
    if (isPopstateNavigation) {
      isPopstateNavigation = false
      return
    }
    if (firstSyncRef.v) {
      firstSyncRef.v = false
      window.history.replaceState(null, '', qs ? '?' + qs : window.location.pathname)
      return
    }
    window.history.pushState(null, '', qs ? '?' + qs : window.location.pathname)
  }, [view, slug, activeTag, folder, firstSyncRef])

  return (
    <QueryClientProvider client={client}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <Views />
        <footer className="mt-auto border-t bg-muted/30">
          <div className="mx-auto flex max-w-[68rem] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6" data-region="footer">
            <FooterLine />
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  )
}
