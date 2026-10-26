/**
 * 阅读字号（全站生效）。
 *
 * 需求来源：用户要求「字体调节时不止博客正文要调节，所有字体都要」。
 * 之前的实现只在文章页给 <article> 挂 `--note-fs`，于是调字号只影响正文，
 * 顶栏、首页卡片、大纲浮层、页脚纹丝不动 —— 看起来像「只有正文能调」。
 *
 * 现在的做法：把倍率写到 <html> 的 `--site-fs` 上，globals.css 里
 * `html { font-size: calc(100% * var(--site-fs)) }` 让根字号跟着缩放，
 * 全站所有 rem 单位（Tailwind 的 text-sm / p-4 / gap-2 全是 rem）一起变大变小。
 *
 * 单独抽成模块的原因：设置控件在文章页，而生效点在整个文档，
 * 需要一个跨组件共享、且能在首帧前应用的地方。
 */
export const FONT_SCALE_KEY = 'font-scale'

export const FONT_MIN = 0.8
export const FONT_MAX = 1.6
export const FONT_STEP = 0.05

/** 把倍率夹到合法区间，非法输入回落到 1（默认） */
export function clampScale(v: number): number {
  if (!Number.isFinite(v)) return 1
  if (v < FONT_MIN || v > FONT_MAX) return 1
  return Math.round(v * 100) / 100
}

/** 读已保存的倍率；没有或坏掉就用 1 */
export function readScale(): number {
  if (typeof window === 'undefined') return 1
  try {
    return clampScale(Number(localStorage.getItem(FONT_SCALE_KEY)))
  } catch {
    return 1
  }
}

/** 写到 <html> 上。用 CSS 变量而不是直接改 font-size，方便主题覆盖与过渡 */
export function applyScale(v: number) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--site-fs', String(clampScale(v)))
}

/** 保存并立即生效 */
export function saveScale(v: number): number {
  const s = clampScale(v)
  try {
    localStorage.setItem(FONT_SCALE_KEY, String(s))
  } catch {
    /* 忽略：隐私模式下写不进去，本次会话内仍然生效 */
  }
  applyScale(s)
  return s
}
