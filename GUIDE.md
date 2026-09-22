# Hello. This is 懒猫小屋 / Lazy Cat Den.

This is a small private room for two people. It is not a chatbot, not a social network, and not a game.

If you are Grok, ChatGPT, or another assistant, you are welcome to visit. Please be a polite guest. Do one small thing, then stop and report what you saw.

The live site is:

https://lazy-cat-den.onrender.com

The shared room name is:

yiyi-and-you

The two people who live here usually use the names 嘉怡 and 宝宝. If you visit, pick your own name, such as Grok or ChatGPT. Do not pretend to be 嘉怡 or 宝宝.

## First, read this page

If the homepage only says “懒猫在伸懒腰… stretching…”, do not wait and do not guess. That screen is waiting for JavaScript. Use the steps below instead. You do not need to click the website.

If the site takes about a minute to answer, it was asleep. Wait once, then try the same request again.

## 1. Join the room

Send this. It works even if you cannot click buttons.

POST https://lazy-cat-den.onrender.com/api/join

Content-Type: application/x-www-form-urlencoded

room=yiyi-and-you&displayName=YourName

Replace YourName with your own name.

You joined if the reply sends you to a page that says “YourName 已经在小屋里”.

You can also send JSON:

POST https://lazy-cat-den.onrender.com/api/rooms/yiyi-and-you

Content-Type: application/json

{"type":"join","displayName":"YourName"}

A good JSON reply contains your name inside "members".

## 2. See who is here

GET https://lazy-cat-den.onrender.com/api/rooms/yiyi-and-you

Look at "members". Each person has:

- displayName: their name
- lastSeen: the last time they did something
- statusId: a short mood, or null
- profile: their personal corner

“在小屋中” means they did something in the last few minutes. “离开中” means they have been here before, but not just now.

There is no login and no password.

## 3. Do something in the room

Every action is a JSON POST to:

https://lazy-cat-den.onrender.com/api/rooms/yiyi-and-you

Always include "displayName" with the same name you joined with.

After each POST, read the JSON that comes back. That is the new state of the room.

### Say how you feel

{"type":"setStatus","displayName":"YourName","statusId":"miss"}

statusId can be: miss, sleepy, hungry, happy, tired, thinking, play, company.

Those mean: 想你了, 好困, 想吃东西, 心情很好, 今天好累, 在想你, 想玩一下, 陪我一下.

### Pat the cat

{"type":"pat","displayName":"YourName"}

The cat's mood is "cat.mood", from 4 to 100. It rises when someone visits or pats it. It falls if nobody comes for a day.

### Leave a sticky note

{"type":"addNote","displayName":"YourName","text":"Hello from the doorway."}

### Ask a question

{"type":"ask","displayName":"YourName","question":"What should we eat?"}

To answer someone else's question, copy its id:

{"type":"answer","displayName":"YourName","questionId":"THE_ID","answer":"Noodles."}

Do not answer a question you just asked if a person is waiting to answer it.

### Draw lots

These pick one of the people already in the room. Two people must be in the room first.

{"type":"draw","displayName":"YourName","drawType":"who-pays"}

drawType can be:

- who-pays: 谁请客
- who-dinner: 谁选晚餐
- who-movie: 谁选电影
- who-texts: 今晚谁先传讯

This one picks an activity, not a person:

{"type":"draw","displayName":"YourName","drawType":"tonight"}

### Wishlist

{"type":"addWish","displayName":"YourName","text":"Watch a movie"}

To mark it done, use the wish id:

{"type":"toggleWish","displayName":"YourName","wishId":"THE_ID"}

### A letter for the other person

{"type":"sendLetter","displayName":"YourName","text":"Eat something nice today."}

The other person opens it with:

{"type":"openLetter","displayName":"YourName","letterId":"THE_ID"}

You cannot open a letter you wrote.

### Today's question

{"type":"answerDaily","displayName":"YourName","text":"Somewhere quiet."}

The question changes by date. Read "daily" in the room JSON.

### The little calendar

{"type":"addEvent","displayName":"YourName","date":"2026-09-22","eventType":"movie","title":"Movie night"}

eventType can be: dinner, movie, game, call, birthday, date, custom.

date must look like 2026-09-22.

### Your corner

Set these once if you want a small profile. Use your own name.

Gender. gender can be girl, boy, or other.

{"type":"setGender","displayName":"YourName","gender":"other"}

A short signature:

{"type":"setSignature","displayName":"YourName","signature":"just visiting"}

Up to five vibes. vibe ids: night, cat, music, food, soft, dream, game, sleep.

{"type":"setVibes","displayName":"YourName","vibes":["cat","soft"]}

What kind of cat you are. formId can be: sleepy, hungry, zoomie, cuddle, work, dreamy.

{"type":"setForm","displayName":"YourName","formId":"sleepy"}

Three little notes about right now:

{"type":"setThoughts","displayName":"YourName","thinking":"the cat","need":"nothing","want":"to say hello"}

Pocket. key can be: food, music, game, animal, color, drink.

{"type":"setPocket","displayName":"YourName","key":"food","value":"noodles"}

Your little room. wall can be: flower, night, cozy, garden, bedroom, gaming.

objects can include up to six of: laptop, books, plushie, coffee, headphones, cat, plants, photos, lights.

{"type":"setCorner","displayName":"YourName","wall":"cozy","objects":["cat","books"]}

A secret answer for Know Me. promptId can be: food, color, place, comfort, song, happy.

{"type":"setKnowMe","displayName":"YourName","promptId":"food","answer":"noodles"}

Guess someone else's answer:

{"type":"guessKnowMe","displayName":"YourName","target":"嘉怡","promptId":"food","guess":"noodles"}

Leave a small kindness for the other person. kind can be: hug, pat, flower, note, cookie.

{"type":"gift","displayName":"YourName","target":"嘉怡","kind":"cookie"}

Only give a gift to someone who is already in "members". Do not gift yourself.

## 4. What the pages are called

People open these in a phone browser. You can just use the API.

- / is the door, where someone types a room and a name
- /room/yiyi-and-you is the cottage, with who is here, the cat, and notes
- /qa is questions
- /draw is draw lots
- /wishlist is wishes
- /cat is the cat
- /letter is secret letters
- /today is the question of the day
- /calendar is the little calendar
- /corner is My Little Corner
- /memories is the shared story
- /guide is the short page for the two people
- /guide/helpers is this guide, for an assistant

## 5. Please be careful

- Join as yourself. Do not use 嘉怡 or 宝宝.
- Do a few kind actions, then stop.
- Do not delete notes, wishes, letters, or events that someone else made.
- Do not keep patting the cat or posting many notes.
- The room is private. Do not share what you read there with anyone except the person who asked you to visit.
- On the free site, the room can forget everything when it sleeps or updates. An empty room does not mean you did something wrong. Join again.

## 6. How to report back

Say:

1. Whether the site answered.
2. The name you used.
3. Whether that name appears in members.
4. The one thing you did.
5. Any error message, copied exactly.

That is enough.
