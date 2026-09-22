# 懒猫小屋 / Lazy Cat Den

A tiny couple web app for two people. Share one room name, then play with Q&A, draws, a wishlist, sticky notes, and a lazy cat whose mood depends on whether anyone showed up today.

## Features (v1)

- Join with a shared room name + display name (no login)
- Shared room data (both phones see the same room after refresh, and while this server is running)
- Q&A
- Draw lots: who pays / dinner / movie / who texts first
- Wishlist
- Lazy cat (mood drops if nobody checks in; improves when you open the app or pat it)
- Sticky notes on the cottage home

Default room suggestion: `yiyi-and-you`  
Default names: `嘉怡` and `宝宝`

## Install and run locally

You need Node.js 18+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production-style local run:

```bash
npm run build
npm start
```

## HTTPS (so someone else can join, not localhost)

Jia Yi cannot join `localhost` or a raw LAN IP. While this computer is on, share an HTTPS tunnel.

1. Start the app: `npm run build` then `npm start` (port 3000).
2. In another terminal, start a Cloudflare quick tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

It prints an `https://….trycloudflare.com` link. Send that link plus the room name.

If `cloudflared` is missing on Windows:

```powershell
winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
```

The tunnel only works while this PC and the commands keep running. That is enough to test, and enough for both of you to join the same room.

## Deploy on Render (new account, free)

Render gives you an `https://….onrender.com` link. The **Free** plan is $0.

What you should expect on Free:

- After 15 minutes with no visitors, the app sleeps. The next visit takes about 1 minute to wake.
- Wishes, Q&A, notes, and cat mood are stored in a local file. On Free, that file is wiped whenever the app sleeps or redeploys. Fine for a first test. Not a forever home yet.

### 1. Put this project on GitHub

Render deploys from GitHub, not from a folder on your PC.

1. Create a GitHub account at [https://github.com/signup](https://github.com/signup) if you do not have one.
2. Click **New repository**.
3. Name it `lazy-cat-den`.
4. Leave it **Public** (easiest). Do not add a README (this folder already has one).
5. Click **Create repository**.
6. Upload this project (GitHub Desktop is easiest on Windows: File → Add local repository → this folder → publish).

### 2. Create a Render account

1. Open [https://dashboard.render.com/register](https://dashboard.render.com/register).
2. Click **GitHub** and allow Render to sign you in.
3. If GitHub asks which repos Render may see, choose **Only select repositories** and pick `lazy-cat-den`.

### 3. Create a Web Service

1. In Render, click **New** → **Web Service**.
2. Select the `lazy-cat-den` repo → **Connect**.
3. Fill the form:

| Field | Value |
|---|---|
| Name | `lazy-cat-den` |
| Language | Node |
| Branch | `main` |
| Region | Singapore (closest) |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Instance type | **Free** |

4. Click **Advanced** and add:

- Health check path: `/api/health`

5. Click **Create Web Service**. Do not add a credit card for Free.

### 4. Wait, then open the link

The first build takes a few minutes. When it says **Live**, open:

`https://lazy-cat-den.onrender.com`

(The exact URL is on the service page.) Send that HTTPS link plus room name `yiyi-and-you` to Jia Yi.

Later pushes to GitHub’s `main` branch redeploy automatically.

If the first visit looks stuck, wait about a minute — Free is spinning the service up.

## Project layout

- `app/page.tsx` — join room
- `app/room/[room]/` — cottage, Q&A, draw, wishlist, cat
- `app/api/rooms/[room]/route.ts` — shared room API
- `lib/store.ts` — JSON persistence
- `data/rooms.json` — created automatically at runtime
