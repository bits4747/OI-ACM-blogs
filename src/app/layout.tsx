import type { Metadata } from 'next'
import 'katex/dist/katex.min.css'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { SITE_NAME } from '@/lib/site'

// 站名 = 发布管理器里给这个库起的「名字」，原样显示，不自动补「的博客」——
// 用户起名「aaa的博客」就显示「aaa的博客」，起名「aaa」就显示「aaa」。
// 名字来源见 src/lib/site.ts（仓库里的 site-name.txt 优先，由管理器在发布时写入）。

export const metadata: Metadata = {
  title: SITE_NAME,
  description: `${SITE_NAME}：由 Obsidian 笔记生成的静态博客，公开笔记自动发布。`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
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
