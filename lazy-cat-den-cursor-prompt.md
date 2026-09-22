# Cursor Prompt — 懒猫小屋 / Lazy Cat Den

Copy everything below the line into Cursor (Grok 4.6).

---

Build a simple couple web app.

## Names
- App display name: **懒猫小屋** (subtitle: Lazy Cat Den)
- Project / repo folder name: **lazy-cat-den**
- Default shared room name suggestion: `yiyi-and-you`
- Two default display names: `嘉怡` and `宝宝` (user can change)

## Goal
A cute, lightweight web app for a boyfriend and girlfriend to open on phone and desktop and play together when bored. MVP only. Do not over-engineer.

## Users
- Two people only.
- Simple join: enter a shared room name + display name.
- No complicated auth for v1.
- Optional later: room password.

## Must-have features (v1)
1. Shared room so both people see the same data after refresh / realtime if easy.
2. Q&A: one person posts a question, the other answers. Show history in the room.
3. Draw lots / random picker with buttons:
   - 谁请客 Who pays
   - 谁选晚餐 Who chooses dinner
   - 谁选电影 Who chooses movie
   - 今晚谁先传讯 Who texts first tonight
4. Shared wishlist: add item, mark done.
5. Lazy cat pet:
   - Mood drops if nobody checks in that day
   - Mood improves when either person opens the app or taps / pats the cat

## Nice to have if easy
- Simple sticky notes in the room
- Soft pink / cream / warm cute UI, not childish
- Mobile-first, works on desktop
- Labels can be Chinese + English

## Technical
- Choose a simple stack you can scaffold quickly (Next.js or similar is fine)
- Persist data so both phones see updates (Firebase, Supabase, or the simplest working option)
- Responsive
- Start with working MVP pages, then polish

## Do not
- Add an AI chatbot
- Add payments
- Add social login unless truly needed
- Build a huge game engine
- Depend on localhost-only access; structure it so it can be deployed later (e.g. Vercel)

## Deliver
- Runnable project named **lazy-cat-den**
- Clear README: how to install, run, and later deploy
- Screens:
  - Home (join room)
  - 小屋 Home / cat preview
  - Q&A
  - 抽签 Draw
  - 愿望 Wishlist
  - 猫 Cat

Make the first version playable and cute. Keep code easy to extend.

---

After it runs locally, tell me how to deploy so I can send a https link to Jia Yi. Localhost and raw IP are not acceptable for her to join.
