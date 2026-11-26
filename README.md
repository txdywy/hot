# HOT 主场相框

把主队的颜色、你的名字和号码印在照片上。一个免费的中文照片相框工具，面向爱体育、爱潮流的年轻人。

- 5 组 28 个主题：NBA、NCAA 篮球、名校、NCAA 橄榄球、欧洲足球。队名、校名、昵称和口号都用真实英文原文（如 Michigan Wolverines、GO BLUE），中文只做小字说明。暂不放官方 logo 图片。
- 3 种款式，任何主题都能套：球衣（背后印名字和号码）、球票（撕票线和存根）、徽章（潮牌贴纸和刺绣字母）。
- 可以写名字、号码、口号；「加日期」印上照片的拍摄日期，没有拍摄日期就印今天。
- 所有照片处理都在浏览器内完成，不上传。

现在是设计稿 v0，设计思路见 [DESIGN.md](DESIGN.md)。结构参考同作者的 [拾光相框](https://github.com/txdywy/img)。

## 本地运行

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory docs
```

然后打开 http://127.0.0.1:4173/ 。

## 文件

- `docs/index.html`：页面
- `docs/assets/teams.js`：主题分组，每队英文名、昵称、配色、默认号码和口号
- `docs/assets/render.js`：三种款式的 Canvas 画法
- `docs/assets/app.js`：页面交互
- `docs/assets/photo-date.js`：读照片的拍摄日期（来自拾光相框）
- `tools/check-assets.mjs`：检查脚本版本号和语法
