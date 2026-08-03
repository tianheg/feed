# Feed

个人 RSS 聚合站（[feed-tianheg.pages.dev](https://feed-tianheg.pages.dev)），基于 [osmosfeed](https://github.com/osmoscraft/osmosfeed) 的 fork [@tianheg/osmosfeed](https://www.npmjs.com/package/@tianheg/osmosfeed) 构建。

## 构建

```bash
npm install
npm run build   # 生成 public/，抓取 osmosfeed.yaml 里的 111 个订阅源
```

## 部署

- Cloudflare Pages（项目 `feed-tianheg`），构建命令 `npm run build`，输出目录 `public`
- 本仓库通过 Forgejo push mirror 自动同步到 GitHub，GitHub push 触发 CF 自动构建
- 定时更新由 CF Cron Trigger + Deploy Hook 完成

## 配置

订阅源在 `osmosfeed.yaml`，支持：

- `concurrency`：并发抓取数（默认 8）
- `timeoutMs`：单次下载超时（默认 10000）
- `userAgent`：自定义 UA
- `cachePriority`：`local`（本机构建用本地 cache）或 `remote`（CI 用线上 cache）
- `group`：源分组标签（前端按组筛选）
