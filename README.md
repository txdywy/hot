# HOT 主场相框

把主队的颜色、你的名字和号码印在照片上。一个免费的中文照片相框工具，面向爱体育、爱潮流的年轻人。

- 6 组 30 个主题：NBA、NCAA 篮球、名校、NCAA 橄榄球、欧洲足球、中超（北京国安、2026 中超冠军大连英博）。队名、校名、昵称和口号都用真实原文（如 Michigan Wolverines、ANN ARBOR, MI、GO BLUE；中超队用中文口号），中文只做小字说明。
- 每队都有考据：建队年份、主场、冠军数、退役号码或传奇球员、助威口号、名场面，画进相框，也列在「主队档案」里。每队有自己的纹章图案（三叶草、金门大桥、千鸟格帽、埃菲尔铁塔、工体等）和球衣纹样（米兰红黑条、巴黎 Hechter 中线、拜仁菱格、北卡菱格袜纹等）。
- 手机上预览区铺满主队的主场地板或球场。
- 3 种款式并列，任何主题都能套：球衣（背后印名字和号码）、球票（撕票线和存根）、徽章（潮牌贴纸和刺绣字母）。
- 可以写名字、号码、口号；「加日期」印上照片的拍摄日期，没有拍摄日期就印今天。
- 照片比例：原图、3:4、1:1、9:16，裁剪后可以拖动照片调整位置。
- 所有照片处理都在浏览器内完成，不上传。

设计思路见 [DESIGN.md](DESIGN.md)。结构参考同作者的 [拾光相框](https://github.com/txdywy/img)。

## 发布（Cloudflare Pages）

纯静态网站，没有构建步骤。Cloudflare Pages 连上这个仓库，设置为：

- Framework preset：None
- Build command：留空
- Build output directory：`public`
- Production branch：`main`

推到 `main` 就自动上线；每个 PR 也会有一个预览地址。`public/_headers` 里是 Cloudflare 的缓存和安全头：页面和 `sw.js` 每次都检查新版本，`assets/` 下的文件带 `?v=` 版本号，可以缓存。

## 本地运行

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
```

然后打开 http://127.0.0.1:4173/ 。

## 文件

- `public/index.html`：页面
- `public/assets/teams.js`：主题分组，每队名字、昵称、配色、默认号码和口号，以及档案（est、home、titles、retired、chant、moments 等）和画法（motif、kit、trim、floor）；`logos` 列出各队的 logo 文件
- `public/assets/art.js`：各队纹章图案、球衣纹样、袖边和主场地板的画法
- `public/assets/render.js`：三种款式的 Canvas 画法
- `public/assets/app.js`：页面交互、保存流程、手机适配
- `public/assets/dialog.js`：弹窗和返回键（来自拾光相框）
- `public/assets/photo-date.js`：读照片的拍摄日期（来自拾光相框）
- `public/assets/old.js`：太旧的浏览器打不开时给出提示
- `public/assets/fonts/`：Anton 和 Graduate 字体（SIL Open Font License，见 `OFL.txt`）
- `public/assets/logos/`：各队 logo（见下）
- `public/sw.js`：离线缓存，第二次打开更快

改了 `public/assets/` 下的 js 或 css，要把所有 `?v=` 一起加 1，`node tools/check-assets.mjs` 会检查。

## 加 logo

把文件放进 `public/assets/logos/`（建议 SVG，或 512px 以内的透明 PNG），再在 `teams.js` 的 `logos` 里写上，比如：

```js
export const logos = {lakers: 'lakers.svg', michigan: 'michigan.svg'};
```

logo 会出现在选队卡片上，以及球衣（左下）、球票（存根顶部）、徽章（左上圆贴纸）三种款式里。换了某个 logo 文件，要把 `app.js` 里 `logoUrl` 的 `?v=1` 加 1。

## 测试

推送和 PR 会在 GitHub Actions 里自动跑（`.github/workflows/check.yml`）：

- `tools/check-assets.mjs`：版本号和语法
- `tools/old-syntax.mjs`：只用 iOS 12 和老安卓浏览器认识的语法
- `tools/smoke.mjs`：完整流程，安卓、鸿蒙、iPhone、iPhone 微信、安卓微信、小屏 iPhone、电脑各走一遍，包括各自的保存方式和返回键
- `tools/layout.mjs`：12 种屏幕尺寸，普通字号和大字号，检查不出界、按钮够大、文字不被截断
- `tools/edges.mjs`：选错文件、HEIC、拖动照片、iPhone 分享菜单卡住、看大图、拖入照片、logo

Chromium（安卓、鸿蒙、安卓微信的内核）和 WebKit（iPhone Safari、iPhone 微信的内核）各跑一遍，截图作为 artifact 保留 14 天。本地运行：

```sh
npm install --no-save --no-package-lock playwright@1.49.1 acorn@8.14.0
npx playwright install chromium
SHOT_DIR=screenshots node tools/smoke.mjs
```

`ENGINE=webkit` 换成 WebKit，`CHROME_PATH=...` 指定别的 Chromium。
