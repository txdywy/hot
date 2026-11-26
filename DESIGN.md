# HOT 主场相框 · 设计方案 v0

产品中文名：HOT 主场相框（2026-11-26 定）。

和「拾光相框」同一套结构：纯静态网页放在 `docs/`，照片只在浏览器里用 Canvas 处理，GitHub Pages 发布。换的是主题和气质：拾光面向长辈，讲大字、稳、少操作；HOT 面向爱体育的年轻人和偏潮流的中青年，讲身份感、配色和能晒出去。

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
- 字体全部用系统字体（粗体 + 斜体），不加载网络字体，保证国内打开快。
- 文案短、带态度：「你的主队，印在照片上」。队名和口号保留英文原文。

## 名称和口号：保持原汁原味

（2026-11-26 定）队名、校名、昵称、口号一律用真实英文原文，不翻译成中文：写 Michigan Wolverines、ANN ARBOR, MI，不写「密歇根 · 安娜堡」。中文只做小字说明（如卡片上的「密歇根大学」）。

每队默认口号用真实的口号或助威语：GO BLUE、ROLL TIDE、ROCK CHALK, JAYHAWK、YOU'LL NEVER WALK ALONE、MÉS QUE UN CLUB、MIA SAN MIA、¡HALA MADRID! 等；另有通用口号（GAME DAY、HOME TEAM、ALL IN，以及几句中文）可点选，也能自己写。

每队字段：正式全名（name）、胸前字样（short，如 CAROLINA、MAN UTD）、主场城市（city）、昵称或吉祥物（nick，如 Rossoneri、Wolverines）、中文说明（cn）、徽章字母（letter）、配色和默认号码。

## Logo

（2026-11-26 定）队名、校名、口号、配色和官方 logo 都按真实的来，商标问题由产品方另行处理。官方 logo 图片下一步加入。

## 和拾光共用的部分

- 照片拍摄日期读取（`photo-date.js` 直接复用）
- 静态站结构、`?v=` 版本号和 `tools/check-assets.mjs` 检查
- 后续可以照搬：微信里长按保存、看大图、拖动裁剪、Service Worker 加速、老系统兜底、各项浏览器测试

## 还没做的

这是设计稿，只做了能看效果的最小可用版本：选队、选款式、写字、加日期、选照片、做好照片。拾光里的裁剪拖动、看大图、微信适配、统计、离线缓存都还没搬过来，等方向定了再补。没有开 GitHub Pages，也没有配域名。
