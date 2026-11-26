# 给在这个仓库里干活的人和 Claude

## 自动检查（GitHub Actions）的经验

2026-11-26 做 v3 时，PR #4 连着红了 6 次，代码本身没问题，是下面两件事。以后照这些做。

### 报错时先这样查

1. **先逐条读 annotations**，别只看红叉。用
   `gh api repos/txdywy/hot/check-runs/<id>/annotations` 或 Actions 页面右侧的列表。
2. **只看第一条失败。** 后面的步骤都带 `if: always()`，前一步一挂，后面常常跟着报
   「Cannot find package 'playwright'」之类，那是连带，不是新问题。
3. **CI 测的是 PR 合进 main 之后的样子**，不只是分支本身。main 上有新提交时，先
   `git merge origin/main` 到分支，再本地跑检查。

### 这次踩的两个坑

- **测试写死了数据格式。** `tools/edges.mjs` 的队徽测试原来按 `export const logos = {};`
  这一整句去替换成测试图；队徽表一填上内容，替换就悄悄失效，测试找不到绿色测试图而报
  「logo is missing」。现在用正则替换整个表。写测试时，替换或匹配真实文件内容要能适应
  内容变化，替换失败要能看出来。
- **版本号没全站统一。** 所有 `./assets/...?v=N` 必须是同一个 N（`tools/check-assets.mjs`
  会查）。改版本号时全站一起改；main 上别人新加的文件（比如 `analytics.js`）合进来后也要跟着改。

### 推送前在本地跑

```
node tools/check-assets.mjs
node tools/old-syntax.mjs
```

浏览器测试（smoke、layout、edges）要下载 Playwright 浏览器，云端会话里常常下载不了，
交给 CI 跑。

### 工作流里保留的做法

- **iPhone 内核（WebKit）用 Playwright 官方镜像** `mcr.microsoft.com/playwright:v1.49.1-noble`，
  不用每次现装系统依赖，比 txdywy/img 的现装方式更稳。
- **同一个 PR 新推送会取消旧的那次检查**（`concurrency`），不会留下一串过时的红叉。
- **Playwright 装失败时，浏览器测试直接跳过**（`steps.install.outcome == 'success'`），
  一个问题只报一次。
- Playwright 版本固定在 1.49.1，两个 job 和镜像要一起改。

## 预览

- PR 的预览看 Cloudflare 的分支预览：`https://<分支名>.hot-9l0.pages.dev`。
- raw.githack 预览不了队徽：它把图片跳转到 raw.githubusercontent.com，被页面的 CSP 拦掉。
