export const APP_NAME_ZH = "懒猫小屋";
export const APP_NAME_EN = "Lazy Cat Den";
export const DEFAULT_ROOM = "yiyi-and-you";
export const DEFAULT_NAMES = ["嘉怡", "宝宝"] as const;

export const DRAW_TYPES = [
  { id: "who-pays", zh: "谁请客", en: "Who pays", emoji: "🍜", kind: "person" },
  { id: "who-dinner", zh: "谁选晚餐", en: "Who chooses dinner", emoji: "🍱", kind: "person" },
  { id: "who-movie", zh: "谁选电影", en: "Who chooses movie", emoji: "🎬", kind: "person" },
  { id: "who-texts", zh: "今晚谁先传讯", en: "Who texts first tonight", emoji: "💌", kind: "person" },
  { id: "who-cooks", zh: "谁做饭", en: "Who cooks", emoji: "🍳", kind: "person" },
  { id: "who-song", zh: "谁选歌", en: "Who picks the song", emoji: "🎵", kind: "person" },
  { id: "who-game", zh: "谁选游戏", en: "Who picks the game", emoji: "🎮", kind: "person" },
  { id: "who-dessert", zh: "谁选甜品", en: "Who picks dessert", emoji: "🍰", kind: "person" },
  { id: "who-photo", zh: "谁先拍照", en: "Who takes the photo", emoji: "📷", kind: "person" },
  { id: "who-plan", zh: "谁安排今天", en: "Who plans today", emoji: "📅", kind: "person" },
  { id: "who-hug", zh: "谁先抱一下", en: "Who hugs first", emoji: "🤗", kind: "person" },
  { id: "who-walk", zh: "谁说出发", en: "Who says let's go", emoji: "👟", kind: "person" },
  { id: "dinner", zh: "今晚吃什么", en: "What's for dinner", emoji: "🍲", kind: "jar", jar: "dinner" },
  { id: "movie-night", zh: "看什么", en: "What to watch", emoji: "🍿", kind: "jar", jar: "movie" },
  { id: "drink", zh: "喝什么", en: "What to drink", emoji: "🧋", kind: "jar", jar: "drink" },
  { id: "snack", zh: "吃什么零食", en: "What snack", emoji: "🍪", kind: "jar", jar: "snack" },
  { id: "date", zh: "约会做什么", en: "Date idea", emoji: "🌷", kind: "jar", jar: "date" },
  { id: "weekend", zh: "周末做什么", en: "Weekend plan", emoji: "🌤", kind: "jar", jar: "weekend" },
] as const;

export const TONIGHT_IDEAS = [
  { id: "movie", zh: "一起看电影", en: "Watch a movie" },
  { id: "roblox", zh: "一起玩 Roblox", en: "Play Roblox together" },
  { id: "eat", zh: "找点东西吃", en: "Find something to eat" },
  { id: "music", zh: "一起听音乐", en: "Listen to music" },
  { id: "call", zh: "打个电话", en: "Call each other" },
  { id: "photo", zh: "交换一张照片", en: "Exchange a photo" },
  { id: "questions", zh: "互相问三个问题", en: "Ask each other 3 questions" },
  { id: "nothing", zh: "什么都不做", en: "Do absolutely nothing" },
] as const;

export const DRAW_JARS = {
  dinner: [
    { zh: "火锅", en: "Hotpot" },
    { zh: "拉面", en: "Ramen" },
    { zh: "炒饭", en: "Fried rice" },
    { zh: "披萨", en: "Pizza" },
    { zh: "寿司", en: "Sushi" },
    { zh: "鸡排", en: "Chicken chop" },
    { zh: "粥", en: "Porridge" },
    { zh: "烧烤", en: "Grill" },
    { zh: "马来餐", en: "Malaysian food" },
    { zh: "随便吃", en: "Whatever is easy" },
  ],
  movie: [
    { zh: "喜剧", en: "Comedy" },
    { zh: "爱情", en: "Romance" },
    { zh: "动画", en: "Animation" },
    { zh: "悬疑", en: "Mystery" },
    { zh: "重看一部老片", en: "Rewatch an old one" },
    { zh: "短片就好", en: "Something short" },
  ],
  drink: [
    { zh: "奶茶", en: "Milk tea" },
    { zh: "咖啡", en: "Coffee" },
    { zh: "汽水", en: "Soda" },
    { zh: "热水", en: "Hot water" },
    { zh: "果汁", en: "Juice" },
  ],
  snack: [
    { zh: "薯条", en: "Fries" },
    { zh: "饼干", en: "Cookies" },
    { zh: "冰淇淋", en: "Ice cream" },
    { zh: "水果", en: "Fruit" },
    { zh: "巧克力", en: "Chocolate" },
  ],
  date: [
    { zh: "散步", en: "Take a walk" },
    { zh: "看电影", en: "Watch a movie" },
    { zh: "一起打游戏", en: "Play a game" },
    { zh: "吃甜的", en: "Get something sweet" },
    { zh: "待在家里", en: "Stay home" },
    { zh: "打个电话", en: "Call each other" },
  ],
  weekend: [
    { zh: "睡懒觉", en: "Sleep in" },
    { zh: "出门吃饭", en: "Eat out" },
    { zh: "看电影", en: "Watch a movie" },
    { zh: "什么都不做", en: "Do nothing" },
    { zh: "去逛一下", en: "Wander around" },
  ],
} as const;

export const COUPLE_STATUSES = [
  { id: "miss", zh: "想你了", en: "Missing you" },
  { id: "sleepy", zh: "好困", en: "Sleepy" },
  { id: "hungry", zh: "想吃东西", en: "Hungry" },
  { id: "happy", zh: "心情很好", en: "Feeling good" },
  { id: "tired", zh: "今天好累", en: "Tired today" },
  { id: "thinking", zh: "在想你", en: "Thinking of you" },
  { id: "play", zh: "想玩一下", en: "Want to play" },
  { id: "company", zh: "陪我一下", en: "Stay with me" },
] as const;

export const VIBES = [
  { id: "night", zh: "夜猫子", en: "Night owl" },
  { id: "cat", zh: "猫派", en: "Cat person" },
  { id: "music", zh: "音乐脑袋", en: "Music" },
  { id: "food", zh: "吃货", en: "Food hunter" },
  { id: "soft", zh: "心软", en: "Soft-hearted" },
  { id: "dream", zh: "爱做梦", en: "Dreamer" },
  { id: "game", zh: "游戏", en: "Gamer" },
  { id: "sleep", zh: "爱睡觉", en: "Sleepyhead" },
] as const;

export const GENDERS = [
  { id: "girl", zh: "女生", en: "Girl" },
  { id: "boy", zh: "男生", en: "Boy" },
  { id: "other", zh: "其他", en: "Other" },
] as const;

export const CAT_FORMS = [
  { id: "sleepy", zh: "困困猫", en: "Sleepy Cat", line: "想躺下" },
  { id: "hungry", zh: "饿饿猫", en: "Hungry Cat", line: "想吃东西" },
  { id: "zoomie", zh: "疯跑猫", en: "Zoomie Cat", line: "停不下来" },
  { id: "cuddle", zh: "贴贴猫", en: "Cuddle Cat", line: "想被抱一下" },
  { id: "work", zh: "打工猫", en: "Work Cat", line: "在忙" },
  { id: "dreamy", zh: "做梦猫", en: "Dreamy Cat", line: "在发呆" },
] as const;

export const DAILY_PROMPTS = [
  { id: "anywhere", cat: "relationship", zh: "如果我们现在可以瞬间去任何地方，你想带我去哪里？", en: "If we could go anywhere right now, where would you take me?" },
  { id: "first", cat: "relationship", zh: "你对我的第一印象是什么？", en: "What was your first impression of me?" },
  { id: "little", cat: "relationship", zh: "我做的哪件小事会让你开心？", en: "What little thing I do makes you happy?" },
  { id: "cat-name", cat: "funny", zh: "如果我变成一只猫，你会给我取什么名字？", en: "If I became a cat, what would you name me?" },
  { id: "together", cat: "deep", zh: "有什么事是你想我们一起经历的？", en: "What's something you want us to experience together?" },
  { id: "rm50", cat: "random", zh: "我们有 RM50，要买什么？", en: "We have RM50. What are we buying?" },
] as const;

export const EVENT_TYPES = [
  { id: "dinner", zh: "晚餐", en: "Dinner", mark: "食" },
  { id: "movie", zh: "电影", en: "Movie", mark: "影" },
  { id: "game", zh: "游戏", en: "Game", mark: "玩" },
  { id: "call", zh: "通话", en: "Call", mark: "话" },
  { id: "birthday", zh: "生日", en: "Birthday", mark: "生" },
  { id: "date", zh: "约会", en: "Date", mark: "♥" },
  { id: "custom", zh: "自定义", en: "Custom", mark: "★" },
] as const;

export const POCKET_KEYS = [
  { id: "food", zh: "最喜欢的食物", en: "Favourite food" },
  { id: "music", zh: "最喜欢的歌", en: "Favourite music" },
  { id: "game", zh: "最喜欢的游戏", en: "Favourite game" },
  { id: "animal", zh: "最喜欢的动物", en: "Favourite animal" },
  { id: "color", zh: "最喜欢的颜色", en: "Favourite colour" },
  { id: "drink", zh: "最喜欢的饮料", en: "Favourite drink" },
] as const;

export const WALLS = [
  { id: "flower", zh: "花墙", en: "Flower wall" },
  { id: "night", zh: "夜空", en: "Night sky" },
  { id: "cozy", zh: "软软的房间", en: "Cozy room" },
  { id: "garden", zh: "小花园", en: "Garden" },
  { id: "bedroom", zh: "可爱卧室", en: "Cute bedroom" },
  { id: "gaming", zh: "游戏角落", en: "Gaming corner" },
] as const;

export const CORNER_OBJECTS = [
  { id: "laptop", zh: "电脑", en: "Laptop" },
  { id: "books", zh: "书", en: "Books" },
  { id: "plushie", zh: "玩偶", en: "Plushie" },
  { id: "coffee", zh: "咖啡", en: "Coffee" },
  { id: "headphones", zh: "耳机", en: "Headphones" },
  { id: "cat", zh: "猫", en: "Cat" },
  { id: "plants", zh: "植物", en: "Plants" },
  { id: "photos", zh: "照片", en: "Photos" },
  { id: "lights", zh: "小灯", en: "Fairy lights" },
] as const;

export const KNOW_PROMPTS = [
  { id: "food", zh: "最喜欢吃什么？", en: "Favourite food" },
  { id: "color", zh: "最喜欢的颜色？", en: "Favourite colour" },
  { id: "place", zh: "想去的地方？", en: "Dream destination" },
  { id: "comfort", zh: "治愈食物？", en: "Comfort food" },
  { id: "song", zh: "最近在听的歌？", en: "Current favourite song" },
  { id: "happy", zh: "什么会让你开心？", en: "What makes you happy" },
] as const;

export const FEELINGS = [
  { id: "glad", zh: "很开心", en: "Happy" },
  { id: "weary", zh: "好累", en: "Tired" },
  { id: "longing", zh: "想你", en: "Missing you" },
  { id: "peckish", zh: "想吃东西", en: "Hungry" },
  { id: "playful", zh: "想玩", en: "Want to play" },
  { id: "quiet", zh: "安静一下", en: "Need quiet" },
] as const;

export const PLAN_DRAWS = [
  { zh: "吃点什么", en: "Something to eat", jars: ["dinner", "snack", "drink"] },
  { zh: "看什么", en: "Something to watch", jars: ["movie"] },
  { zh: "玩什么", en: "Something to play", picks: ["一起打游戏", "一起玩 Roblox", "散步", "待在家里"] },
  { zh: "听什么", en: "Something to hear", picks: ["一起听音乐", "安静地听一会儿", "交换一首歌"] },
  { zh: "出门还是宅家", en: "Out or home", picks: ["出门走走", "待在家里", "去逛一下"] },
  { zh: "随机约会", en: "A random date", jars: ["date", "weekend"] },
] as const;

export const WHO_DRAWS = [
  { zh: "谁选晚餐", en: "Who picks dinner" },
  { zh: "谁选电影", en: "Who picks the movie" },
  { zh: "谁选游戏", en: "Who picks the game" },
  { zh: "谁选歌", en: "Who picks the song" },
  { zh: "谁安排今天", en: "Who plans today" },
  { zh: "谁先发消息", en: "Who texts first" },
] as const;

export const SWEET_DRAWS = [
  { zh: "抱一下", en: "A hug" },
  { zh: "亲亲", en: "A kiss" },
  { zh: "牵手一下", en: "Hold hands" },
  { zh: "摸摸头", en: "A head pat" },
  { zh: "说一句喜欢你的话", en: "Say you like them" },
  { zh: "互相发一张照片", en: "Send each other a photo" },
] as const;

export const GIFT_KINDS = [
  { id: "hug", zh: "抱抱", en: "Hug", line: "抱了你一下" },
  { id: "kiss", zh: "亲亲", en: "Kiss", line: "亲了你一下" },
  { id: "hand", zh: "牵手", en: "Hold hands", line: "牵了你的手" },
  { id: "cuddle", zh: "贴贴", en: "Cuddle", line: "贴了贴你" },
  { id: "flower", zh: "送花", en: "Flower", line: "送了你一朵花" },
  { id: "cookie", zh: "小饼干", en: "Cookie", line: "给了你一块饼干" },
  { id: "note", zh: "留句话", en: "A note", line: "留了句话" },
  { id: "pat", zh: "摸了摸", en: "Pat", line: "摸了摸你" },
] as const;

export const CLOSER_KINDS = GIFT_KINDS.filter((item) => item.id !== "pat");

export const ONLINE_MS = 3 * 60 * 1000;

export const NOTE_COLORS = [
  "#F8E1B0",
  "#F5C6CE",
  "#D4E5C5",
  "#D5E3F0",
  "#E8D5F2",
];

export const SESSION_KEY = "lazy-cat-den-session";

export function slugifyRoom(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .slice(0, 48);
}
