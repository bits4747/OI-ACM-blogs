'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LANG, LANG_STORAGE_KEY, type Lang } from './lang'

export type { Lang }
export { DEFAULT_LANG }

/**
 * 界面语言。**只翻译界面文案，不碰博客内容**——笔记标题、正文、文件夹名一律原样显示。
 *
 * 默认语言构建期固定（见 lib/lang.ts），用户手动切换后写进 localStorage。
 */

export const DICT = {
  zh: {
    // 顶栏
    toggleTheme: '切换明暗主题',
    backHome: '返回博客首页',
    searchPlaceholder: '全库搜索：标题、正文、路径、标签…',
    search: '全库搜索',
    clearSearch: '清空搜索',
    checkUpdate: '检查更新',
    checkUpdateTip: '检查更新（强制获取最新内容）',
    fetching: '正在获取最新内容…',
    switchLang: '切换语言',
    langZh: '中文',
    langEn: 'English',
    // 首页
    allNotes: '全部笔记',
    publicCount: (n: number) => `共 ${n} 篇公开`,
    filteredCount: (n: number) => ` · 筛选出 ${n} 篇`,
    expandAll: '全部展开',
    collapseAll: '全部收起',
    tagFilter: '标签筛选：',
    noteCountSuffix: (n: number) => `（${n} 篇）`,
    clearFilter: '清除筛选',
    all: '全部',
    loadFailed: '笔记加载失败，请刷新重试',
    emptyVault: '还没有发布任何笔记',
    noMatch: '没有匹配的笔记',
    emptyVaultHint: '在发布管理器里把笔记标为公开即可',
    emptyHint: '试试更换关键词或清除标签过滤',
    folderCount: (n: number) => `${n} 篇`,
    uncategorized: '未分类',
    siteFallback: '笔记',
    openNote: (t: string) => `打开笔记 ${t}`,
    // 笔记页
    notCreated: '未创建',
    notUploaded: '未上传',
    /** 纯块引用 [[#^xxx]] 找不到原文时的兜底链接文字 */
    blockRef: '块引用',
    notPublic: '此笔记未公开',
    notPublicBody: '这篇笔记没有被标记为公开，因此不会出现在静态站上。',
    goHome: '返回首页',
    notFound: '笔记不存在或已被删除',
    back: '返回',
    words: (n: number) => `${n} 字`,
    backlinks: '链接到本文的笔记',
    outlinks: '本文的出链',
    frontmatter: 'Frontmatter 元数据',
    fontSmaller: '缩小字体',
    fontReset: '调节字体大小',
    fontLarger: '放大字体',
    tocExpand: '展开大纲',
    tocCollapse: '收起大纲',
    toc: '大纲',
    // 预览浮层
    loading: '加载中…',
    privateByAuthor: '作者将这篇笔记设为了私密。',
    noteMissing: '笔记不存在',
    noteMissingBody: '目标笔记不存在或已被删除。',
    blockNotFound: '未找到对应文本块，显示全文：',
    openNoteArrow: '打开笔记 ↗',
    openNoteNewTab: '在新标签页打开这篇笔记',
    // 页脚
    vaultDriven: 'Obsidian Vault 驱动',
    // 其他
    indexFailed: '加载笔记索引失败',
    // 正文渲染
    copy: '复制',
    copied: '已复制',
    copyCode: '复制代码',
    attachmentPreview: '附件预览',
    unresolvedTip: '该笔记尚未创建，点击搜索相关笔记',
    // 引用/嵌入
    sectionMissing: '未找到被引用的小节，显示全文：',
    embedCycle: '循环引用',
    embedTooDeep: '嵌套过深，未展开',
    // 笔记页错误态
    noteLoadFailed: '笔记加载失败，请检查网络后重试',
    retry: '重试',
    close: '关闭',
    tocDrag: '按住拖动大纲',
    // Obsidian callout 的默认标题（笔记里写 > [!note] 却没给标题时用）
    calloutLabel: {
      note: '笔记',
      abstract: '摘要',
      info: '信息',
      todo: '待办',
      tip: '提示',
      success: '成功',
      question: '疑问',
      warning: '警告',
      failure: '失败',
      danger: '危险',
      bug: '缺陷',
      example: '示例',
      quote: '引用',
    },
  },
  en: {
    toggleTheme: 'Toggle theme',
    backHome: 'Back to home',
    searchPlaceholder: 'Search titles, content, paths, tags…',
    search: 'Search',
    clearSearch: 'Clear search',
    checkUpdate: 'Check for updates',
    checkUpdateTip: 'Check for updates (force refresh)',
    fetching: 'Fetching latest…',
    switchLang: 'Language',
    langZh: '中文',
    langEn: 'English',
    allNotes: 'All notes',
    publicCount: (n: number) => `${n} public`,
    filteredCount: (n: number) => ` · ${n} matched`,
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    tagFilter: 'Tag:',
    noteCountSuffix: (n: number) => ` (${n})`,
    clearFilter: 'Clear',
    all: 'All',
    loadFailed: 'Failed to load notes. Please refresh.',
    emptyVault: 'No notes published yet',
    noMatch: 'No matching notes',
    emptyVaultHint: 'Mark notes as public in the publish manager',
    emptyHint: 'Try different keywords or clear the tag filter',
    folderCount: (n: number) => (n === 1 ? '1 note' : `${n} notes`),
    uncategorized: 'Uncategorized',
    siteFallback: 'Notes',
    openNote: (t: string) => `Open note ${t}`,
    notCreated: 'Not created',
    notUploaded: 'Not uploaded',
    blockRef: 'Block reference',
    notPublic: 'This note is private',
    notPublicBody: 'This note is not marked public, so it is not published to the static site.',
    goHome: 'Back to home',
    notFound: 'Note not found or deleted',
    back: 'Back',
    words: (n: number) => `${n} words`,
    backlinks: 'Linked from',
    outlinks: 'Links to',
    frontmatter: 'Frontmatter',
    fontSmaller: 'Decrease font size',
    fontReset: 'Reset font size',
    fontLarger: 'Increase font size',
    tocExpand: 'Expand outline',
    tocCollapse: 'Collapse outline',
    toc: 'Outline',
    loading: 'Loading…',
    privateByAuthor: 'The author set this note to private.',
    noteMissing: 'Note not found',
    noteMissingBody: 'The linked note does not exist or has been deleted.',
    blockNotFound: 'Block not found — showing the full note:',
    openNoteArrow: 'Open note ↗',
    openNoteNewTab: 'Open this note in a new tab',
    vaultDriven: 'Powered by Obsidian Vault',
    indexFailed: 'Failed to load the note index',
    copy: 'Copy',
    copied: 'Copied',
    copyCode: 'Copy code',
    attachmentPreview: 'Attachment preview',
    unresolvedTip: 'This note has not been created yet — click to search related notes',
    sectionMissing: 'Referenced section not found — showing the full note:',
    embedCycle: 'Circular embed',
    embedTooDeep: 'Nested too deeply, not expanded',
    noteLoadFailed: 'Failed to load the note. Check your connection and retry.',
    retry: 'Retry',
    close: 'Close',
    tocDrag: 'Press and drag to move the outline',
    calloutLabel: {
      note: 'Note',
      abstract: 'Abstract',
      info: 'Info',
      todo: 'Todo',
      tip: 'Tip',
      success: 'Success',
      question: 'Question',
      warning: 'Warning',
      failure: 'Failure',
      danger: 'Danger',
      bug: 'Bug',
      example: 'Example',
      quote: 'Quote',
    },
  },
} as const

export type Dict = (typeof DICT)['zh']

/**
 * 默认语言固定（构建期决定，见 lib/lang.ts），不按浏览器语言自动猜。
 *
 * 原因：静态导出的 HTML 是构建时就烧死的。若首屏按 zh 渲染、水合后再翻成 en，
 * 非中文用户会看到整页文字「闪一下」换语言。现在改成：默认语言固定，用户手动
 * 切换后记在 localStorage，由 layout 的预绘制脚本在首帧前设好 <html data-lang>，
 * 界面文案从第一帧起就是对的（中英两份都在 HTML 里，CSS 只显示一份）。
 */

interface LangState {
  lang: Lang
  /** 用户是否手动选过。选过之后就不再跟随浏览器语言。 */
  picked: boolean
  setLang: (l: Lang) => void
  toggle: () => void
}

/** 把语言同步到 <html data-lang/lang>：CSS 靠 data-lang 选显示哪一份文案，
 *  lang 供屏幕阅读器与搜索引擎判断语言。首帧由 layout 的预绘制脚本设置，
 *  这里负责用户切换后（以及 persist 恢复后）保持一致。 */
function applyLangToDocument(lang: Lang) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.lang = lang
  root.lang = lang === 'en' ? 'en' : 'zh-CN'
}

export const useLang = create<LangState>()(
  persist(
    (set, get) => ({
      lang: DEFAULT_LANG,
      picked: false,
      setLang: (l) => {
        set({ lang: l, picked: true })
        applyLangToDocument(l)
      },
      toggle: () => {
        const next: Lang = get().lang === 'zh' ? 'en' : 'zh'
        set({ lang: next, picked: true })
        applyLangToDocument(next)
      },
    }),
    {
      name: LANG_STORAGE_KEY,
      partialize: (s) => ({ lang: s.picked ? s.lang : undefined, picked: s.picked }),
      // 没手动选过时不恢复，让 DEFAULT_LANG 生效
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LangState>
        return p.picked ? { ...current, ...p } : current
      },
    }
  )
)

// persist 从 localStorage 恢复时不经过 setLang，用订阅兜住这种情况。
useLang.subscribe((s, prev) => {
  if (s.lang !== prev.lang) applyLangToDocument(s.lang)
})
applyLangToDocument(useLang.getState().lang)

/** 取当前语言的文案表。在组件里用 `const t = useT()`。 */
export function useT(): Dict {
  const lang = useLang((s) => s.lang)
  return DICT[lang] as Dict
}

/** 非组件环境（如 api.ts 抛错文案）用这个拿当前语言 */
export function tNow(): Dict {
  return DICT[useLang.getState().lang] as Dict
}
