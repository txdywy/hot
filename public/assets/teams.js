// Teams and schools by their real English names, nicknames and chants.
// Chinese only appears as a small note (cn).
// name = full name, short = the word across the chest, city = home city,
// nick = nickname or mascot, letter = varsity letter on the patch style.
// c1 = main colour, c2 = second colour, c3 = trim, ink = text on c1.

export const groups = [
  ['hoops', 'NBA', '篮球'],
  ['college', 'NCAA', '大学篮球'],
  ['campus', 'CAMPUS', '名校'],
  ['gridiron', 'NCAA FOOTBALL', '大学橄榄球'],
  ['football', 'EUROPE', '欧洲足球'],
];

function team(id, group, name, short, city, nick, cn, letter, [c1, c2, c3, ink], number, slogan) {
  return {id, group, name, short, city, nick, cn, letter, c1, c2, c3, ink, number, slogan};
}

export const teams = [
  team('lakers', 'hoops', 'Los Angeles Lakers', 'LAKERS', 'LOS ANGELES', 'Purple & Gold', '湖人', 'L', ['#552583', '#fdb927', '#ffffff', '#fdb927'], '24', 'SHOWTIME'),
  team('celtics', 'hoops', 'Boston Celtics', 'CELTICS', 'BOSTON', 'Celtic Pride', '凯尔特人', 'C', ['#007a33', '#ffffff', '#ba9653', '#ffffff'], '34', 'BLEED GREEN'),
  team('warriors', 'hoops', 'Golden State Warriors', 'WARRIORS', 'SAN FRANCISCO', 'Dub Nation', '勇士', 'W', ['#1d428a', '#ffc72c', '#ffffff', '#ffc72c'], '30', 'STRENGTH IN NUMBERS'),
  team('bulls', 'hoops', 'Chicago Bulls', 'BULLS', 'CHICAGO', 'Windy City', '公牛', 'B', ['#ce1141', '#111111', '#ffffff', '#ffffff'], '23', 'SEE RED'),
  team('heat', 'hoops', 'Miami Heat', 'HEAT', 'MIAMI', 'Heat Nation', '热火', 'H', ['#98002e', '#f9a01b', '#111111', '#ffffff'], '3', 'HEAT CULTURE'),
  team('knicks', 'hoops', 'New York Knicks', 'KNICKS', 'NEW YORK', 'The Garden', '尼克斯', 'N', ['#006bb6', '#f58426', '#ffffff', '#ffffff'], '33', 'GO NY GO NY GO'),
  team('mavericks', 'hoops', 'Dallas Mavericks', 'MAVERICKS', 'DALLAS', 'Mavs', '独行侠', 'M', ['#00538c', '#b8c4ca', '#002b5e', '#ffffff'], '77', 'MFFL'),
  team('spurs', 'hoops', 'San Antonio Spurs', 'SPURS', 'SAN ANTONIO', 'Silver & Black', '马刺', 'S', ['#111111', '#c4ced4', '#ffffff', '#c4ced4'], '21', 'GO SPURS GO'),

  team('duke', 'college', 'Duke Blue Devils', 'DUKE', 'DURHAM, NC', 'Blue Devils', '杜克大学', 'D', ['#003087', '#ffffff', '#6e8fc4', '#ffffff'], '1', "LET'S GO DUKE"),
  team('unc', 'college', 'North Carolina Tar Heels', 'CAROLINA', 'CHAPEL HILL, NC', 'Tar Heels', '北卡大学', 'N', ['#7bafd4', '#13294b', '#ffffff', '#13294b'], '23', 'GO HEELS'),
  team('kentucky', 'college', 'Kentucky Wildcats', 'KENTUCKY', 'LEXINGTON, KY', 'Wildcats', '肯塔基大学', 'K', ['#0033a0', '#ffffff', '#99b4e6', '#ffffff'], '11', 'GO BIG BLUE'),
  team('kansas', 'college', 'Kansas Jayhawks', 'KANSAS', 'LAWRENCE, KS', 'Jayhawks', '堪萨斯大学', 'K', ['#0051ba', '#e8000d', '#ffffff', '#ffffff'], '22', 'ROCK CHALK, JAYHAWK'),

  team('stanford', 'campus', 'Stanford Cardinal', 'STANFORD', 'STANFORD, CA', 'Cardinal', '斯坦福大学', 'S', ['#8c1515', '#ffffff', '#4d4f53', '#ffffff'], '26', 'FEAR THE TREE'),
  team('harvard', 'campus', 'Harvard Crimson', 'HARVARD', 'CAMBRIDGE, MA', 'Crimson', '哈佛大学', 'H', ['#a51c30', '#ffffff', '#1e1e1e', '#ffffff'], '36', 'VERITAS'),
  team('yale', 'campus', 'Yale Bulldogs', 'YALE', 'NEW HAVEN, CT', 'Bulldogs', '耶鲁大学', 'Y', ['#00356b', '#ffffff', '#978d85', '#ffffff'], '01', 'LUX ET VERITAS'),
  team('cal', 'campus', 'Cal Golden Bears', 'CAL', 'BERKELEY, CA', 'Golden Bears', '加州大学伯克利', 'C', ['#003262', '#fdb515', '#ffffff', '#fdb515'], '68', 'GO BEARS'),

  team('michigan', 'gridiron', 'Michigan Wolverines', 'MICHIGAN', 'ANN ARBOR, MI', 'Wolverines', '密歇根大学', 'M', ['#00274c', '#ffcb05', '#ffffff', '#ffcb05'], '2', 'GO BLUE'),
  team('ohiostate', 'gridiron', 'Ohio State Buckeyes', 'OHIO STATE', 'COLUMBUS, OH', 'Buckeyes', '俄亥俄州立大学', 'O', ['#bb0000', '#666666', '#ffffff', '#ffffff'], '7', 'O-H-I-O'),
  team('alabama', 'gridiron', 'Alabama Crimson Tide', 'ALABAMA', 'TUSCALOOSA, AL', 'Crimson Tide', '阿拉巴马大学', 'A', ['#9e1b32', '#ffffff', '#828a8f', '#ffffff'], '9', 'ROLL TIDE'),
  team('texas', 'gridiron', 'Texas Longhorns', 'TEXAS', 'AUSTIN, TX', 'Longhorns', '德州大学奥斯汀', 'T', ['#bf5700', '#ffffff', '#333f48', '#ffffff'], '10', "HOOK 'EM"),

  team('milan', 'football', 'AC Milan', 'MILAN', 'MILANO', 'Rossoneri', 'AC 米兰', 'M', ['#d6001c', '#111111', '#ffffff', '#ffffff'], '22', 'FORZA MILAN'),
  team('manutd', 'football', 'Manchester United', 'MAN UTD', 'MANCHESTER', 'Red Devils', '曼联', 'M', ['#da291c', '#111111', '#fbe122', '#ffffff'], '7', 'GLORY GLORY MAN UNITED'),
  team('realmadrid', 'football', 'Real Madrid', 'REAL MADRID', 'MADRID', 'Los Blancos', '皇马', 'R', ['#f6f6f2', '#00529f', '#d4a017', '#00529f'], '7', '¡HALA MADRID!'),
  team('psg', 'football', 'Paris Saint-Germain', 'PSG', 'PARIS', 'Les Parisiens', '大巴黎', 'P', ['#004170', '#da291c', '#ffffff', '#ffffff'], '10', "ICI C'EST PARIS"),
  team('barca', 'football', 'FC Barcelona', 'BARÇA', 'BARCELONA', 'Blaugrana', '巴萨', 'B', ['#a50044', '#004d98', '#edbb00', '#ffffff'], '10', 'MÉS QUE UN CLUB'),
  team('bayern', 'football', 'FC Bayern München', 'BAYERN', 'MÜNCHEN', 'Die Roten', '拜仁', 'B', ['#dc052d', '#ffffff', '#0066b2', '#ffffff'], '25', 'MIA SAN MIA'),
  team('liverpool', 'football', 'Liverpool FC', 'LIVERPOOL', 'LIVERPOOL', 'The Reds', '利物浦', 'L', ['#c8102e', '#ffffff', '#00b2a9', '#ffffff'], '11', "YOU'LL NEVER WALK ALONE"),
  team('juventus', 'football', 'Juventus', 'JUVENTUS', 'TORINO', 'Bianconeri', '尤文图斯', 'J', ['#111111', '#ffffff', '#c9a227', '#ffffff'], '10', 'FINO ALLA FINE'),
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

// Official logos in assets/logos/, by team id: {lakers: 'lakers.svg'}. A team without
// an entry is drawn with its colours and names only. Raise the ?v= in app.js's
// logoUrl when a logo file changes.
export const logos = {};
