import type { Metadata } from 'next'
import 'katex/dist/katex.min.css'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { SITE_NAME, withBase } from '@/lib/site'
import { THEME_EXISTS, THEME_VERSION } from '@/lib/theme.generated'
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

/**
 * 预绘制脚本：首帧前把已保存的阅读字号（--site-fs）写到 <html>。
 *
 * 和 LANG_BOOT 同理 —— 字号存在 localStorage，等 React 水合再应用的话，
 * 用户每次打开都会先看到默认字号再「跳」一下。这里在 <head> 里同步设好，
 * 第一帧就是用户上次选的倍率。读取失败一律回落到 1（默认）。
 */
const FONT_BOOT = `(function(){try{var v=Number(localStorage.getItem('font-scale'));if(!(v>=0.8&&v<=1.6))v=1;document.documentElement.style.setProperty('--site-fs',String(Math.round(v*100)/100));}catch(e){}})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={DEFAULT_LANG === 'en' ? 'en' : 'zh-CN'} data-lang={DEFAULT_LANG} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: FONT_BOOT }} />
        {/*
          库主人自己粘贴的外观 CSS（发布管理器「外观」面板里保存）。
          文件是 public/theme.css，随仓库提交，由 Next 的 output:'export' 拷进 out/。

          为什么是外链 <link> 而不是把内容内联进 <style>：
            外链的 CSS 由浏览器按 CSS 解析，永远不会被当成 HTML 执行，
            所以用户写什么都无法逃出样式表（内联的话一个 </style> 就能跳出）。
          为什么带 ?v=：文件名不变，而 GitHub Pages 对静态资源有 max-age=600，
            不换 URL 的话改完 CSS 要等十分钟才生效，用户会以为没保存上。

          THEME_EXISTS 由 scripts/build-content.mjs 在构建时算出：
          没有 theme.css（或内容全是空白/注释）时不输出这个 <link>，避免每次访问留一个 404。
        */}
        {THEME_EXISTS && (
          <link
            rel="stylesheet"
            href={withBase('/theme.css') + (THEME_VERSION ? '?v=' + THEME_VERSION : '')}
          />
        )}
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
