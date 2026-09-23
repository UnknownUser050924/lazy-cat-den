# Project Brief — 懒猫小屋 / Lazy Cat Den

Use this document as full context for any assistant working on this project. It describes the app as it exists in the repo now. The filename is `project-brief.md`.

The product should feel like a private little home for two people:

- Cottage = us / the shared room
- 靠近一点 Come Closer = how we reach each other
- Corner = who I am right now
- Draw = decide something together
- Chat = talk
- Cat = the resident
- Memories = our story

---

## 1. What this is

**懒猫小屋 (Lazy Cat Den)** is a private couple web app for two people. They open the same room on a phone or a computer and live in one small cottage: chat, ask questions, draw lots, leave letters, pat a cat, keep wishes, and fill a small corner about themselves.

It is not a social network, a game, a dating app, or a chatbot. There is no AI inside the product.

The two people:

- Default suggested names: `嘉怡` and `宝宝`
- Default suggested room: `yiyi-and-you`
- The room they actually play in is often `jiayi-and-me`
- Both room ids must work. A pair must share one room id.

They use the live site:

https://lazy-cat-den.onrender.com

Invite shape:

https://lazy-cat-den.onrender.com/?room=jiayi-and-me

Product feel:

- Soft pink and cream, warm, intimate, polished
- Chinese first, with a short English line where it helps
- Phone and laptop are both first-class. Desktop is not a stretched phone
- Light motion. Visible focus. No purple gradients, no dashboard, no giant card grid, no emoji as the main UI
- Must be HTTPS. Localhost and a raw IP are not how they share it

Palette in `app/globals.css`: cream `#fbf6f0`, blush `#f7d6d9`, rose `#d98993`, rose-deep `#c36b76`, ink `#4a3b36`.

GitHub:

https://github.com/UnknownUser050924/lazy-cat-den

Package name: `lazy-cat-den`

---

## 2. Time

The cottage clock is **Asia/Kuala_Lumpur** (`lib/time.ts`), UTC+8, no daylight saving. The server and both phones use this zone for "today", not UTC and not whatever timezone the Render container happens to use.

- `dateKey` is `YYYY-MM-DD` in that zone
- Visit days, the daily question, calendar "today", together streak, pats-today, and cat mood decay all use that date
- Day / evening / night uses the hour in that zone: day before 17:00, evening 17:00–18:59, night 19:00–05:59
- `useNow` (`lib/use-now.ts`) ticks every 15 seconds
- The room header shows the date and clock, for example `9月22日周二 · 15:17`
- The cottage window shows the same clock plus 白天, 傍晚, or 夜里
- `documentElement.dataset.sky` is `day`, `evening`, or `night`. This is the room's light, not a dark-mode toggle
- Message and memory times also render in this zone

---

## 3. What is built

### Join and staying signed in

- `/` asks for a room name and a display name
- On the normal door, chips offer `嘉怡` and `宝宝`, and a suggested room button
- An invite URL `/?room=ROOM` locks that room, hides the name chips, and asks the visitor to type their own name
- If that phone already has a session for the same room, the invite walks straight into the room
- No login, no passwords, no social accounts
- Session is stored in `localStorage` key `lazy-cat-den-session` as `{ room, displayName }`
- The same session is also a cookie `lcd-session`, packed as `room|encodeURIComponent(name)`, one year, `SameSite=Lax`
- The cookie is what lets a poll record presence. The browser sends it on `GET /api/rooms/...`
- A browser with no JavaScript can still join: the form `POST`s to `/api/join`, which joins and sets the cookie, then redirects to `/?room=&joined=`
- Refresh keeps the name. Opening the same room link again does not clear it
- Names `unknown`, `undefined`, and `null` are rejected. Blank names are rejected. Names are trimmed to 24 characters
- Room ids are slugified: trim, lowercase, spaces become `-`, other punctuation dropped, max 48 characters. Chinese characters are kept

### Shell

`RoomShell` wraps every room page.

- Header: 懒猫小屋, the live date and clock, `{room} · 你是 {name}`, and 换房间
- On a phone, a 角落 button stays in the header. From `md` (768px) up, that button hides because the sidebar has 我的角落
- Below 768px: bottom nav, six tabs — 小屋, 聊天, 问答, 抽签, 愿望, 猫
- From 768px up: the bottom nav hides. A narrow scrolling sidebar stays on the left
  - Main: 小屋, 聊天, 问答, 抽签, 愿望, 猫
  - More: 信, 日历, 今日, 我们的故事, 我的角落
- The cottage page uses the full width beside the sidebar. Other pages stay in a readable column (`max-w-xl` or `max-w-3xl`)
- Links and buttons use a visible focus ring. Motion stops when the person prefers reduced motion

### Cottage / 小屋 (`/room/[room]`)

The page is a room (`components/CottageRoom.tsx`), not a stack of feature cards.

Inside the room:

- A window and a lamp. The lamp glows in the evening and at night. The window is bright by day, warm at dusk, and shows stars at night
- At night, a line: `Good night, {name}`
- Two seats. Yours on one side, your partner on the other. On a wide screen they sit left and right of the cat. On a phone the cat comes first, then the seats
- Each seat shows 我 or 对方, the name, presence, signature or 还没写签名, the current feeling, the cat form, and 此刻 if they wrote one
- The page does not invent a person who is missing from the server. The partner seat says 还空着一个位置 until someone else has joined
- Presence:
  - **在线** — this phone's own name, or `lastSeen` within 3 minutes (`ONLINE_MS`)
  - **刚刚还在** — visited today, but not in that window
  - **离开中** — otherwise
- Together streak: days in a row when every member has that Malaysia date in `visitDays`. If today is not shared yet, yesterday's run can still count
- The cat, its line, its mood, and a pat
- **靠近一点**, under the cat
- Object buttons with drawings, and a short Chinese name under each drawing:
  - envelope → 信箱
  - pinned paper → 问答
  - jar → 抽签
  - gift → 愿望
  - calendar → 日历
  - sun → 今日
  - open book → 故事
- A yarn ball labeled 玩具 appears after 5 pats in the room's history. It is decoration, not a page
- A flower mark can sit on the wish gift after at least one wish is done
- A seal dot can sit on the envelope after any letter has been opened
- A star can sit by the lamp when the together streak is 3 or more
- Up to two short banners from real data, for example 你们已经连续一起回来 N 天啦, 猫猫今天被摸了 N 次, 你们完成了 N 个愿望, 今天两个人都来过, 有一封信在等你…. Tapping the banner shows the next line. These are not points
- Sticky notes on the wall, with an invite button that copies `/?room=ROOM`

The old couple-status chip wall is not on the cottage. Feelings are set in the corner.

### Come Closer / 靠近一点

A sheet opened from the cottage. It replaces the old gift buttons that used to live on the corner.

Choices, stored as `gift` actions:

- `hug` 抱抱 — 抱了你一下
- `kiss` 亲亲 — 亲了你一下
- `hand` 牵手 — 牵了你的手
- `cuddle` 贴贴 — 贴了贴你
- `flower` 送花 — 送了你一朵花
- `cookie` 小饼干 — 给了你一块饼干
- `note` 留句话 — needs a short note, max 80 characters. The partner sees 留了句话：…

Rules:

- You cannot target yourself
- If the other person is not in the room yet, the actions stay disabled and the sheet says 等对方走进小屋
- Your phone shows a small line immediately (`你抱了你一下 ♡` and so on). It does not freeze the page
- The partner sees `{name}{line} ♡` on their next poll. Old gifts already on the room are not replayed
- Cat mood goes up by 2
- Only a kiss, a flower, or a note is written into memories. Hugs, hands, cuddles, and cookies are not kept forever
- The old kind `pat` (摸了摸) is still accepted so old rows do not break. It is not in the sheet
- `Gift.note` is optional and only used for 留句话

### Chat / 聊天

- Shared thread. Own lines on the right, the other person's on the left, in softer bubbles
- Send with 发送. Empty text is rejected. Max 200 characters
- Last 80 messages are kept
- The other phone sees a new line on the next poll (about 2.5 seconds)
- A new line from the other person shows a short ♡
- Sending a chat does not raise cat mood
- The first chat is remembered in the story. Later lines are not each a memory

### Q&A / 问答

- Ask a question (max 280). The other person answers (max 400)
- An answered question stays in the history
- A second answer to the same question is rejected
- Answering raises cat mood by 4

### Draw lots / 抽签

The page shows **exactly three jars**. Each has one 抽一下 button, a short reveal, and a large result. History is a collapsed 最近结果 list. Last 40 draws are kept. Any draw raises mood by 3.

**今晚做什么** (`drawType: "plan"`). One person is enough. The server picks one theme, then a concrete result:

- 吃点什么 — from the dinner, snack, or drink jars (火锅, 拉面, 炒饭, 披萨, 寿司, 鸡排, 粥, 烧烤, 马来餐, 随便吃, 薯条, 饼干, 冰淇淋, 水果, 巧克力, 奶茶, 咖啡, 汽水, 热水, 果汁)
- 看什么 — 喜剧, 爱情, 动画, 悬疑, 重看一部老片, 短片就好
- 玩什么 — 一起打游戏, 一起玩 Roblox, 散步, 待在家里
- 听什么 — 一起听音乐, 安静地听一会儿, 交换一首歌
- 出门还是宅家 — 出门走走, 待在家里, 去逛一下
- 随机约会 — from the date or weekend jars (散步, 看电影, 一起打游戏, 吃甜的, 待在家里, 打个电话, 睡懒觉, 出门吃饭, 什么都不做, 去逛一下)

The result's label is the theme. The big text is the concrete pick, for example 玩什么 / 一起玩 Roblox.

**谁来决定** (`drawType: "who"`). Needs two distinct real names. The result is one task and one person:

- 谁选晚餐, 谁选电影, 谁选游戏, 谁选歌, 谁安排今天, 谁先发消息

If fewer than two people are in the room, this jar is disabled and the page says the other two jars can still be used.

**来点甜的** (`drawType: "sweet"`). One person is enough. The result is one of: 抱一下, 亲亲, 牵手一下, 摸摸头, 说一句喜欢你的话, 互相发一张照片.

Older draw types still work if something posts them (`tonight`, and the old `DRAW_TYPES` person and jar ids such as `who-pays` or `dinner`). The page does not show those buttons anymore.

### Wishlist / 愿望

Add, toggle done, delete. Open and done are separate. Marking one done raises cat mood by 5 and writes a `wish-done` memory. Wishes are max 120 characters. Last 80.

### Cat / 猫

The mascot is a sitting cream cat: pointed ears, a body, tucked paws, and a curled tail (`components/CatMascot.tsx`). It is not the old round face with stick ears.

- Mood is an integer from 4 to 100. A new room starts at 72
- Face follows the mood. 70 and above: closed smiling eyes. 40–69: sleepy eyes. Below 40: open eyes and a small frown. Night, or mood below 40, uses the sleepy face
- In the cottage the cat shifts a little: by the window when nobody is here, center when one person is here, toward a person when both are here, and lower when it is night or the mood is under 40
- First check-in of the calendar day: +8. Later check-ins the same day: +2
- Pat: +16, and a row in `pats` (`name`, `at`). The cat page lists 谁摸过 with the name and time. Last 40 pats. The button wiggles
- A poll does **not** check in and does **not** raise mood. Presence on GET only updates `lastSeen` and today's visit day
- If the last check-in was one or more days ago, mood drops by 28 for each missed Malaysia day, down to 4. That drop runs once per calendar day
- Crossing 100 records one memory, 猫心情满了

Cat lines are fixed. They are not generated. In order:

1. A pat in the last 25 seconds: 嘿嘿。
2. A hug, kiss, cuddle, or held hands in the last 90 seconds: 嗯？我是不是打扰到你们了。
3. A wish just finished, in the last 90 seconds: 又完成一个愿望！
4. An unopened letter that you did not write: 有一封信在等你…
5. Both people here: 两个人都回来啦！
6. One person here: 呀！{name}来了 ♡
7. Night and nobody here: 你们还不睡吗…
8. Otherwise: 今天的小屋好安静…

### Letters / 信

- Leave a letter (max 280). Last 12
- The sender cannot open their own letter
- The other person opens it. `openedAt` and `openedBy` are set once
- Both sides then see the text and that it was read

### Today / 今日

One prompt per Malaysia date from `DAILY_PROMPTS` (six prompts, picked by the date). The page shows the date label and the `YYYY-MM-DD` key. Each person can answer (max 280). A later answer from the same name replaces the earlier one. Last 60 days.

Prompts: 如果我们现在可以瞬间去任何地方，你想带我去哪里？ / 你对我的第一印象是什么？ / 我做的哪件小事会让你开心？ / 如果我变成一只猫，你会给我取什么名字？ / 有什么事是你想我们一起经历的？ / 我们有 RM50，要买什么？

### Calendar / 日历

Add a day: date `YYYY-MM-DD`, a type, and a title (max 80). The month opens on the current Malaysia date, and that day is tinted. Types: 晚餐, 电影, 游戏, 通话, 生日, 约会, 自定义. Events can be removed. Last 80.

### Corner / 角落

A small snapshot of who you are today. Switch names if both people are in the room. You edit yourself. The other person's corner is read-only and says so.

Shown:

- Name and cat form: 困困猫, 饿饿猫, 疯跑猫, 贴贴猫, 打工猫, 做梦猫
- Current feeling: 很开心, 好累, 想你, 想吃东西, 想玩, 安静一下 (`glad`, `weary`, `longing`, `peckish`, `playful`, `quiet`)
- Signature, or 还没写签名
- One line, **此刻**. Examples: 现在只想抱一下。 / 今天工作好累。 / 突然很想吃火锅。 / 我在想你。
- Four favorites: 最喜欢的食物, 最喜欢的歌, 最喜欢的游戏, 最喜欢的动物

编辑角落 opens a sheet. Form and feeling save on tap. Signature, 此刻, and the four favorites autosave about 0.7 seconds after typing, on blur, and when the sheet closes.

此刻 is stored in `profile.thinking`. If thinking is empty, the page can still show an older `need` or `want` so old text is not invisible. Saving 此刻 writes `thinking` and leaves `need` and `want` as they were.

Still stored, and not shown on this page:

- Gender, vibes, wall, corner objects
- Pocket keys `color` and `drink`
- Know Me answers and guesses
- The old gift list

Old couple statuses (想你了, 好困, 想吃东西, 心情很好, 今天好累, 在想你, 想玩一下, 陪我一下) still display if that is the saved `statusId`. New edits use the six feelings above. The server accepts both lists.

### Memories / 我们的小故事

A scrapbook. One featured card when there is a first chat, first letter, cat at 100, a finished wish, or someone walking in. The rest are dated cards with a short mark. Tap a card. `place` (or the kind, for older rows) opens the right page.

Recorded from real actions, not from polling:

- joined, questions, answers, draws (with the result), notes, letters, opened letters, first chat, wishes, finished wishes, pats, a kiss / flower / note, pocket fills, Know Me answers, today's answer, calendar events, cat reaching 100

Last 80. Places: qa, draw, letter, chat, wishlist, cat, corner, today, calendar. Notes, walking in, and Come Closer memories open the cottage.

### Sticky notes

On the cottage wall. Five note colors. Add and delete. Max 180 characters. Last 24.

### Guides

- `/guide` — short 怎么玩 page for the two people. Three steps and a few chips. Linked from the door as 怎么玩
- `/guide/helpers` — long assistant guide rendered from `GUIDE.md`
- `GUIDE.md` tells an assistant how to join an invite (open the exact URL, type their own name, press 进入小屋, do not send a separate POST, do not pick 嘉怡 or 宝宝)

---

## 4. What not to add unless asked

- A chatbot
- Payments
- Social login
- A public feed or room discovery
- A game engine, inventory, coins, XP, or a leaderboard
- A second gift section beside Come Closer
- A giant profile form on the corner

A room password was in the original idea list and is still not built.

---

## 5. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3.x, App Router |
| UI | React 19, Tailwind CSS v4 via `@tailwindcss/postcss` |
| Language | TypeScript |
| Fonts | Nunito and Noto Sans SC |
| Persistence | `data/rooms.json` plus an in-memory cache, and a full-room backup in each phone's `localStorage` |
| Auth | None. Room name + display name |
| Sync | Poll about every 2.5 seconds. No websockets |
| Clock | `Asia/Kuala_Lumpur` |
| Host | Render Free, Singapore, Blueprint in `render.yaml` |
| Package manager | npm |
| Node | `>=20 <26` |

Scripts:

```bash
npm install
npm run dev      # next dev --turbopack
npm run build    # next build --webpack
npm start
```

Production build must stay `next build --webpack`. Turbopack plus PostCSS/Tailwind failed on Render. Tailwind packages are in `dependencies` because a production install can skip devDependencies. The Render build command is `npm install --include=dev && npm run build`. Do not set `NODE_ENV=production` in a way that skips that install. Health check: `GET /api/health`.

`render.yaml`: web service `lazy-cat-den`, runtime node, plan free, region singapore, start `npm start`, health `/api/health`.

---

## 6. Routes

### Pages

- `/` — door. `force-dynamic`. Reads `?room=` and `?joined=`
- `/guide` — short 怎么玩
- `/guide/helpers` — assistant guide
- `/room/[room]` — cottage
- `/room/[room]/chat`
- `/room/[room]/qa`
- `/room/[room]/draw`
- `/room/[room]/wishlist`
- `/room/[room]/cat`
- `/room/[room]/letter`
- `/room/[room]/today`
- `/room/[room]/calendar`
- `/room/[room]/corner`
- `/room/[room]/memories`

Room layout decodes the room id and wraps every room page in `RoomShell`. If the session is missing or the room does not match, the shell sends the browser to `/?room=`.

### APIs

- `GET /api/health` → `{ ok: true, name: "懒猫小屋", english: "Lazy Cat Den" }`
- `GET /api/rooms/[room]` → the room JSON. If the `lcd-session` cookie is for this room, this also updates that person's `lastSeen` and visit day, then saves. It does not add mood
- `POST /api/rooms/[room]` → JSON action, returns the whole room
- `POST /api/join` → form fields `room` and `displayName`. Joins, sets the cookie, 303 back to the door

`POST` body `{ type: "restore", room: <Room> }` is special. It is not a normal `RoomAction`. The server sanitizes the snapshot and merges it into the live room. Lists are capped. A snapshot with no members and no content is ignored.

---

## 7. Data model

Source of truth for shapes: `lib/types.ts`.

```ts
Room {
  id, createdAt
  members: Member[]
  questions, wishlist, notes, messages, draws, letters
  daily, events, gifts, memories, pats
  cat: { mood, lastPat, lastCheckin, decayAppliedOn }
}

Member {
  displayName, lastSeen, statusId, visitDays
  profile: {
    gender, signature, vibes, formId,
    thinking, need, want,   // the corner shows thinking as 此刻
    pocket,                 // food, music, game, animal, color, drink
    wall, objects,
    knowMe: { promptId, answer }[]
    guesses: { target, promptId, correct, at }[]
  }
}

Gift {
  id, from, to, kind, createdAt, note?
}
```

Empty profile defaults (`lib/profile.ts`): gender and signature blank, form `sleepy`, wall `cozy`, empty lists.

### Actions

Every normal action includes `displayName`. The client hook adds it. The server trims it and rejects a bad name.

| type | extra fields |
|---|---|
| `join`, `checkin` | — |
| `pat` | — |
| `ask` | `question` |
| `answer` | `questionId`, `answer` |
| `addWish` | `text` |
| `toggleWish`, `removeWish` | `wishId` |
| `draw` | `drawType` — UI uses `plan`, `who`, `sweet` |
| `addNote` | `text` |
| `removeNote` | `noteId` |
| `sendChat` | `text` |
| `setStatus` | `statusId` — feelings or the older couple statuses |
| `sendLetter` | `text` |
| `openLetter` | `letterId` |
| `answerDaily` | `text` |
| `addEvent` | `date`, `eventType`, `title` |
| `removeEvent` | `eventId` |
| `setVibes` | `vibes` |
| `setForm` | `formId` |
| `setThoughts` | `thinking`, `need`, `want` |
| `setGender` | `gender` |
| `setSignature` | `signature` |
| `setPocket` | `key`, `value` |
| `setCorner` | `wall`, `objects` |
| `setKnowMe` | `promptId`, `answer` |
| `guessKnowMe` | `target`, `promptId`, `guess` |
| `gift` | `target`, `kind`, optional `note` |
| `restore` | `room` (full snapshot, not a `RoomAction`) |

Length caps: name 24, signature / pocket / Know Me / guess 40, thoughts 80 each, wish 120, note 180, chat 200, question and letter and daily answer 280, Q&A answer 400, event title 80, Come Closer note 80. Lists: questions, wishes, events, memories 80; messages 80; draws and pats 40; notes 24; letters 12; gifts 30; daily days 60; vibes 5; corner objects 6.

---

## 8. How sync and saving work

Two phones must see one room.

### Server

- `lib/store.ts` keeps rooms in memory on `globalThis` and in `data/rooms.json`
- A promise lock serializes get, presence, actions, and restore
- `loadRoom` always reads the disk and merges it with memory. Memory must not skip the disk
- `saveRoom` reads the disk again and merges before writing. Write is a temp file, then rename
- Merge keeps both sides:
  - members union by display name
  - visit days union
  - pocket keys: a non-empty value wins; a newer empty value does not wipe a filled one
  - Know Me answers union by prompt id
  - guesses keep the later `at`
  - questions keep an answer if either copy has one
  - letters keep `openedAt` if either copy has it
  - wishes stay done if either copy is done
  - daily answers keep the later text per name
  - other lists union by id
  - cat mood, `lastPat`, and `lastCheckin` take the max
  - a default cat form `sleepy` or wall `cozy` does not replace a real choice
- GET does not rewrite the whole file on every poll. The presence update merges `lastSeen` and today's visit day. It does not add mood

### Phone backup

Render Free sleeps after about 15 minutes and the disk is wiped on sleep, restart, and redeploy. The JSON file alone will forget the room.

Each phone stores the latest full room in `localStorage` under `lazy-cat-den-room:` plus the room id (`lib/backup.ts`).

On each poll, if that backup has members, messages, pocket text, signatures, answers, or anything else the server is missing, the phone `POST`s `restore`. The server merges. It does not replace. A poorer server response does not overwrite a richer backup.

Signature, the four favorites, and 此刻 autosave while typing. Know Me and the older need/want fields still autosave if something writes them.

What this cannot do: if the server already forgot the room before either phone ran this backup code, there is nothing to restore. After both phones have opened the updated site once, later sleeps can be filled back in from whichever phone opens first.

### Client poll

`lib/use-room.ts` loads the room every 2.5 seconds. A write bumps a revision so a slower poll does not paint over the response you just got. Until your name is in `members`, the client sends `checkin` about every 4 seconds. That check-in does raise mood, so it stops once you are listed.

Come Closer, a pat, and sending a chat update the screen before the poll comes back.

---

## 9. Files

```
app/
  page.tsx                     Door
  layout.tsx                   Fonts, metadata
  globals.css                  Pink/cream tokens, sky, cottage, focus, reduced motion
  icon.svg
  guide/page.tsx               Short 怎么玩
  guide/helpers/page.tsx       Renders GUIDE.md
  api/health/route.ts
  api/join/route.ts            Form join + cookie
  api/rooms/[room]/route.ts    GET, POST, restore
  room/[room]/layout.tsx       RoomShell
  room/[room]/page.tsx         CottageRoom
  room/[room]/chat/page.tsx
  room/[room]/qa/page.tsx
  room/[room]/draw/page.tsx    Three jars
  room/[room]/wishlist/page.tsx
  room/[room]/cat/page.tsx
  room/[room]/letter/page.tsx
  room/[room]/today/page.tsx
  room/[room]/calendar/page.tsx
  room/[room]/corner/page.tsx  Snapshot + edit sheet
  room/[room]/memories/page.tsx

components/
  JoinForm.tsx
  RoomShell.tsx                Header, clock, sky, room context
  Sidebar.tsx                  Laptop navigation
  BottomNav.tsx                Phone navigation
  CottageRoom.tsx              The room, seats, object icons
  ComeCloser.tsx               靠近一点
  CatMascot.tsx                Sitting cat

lib/
  store.ts                     File store, merge, actions
  backup.ts                    Phone copy of the whole room
  use-room.ts                  Poll, restore, actions
  use-now.ts                   Clock tick
  time.ts                      Asia/Kuala_Lumpur date and hour
  session.ts                   localStorage + lcd-session cookie
  constants.ts                 Names, draws, feelings, closer, pocket
  types.ts
  profile.ts                   emptyProfile()
  cottage.ts                   Sky, presence, streak, speech, moments, decor

data/rooms.json                Runtime. Gitignored
render.yaml
GUIDE.md                       Long assistant guide
README.md                      Install, tunnel, Render
project-brief.md               This file
ideas/                         Notes and old requests. Not the app
```

Motion: the cat floats, a pat wiggles, notes pop in, and a Come Closer line rises and fades.

---

## 10. Deploy

Local:

```bash
npm install
npm run dev
```

A temporary public test from this PC:

```bash
npm run build
npm start
cloudflared tunnel --url http://localhost:3000
```

The tunnel dies when the PC or the process stops.

Render:

- Service name `lazy-cat-den`
- URL https://lazy-cat-den.onrender.com
- Free plan sleeps. The first open after sleep can take about a minute
- Disk is ephemeral. Durability for the couple is the phone backup in section 8, not the Render disk
- A shared database would be the later replacement for `lib/store.ts` if the phone backup is not enough
- Do not move this file store to Vercel serverless and expect one shared room. Instances do not share a disk

---

## 11. Bugs already fixed

1. Render build crashed in Turbopack/PostCSS/Tailwind. Production build is webpack. Tailwind is a real dependency. The build installs before `npm run build`.
2. Polling rewrote `rooms.json` and dropped the second person. GET no longer clobbers. Saves merge.
3. The cottage painted a fake local member, so the screen showed two people while draw still said it needed two. The seats are the server's people. Presence is recorded on the poll itself.
4. Refresh asked for the name again, and an invite cleared a saved name. Session is a cookie and `localStorage`. A matching invite re-enters.
5. Invite links could show the default room or the 嘉怡/宝宝 chips. An invite locks the room and asks for the visitor's own name.
6. The name `Unknown` could join and show up in the story. Those names are rejected and stripped.
7. Pocket values and Know Me answers could vanish in a merge, or the inputs kept the first person's empty `defaultValue`. Merge keeps non-empty pocket and Know Me answers.
8. Memories were only a few first-time lines and could not be opened. They now record later actions and link to the page.
9. Cat pats had no history. The cat page lists who patted and when.
10. The cottage cat had the literal word "cloud" on both sides. That label is gone.
11. Signatures were only an edit box on your own corner, so the other person had no signature line. They show on both seats and on the other person's corner.
12. Render Free forgot the whole room on sleep. Each phone keeps a full copy and merges it back with `restore`. Profile text autosaves.
13. "Today" used UTC, so a morning in Malaysia could still be yesterday. Dates, the daily prompt, the streak, and day/night now follow Asia/Kuala_Lumpur, and the header clock keeps moving.

---

## 12. How to change this project

1. Keep the couple tone. The cottage should stay a room, not a dashboard of tools.
2. Keep one shared room document. Do not show a person the server does not have.
3. New room data goes through `lib/store.ts` and must merge. A save must not drop the other phone's members, messages, pocket, or signature.
4. Do not raise cat mood from the poll.
5. New dates and "today" go through `lib/time.ts`. Do not use `toISOString().slice(0, 10)` for a calendar day.
6. Production build stays `next build --webpack`.
7. Phone and laptop both need a real layout. Soft pink and cream.
8. Do not add a chatbot, payments, social login, or a second gift system unless asked.
9. Render Free will still sleep. Anything that must survive that has to be in the phone backup, or in a real database later.

---

## 13. Short summary

懒猫小屋 / Lazy Cat Den is a Next.js 16 couple app. Two people join one room (often `jiayi-and-me`, names `嘉怡` and `宝宝`) over HTTPS at https://lazy-cat-den.onrender.com. The home is a cottage with a window, two seats, a sitting cat, and drawn objects for the letter, questions, draws, wishes, calendar, today, and the story. 靠近一点 sends a hug, kiss, hands, cuddle, flower, cookie, or a short note to the other person. Draw is three jars. The corner is a small snapshot: cat form, one feeling, a signature, one 此刻 line, and four favorites. A laptop gets a sidebar. A phone keeps the bottom tabs. The clock and "today" follow Malaysia time. The room polls every few seconds. Render Free forgets its disk when it sleeps, so each phone keeps a full copy and merges it back.
