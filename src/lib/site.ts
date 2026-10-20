/** 静态站点常量：GitHub Pages 项目站部署时，构建前设置 NEXT_PUBLIC_BASE_PATH=/<仓库名> */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

// 站名（网页左上角标题 / <title>）：优先级从高到低
//   1. site-name.txt —— 发布管理器在发布时写入仓库并随提交推上来（改名+发布即生效，
//      不依赖 GitHub 的 Actions 变量接口，换机器/换网络都一样）
//   2. NEXT_PUBLIC_SITE_NAME —— 兼容旧的 Actions 变量方式
//   3. 「笔记」—— 中性兜底，绝不回退到某个具体人名
//
// site-name.generated.ts 由 scripts/build-content.mjs 在构建时生成，内容是 site-name.txt 的值。
import { SITE_NAME as GENERATED_SITE_NAME } from './site-name.generated'

export const SITE_NAME: string = (
  GENERATED_SITE_NAME ||
  (process.env.NEXT_PUBLIC_SITE_NAME || '').trim() ||
  '笔记'
).trim()

/** 拼接站点内路径（自动带 basePath） */
export function withBase(p: string): string {
  return BASE_PATH + p
}
