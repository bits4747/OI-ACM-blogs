import { SKIP, visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

/**
 * 原始 HTML 安全过滤（配合 rehype-raw 使用，插在 rehype-raw 之后）
 * - 移除 script / iframe / object / embed / form 等危险元素
 * - 移除所有 on* 事件属性
 * - 将 javascript: / vbscript: 等危险协议的 URL 属性改写为 '#'
 * 注意：刻意不用 rehype-sanitize——其默认白名单会剥掉本渲染管线依赖的
 * className / data-* / 数学公式节点，导致 Callout、代码高亮、公式全部失效。
 * 内容只有博客管理员（库主人）可写，此处仅做兜底防线。
 */

const REMOVE_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'button',
  'select',
  'textarea',
  'link',
  'meta',
  'base',
  'frameset',
  'frame',
  'applet',
])

const URL_ATTRS = new Set(['href', 'src', 'poster', 'background'])

function isDangerousUrl(value: string): boolean {
  const v = value.trim().toLowerCase()
  // 无协议前缀（相对路径 / 锚点 / 文件名）→ 安全
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) return false
  // 有协议：白名单放行，其余一律视为危险（javascript:、vbscript:、file:、data:text/ 等）
  if (v.startsWith('http://') || v.startsWith('https://')) return false
  if (v.startsWith('mailto:') || v.startsWith('tel:')) return false
  if (v.startsWith('data:image/')) return false
  // 本渲染管线的内部链接方案：obsidian-note: / obsidian-tag: / obsidian-unresolved:
  if (v.startsWith('obsidian-')) return false
  return true
}

export function rehypeSafety() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (typeof index !== 'number' || !parent) return

      // 危险标签：整棵子树移除（script 的内容也不保留）
      // input 特殊处理：GFM 任务列表的 checkbox 是合法的，其他 input 移除
      const isTaskCheckbox =
        node.tagName === 'input' && String(node.properties?.type ?? '') === 'checkbox'
      if (REMOVE_TAGS.has(node.tagName) || (node.tagName === 'input' && !isTaskCheckbox)) {
        parent.children.splice(index, 1)
        return [SKIP, index] as never
      }

      const props = node.properties ?? {}
      let dirty = false
      for (const key of Object.keys(props)) {
        if (/^on/i.test(key)) {
          delete props[key]
          dirty = true
          continue
        }
        if (URL_ATTRS.has(key)) {
          const value = props[key]
          if (typeof value === 'string' && isDangerousUrl(value)) {
            props[key] = '#'
            dirty = true
          }
        }
      }
      if (dirty) node.properties = props
      return undefined
    })
  }
}
