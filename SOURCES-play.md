# 动漫、卡牌和游戏素材来源

七龙珠、海贼王、火影忍者、灌篮高手、足球小将，以及初代奥特曼和泽塔奥特曼的徽章，是用 Canvas 自己画的符号（生成脚本不在仓库里）。其余图片来源如下，每个系列一节，从收集时的笔记整理。

---

## Ultraman — sources

Art for Ultraman is scarce on GitHub (Tsuburaya's own hosts are blocked from here).

| file | source | processing |
|---|---|---|
| logos/tiga.png | https://raw.githubusercontent.com/ik4lyfe/ultraman-math-pwa/HEAD/public/assets/images/ultraman_tiga.png (official Tiga Multi Type render, 2317×3476, transparent) | trimmed, downscaled to 600 px tall, quantised; corners transparent |
| logos/seven.png | https://raw.githubusercontent.com/akbaradiw/Tokusatsu-Heroes-Agency/HEAD/public/ultra7.png (official-style Ultraseven bust, 300×209, transparent) | the source is cut off flat at the chest, so a 22 % linear alpha fade was added at the bottom edge; trimmed, quantised. Small (≈200 px) |
| logos/zero.png | https://raw.githubusercontent.com/akbaradiw/Tokusatsu-Heroes-Agency/HEAD/public/Zero0.png (official-style Ultraman Zero bust, 300×209, transparent) | same bottom fade, trimmed, quantised. Small (≈207 px) |
| logos/ultraman.png | MISSING — no transparent render of the original Ultraman found on GitHub |
| logos/ultraz.png | MISSING — no render of Ultraman Z found on GitHub |
| wordmark | none found |

Facts: heights/weights cross-checked against https://raw.githubusercontent.com/icygit6/UltraInfo/HEAD/lib/data/ultraman/*.dart
(values copied from Tsuburaya's site): Ultraman 40 m / 35,000 t, Seven 40 m / 35,000 t, Tiga 53 m / 44,000 t, Zero 49 m / 35,000 t.

`number` choices
- Ultraman "1": the first Ultra hero on TV (1966).
- Ultraseven "7": his name.
- Tiga "3": "tiga" means three (Indonesian/Malay), the source of his name and his three Types (Multi/Power/Sky).
- Zero "0": his name.
- Ultraman Z "20": debut year 2020 (nothing better).

Left out / uncertain
- Ultraman Z height and weight: sources disagree (52 m / 33,000 t vs 54 m / 30,000 t), so they were left out of `facts`.
- Ultraman Z's third moment is just "FINAL BATTLE" (series finale, December 2020); the exact episode date and the final
  enemy's mainland name were not verified.
- Seven's transformation shout ("Dewa!"-type romanisations vary) was not used; chant is his famous final-episode reveal.
- `cn` for Ultraman uses 初代奥特曼 as asked (on some mainland products he is just 奥特曼).

---

## Pokémon — sources

All PNGs: alpha-trimmed, downscaled (LANCZOS) only if the long side exceeded 600 px, quantised with
`quantize(colors=256, method=FASTOCTREE)` (transparency kept), corners checked transparent.

| file | source | processing |
|---|---|---|
| logos/pikachu.png | https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png | trimmed (475→431×405), quantised |
| logos/charizard.png | …/official-artwork/6.png | trimmed, quantised |
| logos/mewtwo.png | …/official-artwork/150.png | trimmed, quantised |
| logos/eevee.png | …/official-artwork/133.png | trimmed, quantised |
| logos/gengar.png | …/official-artwork/94.png | trimmed, quantised |
| logos/lucario.png | …/official-artwork/448.png | trimmed, quantised |
| logos/pokemon-wordmark.png | https://media.githubusercontent.com/media/Ubalt-GAME/project-part-3-AttackOnMayo/HEAD/Assets/1920px-International_Pok%C3%A9mon_logo.svg.png (Git LFS; the international "Pokémon" wordmark, 1920×707 RGBA) | trimmed, downscaled to 600 px wide, quantised |
| logos/pokemon-pokeball.png (extra) | https://media.githubusercontent.com/media/DhanushPillay/Omnidex/HEAD/frontend/static/pokeball.png (Git LFS, 528×527 RGBA) | quantised (fan-drawn Poké Ball in official style, not Nintendo art) |

Facts/stats: PokeAPI data mirror https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2/pokemon/<n>/index.json
and …/pokemon-species/<n>/index.json (base stats, height dm→m, weight hg→kg, abilities, genus).

Notes / choices
- `facts` ABILITY shows the first standard ability only (Eevee also has Adaptability; Lucario also has Inner Focus).
  Gengar's ability is Cursed Body (Gen VII+; it was Levitate in Gen III–VI).
- Lucario `est` = 2005 (first appearance in the film "Lucario and the Mystery of Mew", before Diamond & Pearl in 2006).
- `city`/`home` use the classic game/anime locations (Viridian Forest, Charicific Valley, Cerulean Cave, Celadon Mansion,
  Pokémon Tower, Iron Island, Cameran Palace).
- Left out: exact Chinese titles of some products were shortened in the Chinese half of `moments`.

---

## Slam Dunk — sources

## PNGs
| file | source | processing |
|---|---|---|
| logos/slamdunk-wordmark.png | https://raw.githubusercontent.com/Maicol843/slamDunk.github.io/HEAD/assets/Logo.png | Already transparent RGBA (860x390, red SLAM DUNK logo). Trimmed, LANCZOS to 600 px wide, quantised to 256 colours. Corners transparent. 11 KB |

**Missing:** shohoku.png, sannoh.png, kainan.png, ryonan.png. No team emblems exist on GitHub (the teams have no
official crest beyond the jersey), and no clean transparent official-art player cut-out could be found from the
reachable hosts in the time budget. Rejected candidates: a Sakuragi chibi with a baked-in checkerboard
(cheytac2025/WD-SEATWORK-1), a generic generated "#10" jersey icon (T8mars/T8-penguin-canvas), the Vol. 1
cover JPEG-on-white (immayankkashyap/myanimelist-clone/images/slamdunk.png, 225x350, logo overlaps the figure),
and poster-style SVGs with no character art (excel007/slamdunk2).

## Facts (checked against slamdunk.fandom.com team/player pages + ja wiki mirror)
- Shohoku: Kanagawa, coach Anzai, red & black (also white) kit; #4 Akagi (capt.), #7 Miyagi, #10 Sakuragi, #11 Rukawa, #14 Mitsui.
  Kanagawa 2nd place; Inter-High: beat Toyotama, beat Sannoh 79-78, then lost to Aiwa Gakuin (score left out — the wiki
  value looked unreliable).
- Sannoh: Akita, coach Domoto, three straight Inter-High titles; #4 Fukatsu (capt.), #7 Masashi Kawata, #9 Sawakita.
  Wiki gives white and black as team colours. Mikio Kawata's / Nobe's numbers not verified → left out.
- Kainan: coach Takato, jersey white/yellow/purple, 17 consecutive Kanagawa titles, Inter-High runners-up;
  #4 Maki (capt.), #6 Jin, #10 Kiyota.
- Ryonan: coach Taoka, dark blue & white; #4 Uozumi (capt.), #6 Koshino, #7 Sendoh, #13 Fukuda; Kanagawa 3rd;
  beat Shohoku 87-86 in the practice game; Sendoh becomes captain after Uozumi retires.
- Publication: serialised in Weekly Shōnen Jump from 1990, ended 1996 (the Sannoh game is the last big game);
  TV anime from 1993 (it ended before the Inter-High, so Sannoh first appeared on screen in THE FIRST SLAM DUNK, 2022;
  China release 2023).

## Uncertain / interpretive (please review)
- `est` = 1990 for all four teams = series debut, not each team's first chapter (not verified per team).
- Slogans/chants are not official team mottos: Shohoku "TENSAI SAKURAGI" (Sakuragi's self-styled "genius"),
  chant = Coach Anzai's famous "If you give up, the game is over"; Ryonan = Sendoh's famous
  "It's not yet time to panic" (まだあわてるような時間じゃない); Sannoh "KING OF HIGH SCHOOL" / nick "The Kings"
  and Kainan "KING OF KANAGAWA" (神奈川の王者) are descriptive titles; "Sannoh! Sannoh!" / "Kainan! Kainan!" are generic cheers.
- I could not verify that Kainan's banner reads 常勝, so it is not used.
- Shohoku nick "The Dark Horse" (they were the unseeded team that reached the Kanagawa final league).

---

## Captain Tsubasa — sources

## PNGs
**Missing: all** (nankatsu.png, toho.png, japan.png, no wordmark). GitHub code search only turned up placeholders
(a README listing logo_nankatsu.png/logo_toho.png/logo_musashi.png that are not in the repo —
dilandmorris62-sketch/Captain-tsubasa-new-era), pixel-art/AI placeholder SVGs, and pages hot-linking
Pinterest/fandom images (hosts blocked here). No official crest or transparent character render was reachable.

## Musashi → replaced by Japan Jr. Youth
Musashi FC's kit colours and Jun Misugi's club number could not be verified (fandom page failed to load; Wikipedia
list has no kit/number), so per the brief the third entry is **All Japan Jr. Youth** (id "japan", 日本少年队).

## Facts (captaintsubasa.fandom.com: Nankatsu SC, Nankatsu Middle School, Toho Academy kit text, All Japan Jr., Kojiro Hyuga; Wikipedia)
- Nankatsu SC: Nankatsu City, Shizuoka (fictional town). Home kit white with blue stripes; away red.
  #10 Tsubasa (capt.), #11 Misaki, #1 Wakabayashi, #14 Ishizaki. Won the 6th and 7th All-Japan Boys' tournaments
  (the 7th after Tsubasa's generation). Nankatsu Middle School: 3 national middle-school titles (3rd shared with Toho after 4-4 aet).
  Foreign-dub names "New Team" (Spain/Europe) and "Niupi" (Latin America).
- Toho Academy: home kit black shirt with white sleeves, black shorts. Hyuga #10 (nickname "Fierce Tiger", Tiger Shot,
  Raiju Shot). Wakashimazu and Sawada given as plain names (numbers not verified).
- All Japan Jr. Youth: coach Tatsuo Mikami; home white/blue, away blue; #10 Tsubasa, #11 Misaki, #9 Hyuga, #24 Misugi.
  Beat West Germany 3-2 in the final of the 1st International Jr. Youth Tournament (France).
- Manga: Weekly Shōnen Jump from 31 March 1981; TV anime from 10 Oct 1983 (TV Tokyo); new anime 2018; its second
  season (Junior Youth arc) 2023. Captain Tsubasa: Rise of New Champions released 2020.

## Uncertain / left out
- Toho Academy's city could not be verified → `city` is just "JAPAN" (I believe it is Tokyo; please confirm).
- Goalkeeper numbers for Jr. Youth: the wiki lists Wakashimazu #1 and Wakabayashi #22, which I could not cross-check,
  so Wakabayashi is a plain name.
- `est` = 1981 (series debut) for all three; the teams' own first chapters were not checked.
- Slogans: "BALL IS MY FRIEND" (Tsubasa's well-known line), "TIGER SHOT" (Hyuga's shot), "NIPPON" (generic cheer).
- Misugi's "Prince of the Pitch" and Wakabayashi's "SGGK" are not used (not verified in a fetched source).

---

## Hogwarts — sources

## PNGs
| file | source | processing |
|---|---|---|
| logos/gryffindor.png | https://raw.githubusercontent.com/mcclainclain/potter-svelte/HEAD/src/GRYFFINDOR.svg | Rasterised with cairosvg at 1400 px wide (transparent), trimmed to alpha bbox, LANCZOS downscale to 600 px long side, quantised to 256 colours (FASTOCTREE). Corners transparent. 40 KB |
| logos/slytherin.png | https://raw.githubusercontent.com/mcclainclain/potter-svelte/HEAD/src/SLYTHERIN.svg | same. 47 KB |
| logos/ravenclaw.png | https://raw.githubusercontent.com/mcclainclain/potter-svelte/HEAD/src/RAVENCLAW.svg | same. 32 KB |
| logos/hufflepuff.png | https://raw.githubusercontent.com/mcclainclain/potter-svelte/HEAD/src/HUFFLEPUFF.svg | same. 36 KB |
| logos/hogwarts-wordmark.png | https://raw.githubusercontent.com/CoskunCakir/sortinghat/HEAD/public/images/hogwarts.svg | Full-colour Hogwarts crest with "Draco dormiens nunquam titillandus" scroll; same processing. 58 KB |

The four house crests are the film-style crests (house name on a scroll), full colour.
cairosvg was pip-installed (ImageMagick here has no SVG delegate).

## Facts / choices
- `number`: Gryffindor "7" = Harry's film Quidditch number (costume designer Jany Temime, Bustle interview: chose 7 after David Beckham).
  Slytherin "472", Ravenclaw "426", Hufflepuff "352" = each house's points at the 1991–92 end-of-year feast
  (Philosopher's Stone, ch. 17), also shown in `facts`.
- `titles`: only Gryffindor has a count (House Cup 1991–92, 1992–93, 1993–94 — "third year running" in Prisoner of Azkaban).
  Other houses use "FOUNDED BY …" because I was not sure of the exact Slytherin pre-1991 streak (six or seven years), so it is left out.
- Colours follow the books (Ravenclaw blue & bronze). Ravenclaw `mascot` is EAGLE (books); the films use a raven.
- Elements (fire/water/air/earth) are from J.K. Rowling's Wizarding World/Pottermore writing.
- `est` = 1997, the first book's publication (debut), not the in-universe founding (~1,000 years earlier).
- `chant`s are lines from the Sorting Hat's song in Philosopher's Stone; Ravenclaw's is the diadem motto.
- Nicknames "Lions/Snakes/Eagles/Badgers/Puffs" are common fandom names rather than book text.

---

## Yu-Gi-Oh! — sources

No transparent cut-outs of these monsters could be found on GitHub, so each PNG is the card's rectangular
ARTWORK crop (no card frame/text). These are OPAQUE (corners not transparent) — acceptable for Yu-Gi-Oh only, as agreed.

Source repo: adambennett/StS-DuelistMod (Slay the Spire mod), Git LFS files under
https://media.githubusercontent.com/media/adambennett/StS-DuelistMod/HEAD/src/main/resources/duelistModResources/images/cards/
The mod's 500×380 "_p" portraits are the official card art inside a Slay-the-Spire card-art mask (notched/rounded edges);
I cropped each to the largest fully opaque rectangle, then quantised (no resize needed).

| file | source file | crop box (x0,y0,x1,y1) | notes |
|---|---|---|---|
| logos/darkmagician.png | Dark_Magician_p.png | 2,0,498,307 → 496×307 | original Dark Magician art (purple) |
| logos/blueeyes.png | Blue_Eyes_Alt_p.png | 2,0,498,307 → 496×307 | an ALTERNATE official Blue-Eyes artwork, not the original LOB art |
| logos/redeyes.png | Red_Eyes_p.png | 2,0,498,307 → 496×307 | original art |
| logos/dmgirl.png | Dark_Magician_Girl_p.png | 4,0,492,363 → 488×363 | original art |
| logos/exodia.png | Exodia_Head_p.png | 4,0,492,363 → 488×363 | original art |
| wordmark | none found |

Facts: https://raw.githubusercontent.com/DawnbrandBots/yaml-yugi/HEAD/data/cards/<passcode>.json (ATK/DEF, attribute,
type, level, passcode, set lists) and https://raw.githubusercontent.com/DawnbrandBots/yaml-yugi-zh/HEAD/zh-CN/<passcode>.yaml
for the Simplified Chinese names (黑魔术师 / 青眼白龙 / 真红眼黑龙 / 黑魔术少女 / 被封印的艾克佐迪亚).
DMG's first OCG card (G3-11 prize card) date, 27 Aug 2000, from Yugipedia.

Notes / uncertain
- `facts` SET is labelled "SET", not "FIRST SET": for Dark Magician, LOB-005 and SDY-006 came out at the same TCG launch,
  and for Dark Magician Girl I did not verify that MFC-000 was her very first English print.
- `est` = first OCG card release year. Dark Magician (Vol.1), Blue-Eyes (Starter Box), Red-Eyes (Vol.3) are 1999. Exodia's
  first print (Premium Pack) is believed to be 1999 but was NOT verified. The characters themselves appeared earlier in the manga
  (1996–97); those dates were not verified, so they were not used.
- Kaiba's "3 copies" (titles) is the in-universe count (he tore up the fourth).
- Attack names (Dark Magic Attack, Burst Stream of Destruction, Inferno Fire Blast, Dark Burning Attack, "Exodia, Obliterate!")
  are the English-dub names.

---

## Dragon Ball (七龙珠) — sources

## PNGs
None. I did not download or repackage character art or the series wordmark: these are copyrighted
character images, and copying them into the site is not something I will do even for a prototype.
The frames can fall back to the `letter` monogram, or the owner can add licensed art later.

## Numbers
- goku "4": the Four-Star Dragon Ball, Grandpa Gohan's keepsake that Goku carries.
- vegeta "89": debut year (manga ch. 204, Weekly Shonen Jump, January 1989). No better canon number.
- piccolo "23": the 23rd Tenkaichi Budokai, where (as Ma Junior) he reached the final against Goku.
- frieza "530": from his famous line "my power level is 530,000".

## Facts and where they came from
- Debuts: Goku ch. 1 (1984); Piccolo ch. 161 (Feb 1988); Vegeta ch. 204 (Jan 1989); Frieza ch. 247 (Oct 1989) — English Wikipedia articles.
- Voice actors (Nozawa, Horikawa, Furukawa, Nakao), Frieza's Death Ball / Death Beam and forms incl. Golden and Black — English Wikipedia.
- Goku's only Tenkaichi Budokai win is the 23rd (vs Piccolo).

## Left out / less certain
- Exact year of Vegeta's first Super Saiyan and Majin Vegeta in the manga (not used).
- Piccolo's home world given as Namek (his birth was on Earth; Namek is his race's homeworld).
- Black Frieza moment dated 2022 (manga ch. 87) and Goku's first Super Saiyan dated 1991 from memory, not re-checked.

---

## One Piece (海贼王 / 航海王) — sources

## PNGs
None. I did not download or repackage character art or the series wordmark (copyrighted images).
The frames can fall back to the `letter` monogram, or the owner can add licensed art later.

## Bounties (checked 2026-11-27)
Post-Wano bounties are still the latest canon numbers for these characters: Luffy ฿3,000,000,000,
Zoro ฿1,111,000,000, Sanji ฿1,032,000,000, Nami ฿366,000,000 (CBR "Straw Hat post-Wano bounties explained").
Chapter 1130 (Elbaph) gave new bounties only to Dorry and Brogy (Sportskeeda ch. 1130 spoilers); no newer
Straw Hat bounty was found. Ace's final bounty: ฿550,000,000.

## Numbers
- luffy "1": captain, member no. 1 of the Straw Hat Pirates.
- zoro "3": Santoryu, his Three Sword Style.
- sanji "66": Germa 66, his birth family's army (Vinsmoke).
- nami "100": the 100,000,000 berries she was saving to buy Cocoyasi Village back from Arlong.
- ace "2": Commander of the Whitebeard Pirates' 2nd Division.

## Names
- Sanji: mainland official name 山治 (Moegirl gives 山治 as the mainland name); 香吉士 is the Taiwan (Tong Li) name.

## Left out / less certain
- Zoro's "Nothing happened" (Thriller Bark) and King fight were not given years (dates unsure).
- Ace vs Blackbeard on Banaro Island left out (exact year unsure).
- Publication years of 1998/1999/2009/2010/2017 moments are reckoned from chapter numbers, not re-checked.

---

## Naruto (火影忍者) — sources

## PNGs
None. I did not download or repackage character art or the series wordmark (copyrighted images).
The frames can fall back to the `letter` monogram, or the owner can add licensed art later.

## Ninja registration numbers
- Naruto 012607 (Boruto wiki; Moegirl notes manga 012607, anime 102607)
- Sasuke 012606 (Narutopedia)
- Kakashi 009720 (Narutopedia)
- Itachi 012110 (Moegirl)
- Gaara: Moegirl gives 56-001 but I could not confirm it from a second source, so it is left out.

## Numbers
- naruto "7": Seventh Hokage. kakashi "6": Sixth Hokage. gaara "5": Fifth Kazekage.
- sasuke "1": top of his Academy class (Rookie of the Year).
- itachi "13": the age he became an ANBU captain (Moegirl: academy at 7, chunin at 10, ANBU captain at 13).

## Other facts
- Debuts: Itachi ch. 139 (2002), Gaara ch. 35 (2000) — English Wikipedia; Sasuke and Kakashi ch. 3 (1999) — Narutopedia.
- Birthdays: Naruto Oct 10, Sasuke Jul 23, Kakashi Sep 15, Itachi Jun 9, Gaara Jan 19. Kakashi chunin at 6, jonin at 12.
- Voice actors: Takeuchi, Sugiyama, Ishikawa (Itachi), Ishida (Gaara).

## Left out / less certain
- Sasuke vs Itachi (manga) and Gaara's war speech left out: exact publication years unsure.
- Part II start (Gaara as Kazekage) dated 2005 from the volume 28 release; Kakashi Hiden and Itachi Shinden novels dated 2015 from memory.
- Kakashi's Japanese voice actor not added (not confirmed in the pages read).

---

## 王者荣耀 (hok) — sources

## Images
All PNGs come from just-lum/wzry-holo-cards `assets/cutout/` (README: 「透明立绘（PNG，含 Alpha）」 —
transparent cut-outs of each hero's ORIGINAL-skin (原皮) splash art):
https://raw.githubusercontent.com/just-lum/wzry-holo-cards/HEAD/assets/cutout/<编号>_<英雄名>.png

| file | source file | notes |
|---|---|---|
| logos/libai.png | assets/cutout/131_李白.png | 青莲剑仙 原皮 |
| logos/hanxin.png | assets/cutout/150_韩信.png | 国士无双 原皮. The figure is clipped by the original splash frame on the left/bottom edge, so one corner is not transparent (it is the figure, not background) |
| logos/sunwukong.png | assets/cutout/167_孙悟空.png | 齐天大圣 原皮. Fire effects/figure are clipped by the splash frame on the right and bottom edges (two corners partly opaque, art not background) |
| logos/diaochan.png | assets/cutout/141_貂蝉.png | 绝世舞姬 原皮 |
| logos/luban7.png | assets/cutout/112_鲁班七号.png | 机关造物 原皮 |

Processing: alpha-trimmed (alpha > 10), downscaled with Pillow LANCZOS to long side 600 px, quantised
(`quantize(colors=256, method=FASTOCTREE)`, transparency kept). These are wide splash cut-outs (landscape
~600x340-410), not upright full-body renders.

No 王者荣耀 wordmark: none found on GitHub as a transparent image (game.gtimg.cn and wikis are blocked).

## Facts
- Skill names (`retired`): 1837620622/ckapi api/data/wangzhe/<id>.json (official hero data mirror) and
  YongXie66/Honor-of-Kings_RolePlay datasets/RAG_Data/<英雄>.txt.
- Voice lines (chant/slogan/motto): lulaide/WZRY-audio dataset/<英雄>/<原皮名>/<英雄>-<原皮名>.list (in-game original-skin
  voice transcripts). 李白「大河之剑天上来！」, 韩信「必将百倍奉还！」, 孙悟空「取经之路，就在脚下。」, 貂蝉「不要爱上妾身哟！」,
  鲁班七号「借你们肉体试验下新发明的威力！」 also appear in the official hero stories.
- Release dates (est), class, 阵营 / 区域 / 身份 / 种族 / 身高 (city/home/titles/facts), skin lists:
  lhccong/fish-island-backend sql/init_hero.sql (scrape of the official 英雄资料): 李白 2016-03-01, 韩信 2015-11-26,
  孙悟空 2015-11-30, 貂蝉 2015-12-15, 鲁班七号 2015-11-26 (= launch day).
  · 李白: 阵营 长安, 区域 河洛, 身份 天才剑客 · 韩信: 阵营 灞上, 区域 大河流域, 身份 灞上武将 · 孙悟空: 种族 魔种, 阵营 日之塔,
    区域 建木, 身份 魔种起义军将领 · 貂蝉: 区域 三分之地, 暂无阵营 · 鲁班七号: 种族 人造人, 阵营 玄雍, 区域 逐鹿.
  UNSURE: 孙悟空's 建木/日之塔 come only from that dataset (newer lore); I could not cross-check them.
- 李白 titles 「三入长安」 is from his official hero story (「剑仙李白，三入长安了」); homeNick 朱雀门剑痕 likewise.
- Skin release years in `moments` (千年之狐 2016, 凤求凰 2017, 白龙吟 2016, 逐梦之影 2017, 地狱火 2016, 至尊宝 2017,
  圣诞恋歌 2015, 仲夏夜之梦 2017, 星空梦想 2018, 江户川柯南 2024) are from 2231499412/kpl-agent
  frontend/src/data/skinData.js (a hand-made list; I used the year only). Moderate confidence.
- Lanes (打野/中路/发育路) are the heroes' standard recommended positions.

## number
- 李白 4: his passive 侠客行 — 4 道剑气 unlock 青莲剑歌.
- 韩信 150 / 貂蝉 141: their official hero codes (英雄编号 used by the official site).
- 孙悟空 72: 七十二般变化 (his own in-game line 「七十二般变化，可有机械这一变？」).
- 鲁班七号 7: the 七号 in his name. (智商 250 from his line 「鲁班大师，智商250，膜拜。记得膜拜！」 is used in `titles`.)

## Left out
- 孙悟空 "20% 天生暴击" (older skill text; may have changed in his rework). Skin quality tiers (传说/史诗) not stated.
- Nicknames 兵仙 (韩信) is the historical Han Xin's epithet; 猴子 / 小鲁班 are common player nicknames.

---

## 原神 (genshin) — sources

## Images
All PNGs: alpha-trimmed (alpha > 10), downscaled with Pillow LANCZOS to long side 600 px, quantised
(`quantize(colors=256, method=FASTOCTREE)`, transparency kept). Corners checked transparent.

| file | source | notes |
|---|---|---|
| logos/zhongli.png | https://raw.githubusercontent.com/genshindev/api/master/assets/images/characters/zhongli/portrait | official full-body render, already transparent |
| logos/raiden.png | https://raw.githubusercontent.com/genshindev/api/master/assets/images/characters/raiden/portrait | official full-body render, transparent |
| logos/hutao.png | https://raw.githubusercontent.com/genshindev/api/master/assets/images/characters/hu-tao/portrait | official full-body render, transparent (3240x4452 source) |
| logos/nahida.png | https://raw.githubusercontent.com/genshindev/api/master/assets/images/characters/nahida/portrait | WebP, official full-body render, transparent |
| logos/furina.png | https://raw.githubusercontent.com/genshindev/api/master/assets/images/characters/furina/portrait | official full-body render but on an opaque WHITE background; I removed the background by flood-filling near-white (min RGB >= 236) pixels connected to the image border, eroded the mask 1 px and feathered it (blur 0.8). Checked on dark and magenta backgrounds: clean, no white halo visible. (The transparent wish splash for Furina has a water-effect background, so not used.) |
| logos/genshin-wordmark.png | https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/png/genshin-impact-wordmark-zh-hans.png | official Simplified-Chinese 「原神」 wordmark, black on transparent (needs a light background; a light/white English "GENSHIN IMPACT" variant also exists there as genshin-impact-light.png) |

## Facts
- Title, constellation (命之座), element, weapon, affiliation, birthday, Chinese CV, talent names,
  and all quoted lines (元素战技/元素爆发 voice lines, first-meeting lines) are from theBowja/genshin-db
  Simplified-Chinese data: https://raw.githubusercontent.com/theBowja/genshin-db/main/src/data/ChineseSimplified/{characters,talents,voiceovers}/<name>.json.
  Furina's 命之座 司颂座 and Nahida's/Furina's release dates (3.2 on 2022-11-02, 4.2 on 2023-11-08) were also checked against wiki.biligame.com/ys.
- Banner names and dates (陵薮市朝, 影寂天下人, 赤团开时, 月草的赐慧, 众水的颂诗, 雪霁梅香 and the rerun dates
  used in `moments`) are from PaiGramTeam/PaiGram metadata/pool/pool_301.py.
- slogan / chant are the characters' own 元素爆发 voice lines; motto (钟离, 纳西妲) are excerpts of their 初次见面 lines.
- `est` = year the character became playable (release banner year).
- `number`: 钟离 2 / 雷电将军 3 / 纳西妲 4 / 芙宁娜 5 = the place of their nation in Teyvat's seven nations in the
  game's order (蒙德、璃月、稻妻、须弥、枫丹、纳塔、至冬) — each is that nation's Archon (芙宁娜 played the Hydro Archon's
  role). 胡桃 77 = she is 往生堂第七十七代堂主 (her own first-meeting line).
- `titles`: 钟离 岩王帝君; 雷电将军 御建鸣神主尊大御所 (from her in-game description); 胡桃 77th director;
  纳西妲 小吉祥草王; 芙宁娜 500 years acting as the Hydro Archon.
- 天守阁 (Raiden's home) and 欧庇克莱歌剧院 (Furina's home) are from my own knowledge of the game, not from the data files.
- Nickname 芙芙 is a widely used fan nickname, not an in-game title.

## Left out / unsure
- Exact in-lore ages, and English/Japanese CVs (not needed). No `stats` (Genshin stats are per-level, not one number).
- Zhongli's story-quest (传说任务) release versions — not verified, so not used in `moments`.
