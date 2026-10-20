import type { NextConfig } from 'next'

// GitHub Pages 项目站部署时，构建前设置 NEXT_PUBLIC_BASE_PATH=/<仓库名>
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: false,
  // 关闭开发环境左下角的 Next.js 圆标（点击 Hide 后它会消失且无法找回，造成"卡死"错觉）
  devIndicators: false,
}

export default nextConfig
