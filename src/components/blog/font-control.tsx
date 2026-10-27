'use client'

/**
 * 阅读字号控件（全站）。
 *
 * 之前它只长在文章页右下角，而且只缩放正文（--note-fs），所以首页/顶栏/大纲
 * 都不动 —— 用户反馈「字体调节时不止博客正文要调节，所有字体都要」。
 *
 * 现在：
 *   1. 控件挂在应用根节点，首页和文章页都能调；
 *   2. 缩放作用在 <html> 的 --site-fs 上，只改字号变量（见 lib/font-scale.ts
 *      与 globals.css 里的说明），版面宽度、控件尺寸都不跟着变。
 *
 * ⚠️ 控件自己的字号必须写死 px，不能用 text-xs / text-sm：
 * 那些类读的是 --text-* 变量，会随 --site-fs 一起变，结果就是「拖着滑块，
 * 滑块自己也在长大」，用户明确要求「调大小的那部分大小不能改」。
 */
import { useEffect, useState } from 'react'
import { FONT_MAX, FONT_MIN, FONT_STEP, applyScale, readScale, saveScale } from '@/lib/font-scale'
import { useT } from '@/lib/i18n'

/** 控件内部固定尺寸：不参与 --site-fs 缩放 */
const FIXED = { fontSize: 12, lineHeight: '20px' } as const

export function FontControl() {
  const t = useT()
  // 初始化器里直接读 localStorage：避免 effect 恢复与持久化互相覆盖
  const [scale, setScale] = useState<number>(() => readScale())

  // 首帧对齐：layout.tsx 的 FONT_BOOT 已经设过一次，这里再同步一次，
  // 覆盖「浏览器 bfcache 恢复 / 多标签页改了设置」这类情况。
  useEffect(() => {
    applyScale(scale)
  }, [scale])

  const commit = (v: number) => {
    const next = Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(v * 100) / 100))
    setScale(saveScale(next))
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-border bg-background/95 py-1.5 pl-2.5 pr-3 shadow-lg backdrop-blur"
      data-region="font-control"
    >
      <button
        type="button"
        className="cursor-pointer rounded-full px-1.5 font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        style={{ ...FIXED, fontSize: 11 }}
        onClick={() => commit(scale - FONT_STEP)}
        aria-label={t.fontSmaller}
      >
        A−
      </button>
      <input
        type="range"
        min={FONT_MIN}
        max={FONT_MAX}
        step={0.01}
        value={scale}
        onChange={(e) => commit(Number(e.target.value))}
        className="w-28 accent-[var(--primary)]"
        style={FIXED}
        aria-label={t.fontReset}
      />
      <span
        className="min-w-11 text-center tabular-nums text-muted-foreground"
        style={FIXED}
      >
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        className="cursor-pointer rounded-full px-1.5 font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        style={{ ...FIXED, fontSize: 13 }}
        onClick={() => commit(scale + FONT_STEP)}
        aria-label={t.fontLarger}
      >
        A+
      </button>
    </div>
  )
}
