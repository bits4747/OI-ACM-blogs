'use client'

import { DICT } from '@/lib/i18n'

type Key = keyof typeof DICT.zh

function render(v: unknown, args?: unknown[]): string {
  if (typeof v === 'function') return String((v as (...a: unknown[]) => unknown)(...(args ?? [])))
  return String(v ?? '')
}

/**
 * 双语并列渲染：同时输出中英两份文案，由 CSS 按 <html data-lang> 只显示一份。
 *
 * 为什么不用 useT()：静态导出的 HTML 是构建时烧死的，用 useT() 时首屏只能是
 * 默认语言，水合后才翻成用户选的语言 —— 非默认语言用户会看到整页"闪一下"。
 * 两份都渲染进 HTML，再由预绘制脚本在首帧前设好 data-lang，就不会有任何闪烁。
 *
 * 只用于**可见文字**；aria-label / title / placeholder 这类属性仍用 useT()。
 */
export function T({ k, args }: { k: Key; args?: unknown[] }) {
  return (
    <>
      <span className="i18n-zh">{render(DICT.zh[k], args)}</span>
      <span className="i18n-en">{render(DICT.en[k], args)}</span>
    </>
  )
}
