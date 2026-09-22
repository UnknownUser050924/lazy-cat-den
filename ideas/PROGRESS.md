# 懒猫小屋 feature phases

Source: `ideas/Lazy_Cat_Den_Full_Feature_Ideas.txt`

All five phases are in the app. Keep this file as the map if more ideas are added.

## Phase 1 — make the den feel alive
- [x] Couple Status (status chips, here / away, together-day streak)
- [x] Cat reactions (speech from who is here, letters, quiet room)
- [x] Day / night atmosphere (`html[data-sky]`, sleeping cat, good-night line)
- [x] Cottage as a small room (cat plus objects, not only cards)

## Phase 2 — make it belong to the two of them
- [x] Secret messages — `/room/[room]/letter`
- [x] Question of the day — `/room/[room]/today`
- [x] Our little calendar — `/room/[room]/calendar`
- [x] Draw lots 2.0 — 今晚做什么 on the draw page

## Phase 3 — a personal corner
- [x] My Little Corner — `/room/[room]/corner` and header button 角落
- [x] Vibe identity
- [x] Current cat form
- [x] What I want you to know (thinking / need / want)
- [x] Personal signature

## Phase 4 — make the corner special
- [x] My Pocket
- [x] Personal room (wall + up to 6 objects)
- [x] Partner interaction (hug, pat, flower, note, cookie)
- [x] Know Me? with a simple understood percent

## Phase 5 — shared memory
- [x] Memory timeline — `/room/[room]/memories`
- [x] Automatic milestones: joined, first question, first answer, first draw, first note, first letter, cat mood 100

## Still true
- Two people, private room, no chatbot, no payments, no social feed
- Data still lives in `data/rooms.json`
- Render Free still wipes that file when the service sleeps
