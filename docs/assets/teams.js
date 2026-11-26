// Themes are built from city, colours and numbers only: no club, league or
// school logos and no official names (most are registered trademarks).
// c1 = main colour, c2 = second colour, c3 = trim, ink = text on c1.

export const groups = [
  ['hoops', '篮球城市', 'NBA 风'],
  ['college', '大学篮球', 'NCAA 风'],
  ['campus', '名校', 'CAMPUS'],
  ['gridiron', '大学橄榄球', 'SATURDAY'],
  ['football', '欧洲足球', 'EURO'],
];

function team(id, group, city, en, colour, c1, c2, c3, ink, number, slogan) {
  return {id, group, city, en, colour, c1, c2, c3, ink, number, slogan};
}

export const teams = [
  team('la', 'hoops', '洛杉矶', 'LOS ANGELES', '紫金', '#552583', '#fdb927', '#ffffff', '#fdb927', '24', '今夜，主场是我们的'),
  team('boston', 'hoops', '波士顿', 'BOSTON', '绿白', '#007a33', '#ffffff', '#ba9653', '#ffffff', '34', '绿色是一种信仰'),
  team('bay', 'hoops', '旧金山湾', 'THE BAY', '蓝金', '#1d428a', '#ffc72c', '#ffffff', '#ffc72c', '30', '三分线外，也是主场'),
  team('chicago', 'hoops', '芝加哥', 'CHICAGO', '红黑', '#ce1141', '#111111', '#ffffff', '#ffffff', '23', '风城从不服输'),
  team('miami', 'hoops', '迈阿密', 'MIAMI', '霓虹', '#121212', '#ff5fa2', '#41c8f0', '#ff5fa2', '3', 'NIGHT GAME'),
  team('newyork', 'hoops', '纽约', 'NEW YORK', '蓝橙', '#006bb6', '#f58426', '#ffffff', '#ffffff', '33', '世界的主场'),
  team('dallas', 'hoops', '达拉斯', 'DALLAS', '湖蓝', '#00538c', '#b8c4ca', '#ffffff', '#ffffff', '77', '德州不大，梦想很大'),
  team('sanantonio', 'hoops', '圣安东尼奥', 'SAN ANTONIO', '银黑', '#111111', '#c4ced4', '#ffffff', '#c4ced4', '21', '安静，但赢'),

  team('durham', 'college', '达勒姆', 'DURHAM', '皇家蓝', '#003087', '#ffffff', '#6e8fc4', '#ffffff', '1', '整座城都在喊'),
  team('chapelhill', 'college', '教堂山', 'CHAPEL HILL', '天空蓝', '#7bafd4', '#13294b', '#ffffff', '#13294b', '23', '天空蓝，一辈子'),
  team('lexington', 'college', '列克星敦', 'LEXINGTON', '蓝白', '#0033a0', '#ffffff', '#99b4e6', '#ffffff', '11', '蓝草之州，篮球之心'),
  team('lawrence', 'college', '劳伦斯', 'LAWRENCE', '红蓝', '#0051ba', '#e8000d', '#ffffff', '#ffffff', '22', '摇滚吧，体育馆'),

  team('paloalto', 'campus', '帕洛阿尔托', 'PALO ALTO', '红杉红', '#8c1515', '#ffffff', '#4d4f53', '#ffffff', '26', '我的青春，有主场'),
  team('cambridge', 'campus', '剑桥', 'CAMBRIDGE, MA', '绯红', '#a51c30', '#ffffff', '#1e1e1e', '#ffffff', '36', '真理之外，还有球场'),
  team('newhaven', 'campus', '纽黑文', 'NEW HAVEN', '深蓝', '#00356b', '#ffffff', '#978d85', '#ffffff', '01', '毕业了，心还在主场'),
  team('berkeley', 'campus', '伯克利', 'BERKELEY', '蓝金', '#003262', '#fdb515', '#ffffff', '#fdb515', '68', '要有光，也要有球'),

  team('annarbor', 'gridiron', '安娜堡', 'ANN ARBOR', '蓝玉米黄', '#00274c', '#ffcb05', '#ffffff', '#ffcb05', '2', '周六是比赛日'),
  team('columbus', 'gridiron', '哥伦布', 'COLUMBUS', '猩红灰', '#bb0000', '#666666', '#ffffff', '#ffffff', '7', '十万人一起心跳'),
  team('tuscaloosa', 'gridiron', '塔斯卡卢萨', 'TUSCALOOSA', '深红', '#9e1b32', '#ffffff', '#828a8f', '#ffffff', '9', '赢，是一种习惯'),
  team('austin', 'gridiron', '奥斯汀', 'AUSTIN', '焦橙', '#bf5700', '#ffffff', '#333f48', '#ffffff', '10', '德州的周六'),

  team('milano', 'football', '米兰', 'MILANO', '红黑', '#d6001c', '#111111', '#ffffff', '#ffffff', '22', '红与黑，就是答案'),
  team('manchester', 'football', '曼彻斯特', 'MANCHESTER', '红', '#da291c', '#111111', '#fbe122', '#ffffff', '7', '梦剧场永不落幕'),
  team('madrid', 'football', '马德里', 'MADRID', '纯白', '#f6f6f2', '#00529f', '#d4a017', '#00529f', '7', '白色，是冠军的颜色'),
  team('paris', 'football', '巴黎', 'PARIS', '蓝红', '#004170', '#da291c', '#ffffff', '#ffffff', '10', '巴黎从不安静'),
  team('barcelona', 'football', '巴塞罗那', 'BARCELONA', '红蓝', '#a50044', '#004d98', '#edbb00', '#ffffff', '10', '不止是一场球'),
  team('munich', 'football', '慕尼黑', 'MÜNCHEN', '红白', '#dc052d', '#ffffff', '#0066b2', '#ffffff', '25', '南部之星'),
  team('liverpool', 'football', '利物浦', 'LIVERPOOL', '红', '#c8102e', '#ffffff', '#00b2a9', '#ffffff', '11', '红色的夜晚'),
  team('torino', 'football', '都灵', 'TORINO', '黑白', '#111111', '#ffffff', '#c9a227', '#ffffff', '10', '黑白之间，只有胜利'),
];

export const styles = [
  ['jersey', '球衣', '背后印上你的名字和号码'],
  ['ticket', '球票', '一张写着日期的入场券'],
  ['patch', '徽章', '潮牌贴纸和刺绣字母'],
];

export const slogans = [
  'GAME DAY', 'HOME TEAM', 'ALL IN', '生而为赢', '全力以赴', '永远站在看台这边',
];

export const byId = new Map(teams.map(item => [item.id, item]));
