# Football Club Portal — 路线图

## 第一阶段：MVP (v0.1) 🎯

一个漂亮的球队身份名片 + 共享相册，让成员有参与感。

- [ ] 项目脚手架（Next.js + Supabase + Tailwind CSS + next-intl）
- [ ] Supabase 数据库 Schema & Migration（profiles, clubs, memberships, invitations, albums, photos）
- [ ] Row Level Security 策略
- [ ] Storage Bucket（头像、队徽、照片）
- [ ] Supabase 客户端工具 & TypeScript 类型
- [ ] i18n 配置（英语/中文/西班牙语）+ 浏览器语言自动检测
- [ ] 全局 Layout & UI 基础组件（导航栏、底部栏、按钮）
- [ ] 用户注册 & 登录（Supabase Auth）
- [ ] 用户资料页面（头像上传、显示名称、简介、我的球队）
- [ ] 创建球队流程（创建球队 + 成为管理员）
- [ ] 球队公开页面（主页、成员列表）+ SEO 结构化数据
- [ ] 邀请链接系统（管理员生成链接，球员通过 /join/[code] 加入）
- [ ] 申请加入（球员申请，管理员审批/拒绝）
- [ ] 球队管理后台（球队信息编辑、成员管理、相册管理）
- [ ] 成员个人设置（球衣号码、位置）
- [ ] 相册列表 & 相册详情（照片网格 + Lightbox 预览）
- [ ] 照片上传（成员上传到相册，存储到 Supabase Storage）
- [ ] 落地页（Hero + 特性展示 + CTA）
- [ ] SEO（JSON-LD、Open Graph、Sitemap、robots.txt）
- [ ] 部署到 Vercel

## 第二阶段：打磨 & 增长 (v0.2)

提升用户体验，驱动自然增长。

- [ ] 响应式设计审查（移动端优先优化）
- [ ] 图片优化（Next.js Image 组件、懒加载、缩略图）
- [ ] 球队搜索/目录页（浏览所有球队）
- [ ] 视频嵌入支持（YouTube、Bilibili）
- [ ] 外部照片链接支持（Google Photos、Flickr、Imgur）
- [ ] 分析集成（Vercel Analytics 或 Plausible）
- [ ] 加载状态、错误处理、空状态

## 第三阶段：提升参与度 (v0.3)

让用户持续回来使用的功能。

- [ ] 比赛记录（日期、对手、比分）
- [ ] 球员出场统计
- [ ] 赛季/锦标赛分组
- [ ] 球队公告/新闻
- [ ] 照片评论/点赞
- [ ] 通知系统（邮件或站内通知）

## 第四阶段：平台化 & 商业化 (v1.0)

发展为可持续的平台。

- [ ] 球队自定义域名支持
- [ ] 付费版本（更多存储、去除品牌标识、自定义主题）
- [ ] 微信小程序（共享 API，独立前端）
- [ ] PWA 支持（可安装到手机桌面）
- [ ] 公开 API（第三方集成）

## 未来设想（Backlog）

- 球队内聊天/群组消息
- 训练日程安排
- 球迷/支持者页面
- 跨球队友谊赛匹配
- AI 比赛精彩集锦剪辑
- 更多语言（葡萄牙语、阿拉伯语、法语等）
