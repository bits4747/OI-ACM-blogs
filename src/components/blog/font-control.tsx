'use client'

/**
 * 阅读字号控件（全站）。
 *
 * 之前它只长在文章页右下角，而且只缩放正文（--note-fs），所以首页/顶栏/大纲
 * 都不动 —— 用户反馈「字体调节时不止博客正文要调节，所有字体都要」。
 *
 * 现在：
 *   1. 控件挂在应用根节点，首页和文章页都能调；
 *   2. 缩放作用在 <html> 的 --site-fs 上，全站所有 rem 一起变（见 lib/font-scale.ts）。
 *
 * 控件本身也跟随缩放，这样放大后按钮更好点，和「整体放大」的预期一致。
 */
import { useEffect, useState } from 'react'
import { FONT_MAX, FONT_MIN, FONT_STEP, applyScale, readScale, saveScale } from '@/lib/font-scale'
import { useT } from '@/lib/i18n'

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
        className="rounded-full px-1.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
        aria-label={t.fontReset}
      />
      <span className="min-w-11 text-center text-xs tabular-nums text-muted-foreground">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        className="rounded-full px-1.5 py-0.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => commit(scale + FONT_STEP)}
        aria-label={t.fontLarger}
      >
        A+
      </button>
    </div>
  )
}
