import type { Metadata } from 'next'
import 'katex/dist/katex.min.css'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { SITE_NAME } from '@/lib/site'
import { DEFAULT_LANG, LANG_STORAGE_KEY } from '@/lib/lang'

// 站名 = 发布管理器里给这个库起的「名字」，原样显示，不自动补「的博客」——
// 用户起名「aaa的博客」就显示「aaa的博客」，起名「aaa」就显示「aaa」。
// 名字来源见 src/lib/site.ts（仓库里的 site-name.txt 优先，由管理器在发布时写入）。

export const metadata: Metadata = {
  title: SITE_NAME,
  description: `${SITE_NAME}：由 Obsidian 笔记生成的静态博客，公开笔记自动发布。`,
}

/**
 * 预绘制脚本：在首帧之前把 <html data-lang> / lang 设好。
 *
 * 界面文案是「中英两份都渲染、CSS 按 data-lang 只显示一份」（见 components/blog/t-text.tsx）。
 * 只要 data-lang 在第一帧前是对的，用户就永远不会看到文字闪一下换语言。
 * 必须在 <head> 里同步执行，不能等 React 水合。
 */
const LANG_BOOT = `(function(){try{var d=${JSON.stringify(DEFAULT_LANG)};var l=d;var s=localStorage.getItem(${JSON.stringify(LANG_STORAGE_KEY)});if(s){var p=JSON.parse(s);if(p&&p.state&&p.state.picked&&(p.state.lang==='zh'||p.state.lang==='en'))l=p.state.lang;}var h=document.documentElement;h.dataset.lang=l;h.lang=(l==='en'?'en':'zh-CN');}catch(e){try{document.documentElement.dataset.lang=${JSON.stringify(DEFAULT_LANG)};}catch(_){}}})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={DEFAULT_LANG === 'en' ? 'en' : 'zh-CN'} data-lang={DEFAULT_LANG} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT }} />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
