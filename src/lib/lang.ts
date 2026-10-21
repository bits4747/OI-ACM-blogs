/**
 * 语言常量（不依赖 React，服务端/客户端都能安全 import）。
 *
 * 站点默认语言在**构建期**决定：静态导出的 HTML 只能是某一种语言。
 * 可用环境变量 NEXT_PUBLIC_DEFAULT_LANG=en 改。
 */
export type Lang = 'zh' | 'en'

export const DEFAULT_LANG: Lang =
  (process.env.NEXT_PUBLIC_DEFAULT_LANG || '').toLowerCase() === 'en' ? 'en' : 'zh'

export const LANG_STORAGE_KEY = 'obsidian-blog-lang'
