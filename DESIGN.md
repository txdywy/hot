# HOT 主场相框 · 设计方案

产品中文名：HOT 主场相框（2026-11-26 定）。

和「拾光相框」同一套结构：纯静态网页放在 `public/`，照片只在浏览器里用 Canvas 处理，推到 GitHub 后由 Cloudflare Pages 自动发布。换的是主题和气质：拾光面向长辈，讲大字、稳、少操作；HOT 面向爱体育的年轻人和偏潮流的中青年，讲身份感、配色和能晒出去。

## 一句话定位

把主队的颜色、你的名字和号码印在照片上，晒出去别人一眼看出你挺谁。

## 主题怎么分

两层选择，比拾光的「一层分类 + 39 款」更适合球迷：

1. **先选主队**（5 组，28 个，全部用真实英文名，中文只做小字说明）
   - NBA：Los Angeles Lakers、Boston Celtics、Golden State Warriors、Chicago Bulls、Miami Heat、New York Knicks、Dallas Mavericks、San Antonio Spurs
   - NCAA 篮球：Duke Blue Devils、North Carolina Tar Heels、Kentucky Wildcats、Kansas Jayhawks
   - 名校：Stanford Cardinal、Harvard Crimson、Yale Bulldogs、Cal Golden Bears
   - NCAA 橄榄球：Michigan Wolverines、Ohio State Buckeyes、Alabama Crimson Tide、Texas Longhorns
   - 欧洲足球：AC Milan、Manchester United、Real Madrid、Paris Saint-Germain、FC Barcelona、FC Bayern München、Liverpool FC、Juventus
2. **再选款式**（3 种，任何一队都能套）
3. **印上你的字**：名字、号码、口号，外加拾光已有的「加日期」

28 队 × 3 款 = 84 种组合，代码里只维护一张配色表和三个画法，后面加队几乎零成本。

## 三个视觉方向

| 方向 | 像什么 | 最适合 | 个性化 |
| --- | --- | --- | --- |
| **A 球衣** | 照片是球衣正面，底部是背后的名字和大号码，两侧有滚边，顶上有 V 领 | NBA、大学篮球 | 名字 + 号码，最强 |
| **B 球票** | 一张入场券：左侧竖写城市，下面撕票线，存根上有 GATE / SEC / ROW / SEAT、持票人、日期和条形码 | 足球、橄榄球、看现场的照片 | 号码 = 座位号，日期天然在票上 |
| **C 徽章** | 潮牌贴纸风：顶部棋盘格、刺绣毛巾字母、圆形号码章、HELLO 名牌、爆炸星贴纸、口号贴纸 | 名校、潮流穿搭照 | 名字在名牌上，号码在徽章上 |

**（2026-11-26 定）三款并列**，每一队都能套任何一款。球衣主打「我的名字 + 我的号码」的身份感；球票接住拾光已有的「加日期」；徽章风给名校和爱穿搭的人一个入口。

## 页面 UI

- 深色底，**整页的强调色跟着选的主队变**：选 Lakers，按钮和 HOT 字标变金色；选 Celtics 变绿白。比一个固定品牌色更有「主场」感。
- 手机上预览固定在屏幕上方，下面依次是：选主队 → 选款式 → 印上你的字 → 加日期；最底下一条大按钮「选照片 / 做好照片」。电脑上照片在左、控件在右（沿用拾光）。
- 队名、号码和口号用两款自带的开源字体：Anton（窄长的球衣字）和 Graduate（大学风的刺绣字母），放在网站里一起发布，不走外部字体服务，国内也打开快。中文用系统字体。
- 文案短、带态度：「你的主队，印在照片上」。队名和口号保留英文原文。

## 名称和口号：保持原汁原味

（2026-11-26 定）队名、校名、昵称、口号一律用真实英文原文，不翻译成中文：写 Michigan Wolverines、ANN ARBOR, MI，不写「密歇根 · 安娜堡」。中文只做小字说明（如卡片上的「密歇根大学」）。

每队默认口号用真实的口号或助威语：GO BLUE、ROLL TIDE、ROCK CHALK, JAYHAWK、YOU'LL NEVER WALK ALONE、MÉS QUE UN CLUB、MIA SAN MIA、¡HALA MADRID! 等；另有通用口号（GAME DAY、HOME TEAM、ALL IN，以及几句中文）可点选，也能自己写。

每队字段：正式全名（name）、胸前字样（short，如 CAROLINA、MAN UTD）、主场城市（city）、昵称或吉祥物（nick，如 Rossoneri、Wolverines）、中文说明（cn）、徽章字母（letter）、配色和默认号码。

## Logo

（2026-11-26 定）队名、校名、口号、配色和官方 logo 都按真实的来，商标问题由产品方另行处理。

位置已经留好：文件放进 `public/assets/logos/`，在 `teams.js` 的 `logos` 里登记，就会出现在选队卡片、球衣左下、球票存根顶部和徽章左上的圆贴纸上。没登记 logo 的队照常显示配色和字。

## 手机和各平台

照搬拾光已经在真机上验证过的做法：

- **保存**：安卓和鸿蒙点一下「保存照片」直接存进「下载」；iPhone 先「做好照片」，再点「保存到相册」弹出系统分享菜单，选「存储图像」；分享菜单卡住时（WebKit 已知问题）自动改成按住照片保存；微信、QQ、微博、钉钉、支付宝里不能下载，改成按住照片「保存图片」或「发送给朋友」；电脑直接下载。文件名只用英文字母和数字，如 `HOT-LAKERS-JERSEY-20261126-1.jpg`。
- **返回键**关闭弹窗，不会离开页面；有没保存的照片时离开会先提醒。
- 预览高度不随地址栏和键盘跳动；打字时预览变小，输入框不被键盘挡住；小屏手机预览不固定。
- 照片太大会先缩小，导出最长边 4096 像素；HEIC、不是照片的文件、坏文件都有中文提示，上一张照片保留。
- 太旧的浏览器（iOS 12 以前、老安卓）给出提示；Service Worker 让第二次打开更快，没网也能打开。
- 记住上次选的主队、款式、比例、名字、号码、口号和日期开关。

## 和拾光共用的部分

- 照片拍摄日期读取（`photo-date.js`）、弹窗和返回键（`dialog.js`）、Service Worker
- 静态站结构、`?v=` 版本号和检查脚本、浏览器测试的写法

## 还没做的

- 官方 logo 图片（位置已留好）。
- 统计：暂不加。
- 不配自定义域名，用 Cloudflare Pages 给的地址。
