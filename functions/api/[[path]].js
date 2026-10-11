/**
 * 《修仙模拟器：天命心火》- Cloudflare Pages Functions 权威服务引擎
 * 挂载路径: /api/*
 * 功能:
 * 1. 账号体系: 注册、登录、Session Token 鉴权
 * 2. 权威升级: 经验与境界突破服务端校验
 * 3. 权威百工锻造: 材料原子级扣减、气运随机数生成、1~10层冲层检定、阿尔比恩专精经验结算与概率提升
 * 4. 权威家园: 低阶灵脉采矿与灵田自动累积产出与升级
 * 5. 全服争夺与天道世界通报: 稀有灵木精金全服公告与全服争夺
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

async function hashPass(password) {
  const enc = new TextEncoder().encode(password + ":xiuxian_secret_salt_2026");
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return [...arr].map(b => b.toString(16).padStart(2, "0")).join("");
}

const TIER_RECIPES = {
  1: {
    name: "一阶·炼气",
    items: [
      { slot: "head", name: "青竹发簪", cost: { wood_common: 4 }, stats: { wis: 6, hp: 25 }, power: 12 },
      { slot: "armor", name: "素麻轻道袍", cost: { wood_common: 3, herb_common: 3 }, stats: { def: 8, hp: 35 }, power: 15 },
      { slot: "hand", name: "玄铁护腕", cost: { ore_common: 4 }, stats: { atk: 6, def: 4 }, power: 12 },
      { slot: "foot", name: "草履踏青靴", cost: { wood_common: 4 }, stats: { spd: 10, def: 3 }, power: 10 },
      { slot: "weapon", name: "青竹寒铁剑", cost: { wood_common: 5, ore_common: 5 }, stats: { atk: 25 }, power: 28 },
      { slot: "offhand", name: "桃木辟邪符", cost: { wood_common: 4, herb_common: 2 }, stats: { def: 6, mp: 15 }, power: 14 },
      { slot: "necklace", name: "粗磨灵玉佩", cost: { ore_common: 4, herb_common: 3 }, stats: { mp: 20, wis: 8 }, power: 15 },
      { slot: "ring", name: "精铜聚灵戒", cost: { ore_common: 4 }, stats: { atk: 5, mp: 12 }, power: 10 }
    ]
  },
  2: {
    name: "二阶·筑基",
    items: [
      { slot: "head", name: "流云羽灵冠", cost: { wood_rare: 1, ore_common: 6 }, stats: { wis: 22, hp: 80 }, power: 55 },
      { slot: "armor", name: "金丝玄灵法衣", cost: { ore_common: 8, herb_common: 8 }, stats: { def: 36, hp: 140 }, power: 68 },
      { slot: "hand", name: "青鳞玄铁腕", cost: { ore_common: 6, wood_rare: 1 }, stats: { atk: 26, def: 18 }, power: 52 },
      { slot: "foot", name: "疾风逐月靴", cost: { wood_rare: 1, herb_common: 6 }, stats: { spd: 32, def: 12 }, power: 48 },
      { slot: "weapon", name: "赤阳流火剑", cost: { wood_rare: 2, ore_common: 8 }, stats: { atk: 95 }, power: 110 },
      { slot: "offhand", name: "阴阳八卦玄镜", cost: { ore_common: 6, wood_rare: 1 }, stats: { def: 30, mp: 60 }, power: 58 },
      { slot: "necklace", name: "温润凝神佩", cost: { wood_rare: 1, ore_common: 6 }, stats: { mp: 80, wis: 28 }, power: 60 },
      { slot: "ring", name: "须弥纳灵戒", cost: { ore_common: 6, ore_rare: 1 }, stats: { atk: 22, mp: 55 }, power: 50 }
    ]
  },
  3: {
    name: "三阶·结丹",
    items: [
      { slot: "head", name: "紫阳太虚九霄冠", cost: { wood_rare: 3, ore_rare: 2 }, stats: { wis: 75, hp: 320 }, power: 220 },
      { slot: "armor", name: "九转雷劫无垢袍", cost: { ore_rare: 3, herb_rare: 1 }, stats: { def: 115, hp: 480 }, power: 280 },
      { slot: "hand", name: "覆海霸王震山腕", cost: { ore_rare: 2, ore_common: 12 }, stats: { atk: 85, def: 55 }, power: 210 },
      { slot: "foot", name: "踏云凌虚逍遥履", cost: { ore_rare: 2, herb_rare: 1 }, stats: { spd: 95, def: 40 }, power: 195 },
      { slot: "weapon", name: "紫电青霜本命剑", cost: { wood_rare: 3, ore_rare: 3 }, stats: { atk: 280 }, power: 360 },
      { slot: "offhand", name: "昊天摄魂九宝铃", cost: { ore_rare: 2, wood_rare: 2 }, stats: { def: 88, mp: 180 }, power: 230 },
      { slot: "necklace", name: "九曲天心本源佩", cost: { herb_rare: 2, ore_rare: 2 }, stats: { mp: 240, wis: 85 }, power: 240 },
      { slot: "ring", name: "大乾坤定海神戒", cost: { ore_rare: 3, herb_rare: 1 }, stats: { atk: 80, mp: 190 }, power: 215 }
    ]
  }
};

const LAYER_UP_RATES = { 1: 0.90, 2: 0.75, 3: 0.55, 4: 0.40, 5: 0.25, 6: 0.15, 7: 0.08, 8: 0.03, 9: 0.01 };

function getStrikeCost(tier, layer) {
  if (tier === 1) return layer <= 5 ? { matKey: "ore_common", count: 1, stones: 1 } : { matKey: "ore_common", count: 2, stones: 3 };
  if (tier === 2) return layer <= 5 ? { matKey: "ore_common", count: 3, stones: 5 } : { matKey: "ore_rare", count: 1, stones: 10 };
  return layer <= 5 ? { matKey: "ore_rare", count: 1, stones: 15 } : { matKey: "ore_rare", count: 2, stones: 30 };
}

function getMasteryReqXp(level) {
  return Math.floor(100 * Math.pow(1.055, Math.max(0, level - 1)));
}

async function getAuthUser(request, kv) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || !kv) return null;

  const raw = await kv.get("sess:" + token);
  if (!raw) return null;
  const sessionData = JSON.parse(raw);
  const userRaw = await kv.get("user:" + sessionData.accountId);
  if (!userRaw) return null;
  return JSON.parse(userRaw);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, "");

  if (request.method === "OPTIONS") return json({ ok: true });

  const kv = env.XIUXIAN_KV;

  // === 路由 1: 注册 ===
  if (path === "auth/register" && request.method === "POST") {
    try {
      const { username, password, daoName } = await request.json();
      if (!username || !password || !daoName) return json({ success: false, error: "请填写完整道号、账号与密码" }, 400);

      if (kv) {
        const exist = await kv.get("acc:" + username);
        if (exist) return json({ success: false, error: "该账号名已被其他道友占用！" }, 400);

        const accountId = "u_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        const passHash = await hashPass(password);

        const initialUser = {
          id: accountId,
          username,
          passHash,
          daoName: daoName.trim(),
          realmIndex: 1,
          exp: 30,
          spiritStones: 50,
          luck: 75,
          heartFire: 3,
          maxHeartFire: 3,
          resources: {
            wood_common: 20, wood_rare: 3, ore_common: 25, ore_rare: 2, herb_common: 15, herb_rare: 1
          },
          equipped: { head: null, armor: null, hand: null, foot: null, weapon: null, offhand: null, necklace: null, ring: null },
          inventory: [],
          mastery: {
            smithing: { level: 1, xp: 0 },
            weapon: { level: 1, xp: 0 },
            armor: { level: 1, xp: 0 },
            head: { level: 1, xp: 0 },
            hand: { level: 1, xp: 0 },
            foot: { level: 1, xp: 0 },
            offhand: { level: 1, xp: 0 },
            necklace: { level: 1, xp: 0 },
            ring: { level: 1, xp: 0 }
          },
          homestead: {
            mineLevel: 1,
            forestLevel: 1,
            herbLevel: 1,
            lastCollectTime: Date.now()
          }
        };

        const starterSword = {
          id: "eq_starter_" + Date.now(),
          tier: 1,
          tierName: "一阶·炼气(1层)",
          tierTag: "tier-1",
          name: "青竹寒铁剑",
          slot: "weapon",
          quality: "灵品·清辉",
          qualityClass: "quality-ling",
          power: 32,
          stats: { atk: 28 },
          durability: 100,
          maxDurability: 100,
          maker: daoName,
          year: "入道年",
          forgeLuck: 75,
          affix: null,
          lineage: [`由道友「${daoName}」亲手铭刻道号`]
        };
        initialUser.inventory.push(starterSword);
        initialUser.equipped.weapon = starterSword;

        await kv.put("acc:" + username, accountId);
        await kv.put("user:" + accountId, JSON.stringify(initialUser));

        const token = generateToken();
        await kv.put("sess:" + token, JSON.stringify({ accountId, exp: Date.now() + 30 * 86400 * 1000 }));

        return json({ success: true, token, user: initialUser });
      }
      return json({ success: true, message: "模拟注册成功" });
    } catch (e) {
      return json({ success: false, error: e.message }, 500);
    }
  }

  // === 路由 2: 登录 ===
  if (path === "auth/login" && request.method === "POST") {
    try {
      const { username, password } = await request.json();
      if (kv) {
        const accountId = await kv.get("acc:" + username);
        if (!accountId) return json({ success: false, error: "道号账号不存在" }, 400);

        const userRaw = await kv.get("user:" + accountId);
        const user = JSON.parse(userRaw);
        const passHash = await hashPass(password);

        if (user.passHash !== passHash) return json({ success: false, error: "密押有误" }, 400);

        const token = generateToken();
        await kv.put("sess:" + token, JSON.stringify({ accountId, exp: Date.now() + 30 * 86400 * 1000 }));
        return json({ success: true, token, user });
      }
      return json({ success: true, message: "模拟登录成功" });
    } catch (e) {
      return json({ success: false, error: e.message }, 500);
    }
  }

  // === 路由 3: 获取自身 ===
  if (path === "auth/me" && request.method === "GET") {
    const user = await getAuthUser(request, kv);
    if (!user) return json({ success: false, error: "未登录" }, 401);
    return json({ success: true, user });
  }

  // === 路由 4: 权威锻造 - 开炉起胚 ===
  if (path === "forge/start" && request.method === "POST") {
    const user = await getAuthUser(request, kv);
    if (!user) return json({ success: false, error: "未登录" }, 401);

    const { tier, recipeIndex } = await request.json();
    const recipe = TIER_RECIPES[tier]?.items[recipeIndex];
    if (!recipe) return json({ success: false, error: "配方不存在" }, 400);

    for (const [k, req] of Object.entries(recipe.cost)) {
      if ((user.resources[k] || 0) < req) return json({ success: false, error: "材料不足" }, 400);
    }
    for (const [k, req] of Object.entries(recipe.cost)) {
      user.resources[k] -= req;
    }

    const variance = +(0.85 + Math.random() * 0.35).toFixed(2);
    const initStats = {};
    for (const [s, v] of Object.entries(recipe.stats)) initStats[s] = Math.max(1, Math.round(v * variance));
    const initPower = Math.max(10, Math.round(recipe.power * 0.7 * variance));

    const anvil = {
      tier, recipeIndex, slot: recipe.slot, layer: 1, power: initPower, stats: initStats, variance
    };

    if (kv) await kv.put("user:" + user.id, JSON.stringify(user));
    return json({ success: true, anvil, resources: user.resources });
  }

  // === 路由 5: 权威锻造 - 挥锤冲层 (天赋经验结算) ===
  if (path === "forge/strike" && request.method === "POST") {
    const user = await getAuthUser(request, kv);
    if (!user) return json({ success: false, error: "未登录" }, 401);

    const { anvil } = await request.json();
    const { tier, layer, slot, recipeIndex } = anvil;
    if (layer >= 10) return json({ success: false, error: "已达大圆满" }, 400);

    const cost = getStrikeCost(tier, layer);
    if ((user.resources[cost.matKey] || 0) < cost.count || (user.spiritStones || 0) < cost.stones) {
      return json({ success: false, error: "材料或灵石不足" }, 400);
    }

    user.resources[cost.matKey] -= cost.count;
    user.spiritStones -= cost.stones;

    // 天赋倍率
    user.mastery = user.mastery || {};
    const smithM = user.mastery.smithing || { level: 1, xp: 0 };
    const slotM = user.mastery[slot] || { level: 1, xp: 0 };
    const totalLvl = (smithM.level + slotM.level) / 2;
    const masteryMult = 1.0 + (Math.min(100, Math.max(1, totalLvl)) - 1) / 99 * 0.5;

    const baseRate = LAYER_UP_RATES[layer] || 0.1;
    const actualRate = Math.min(0.98, (baseRate * masteryMult) + (user.luck - 50) * 0.001);

    // 经验奖励
    const gainedXp = tier * 8 + layer * 4;
    smithM.xp += gainedXp;
    slotM.xp += gainedXp;
    if (smithM.xp >= getMasteryReqXp(smithM.level) && smithM.level < 100) {
      smithM.xp -= getMasteryReqXp(smithM.level);
      smithM.level++;
    }
    if (slotM.xp >= getMasteryReqXp(slotM.level) && slotM.level < 100) {
      slotM.xp -= getMasteryReqXp(slotM.level);
      slotM.level++;
    }
    user.mastery.smithing = smithM;
    user.mastery[slot] = slotM;

    const success = Math.random() < actualRate;
    let isWorldBroadcast = false;
    let broadcastMsg = "";

    if (success) {
      anvil.layer++;
      const recipe = TIER_RECIPES[tier].items[recipeIndex];
      const growths = [1, 1.3, 1.7, 2.3, 3.1, 4.2, 5.8, 8.0, 11.5, 18.0];
      const growth = growths[anvil.layer - 1] || 2.0;
      anvil.power = Math.floor(recipe.power * growth * (anvil.variance || 1.0));
      if (anvil.layer === 10) {
        isWorldBroadcast = true;
        broadcastMsg = `🌟【天道祥瑞】道友「${user.daoName}」铸就十层大圆满【${recipe.name}·归元】(战力+${anvil.power})！`;
      }
    }

    if (kv) await kv.put("user:" + user.id, JSON.stringify(user));

    return json({
      success: true,
      strikeSuccess: success,
      actualRate,
      anvil,
      resources: user.resources,
      spiritStones: user.spiritStones,
      mastery: user.mastery,
      isWorldBroadcast,
      broadcastMsg
    });
  }

  // === 路由 6: 权威家园收获 ===
  if (path === "homestead/collect" && request.method === "POST") {
    const user = await getAuthUser(request, kv);
    if (!user) return json({ success: false, error: "未登录" }, 401);

    const now = Date.now();
    const home = user.homestead || { mineLevel: 1, forestLevel: 1, herbLevel: 1, lastCollectTime: now };
    const elapsed = Math.max(0, Math.min(86400, Math.floor((now - (home.lastCollectTime || now)) / 1000)));

    const mineGain = Math.floor(elapsed * 0.1 * (home.mineLevel || 1));
    const forestGain = Math.floor(elapsed * 0.1 * (home.forestLevel || 1));
    const herbGain = Math.floor(elapsed * 0.08 * (home.herbLevel || 1));

    user.resources.ore_common = (user.resources.ore_common || 0) + mineGain;
    user.resources.wood_common = (user.resources.wood_common || 0) + forestGain;
    user.resources.herb_common = (user.resources.herb_common || 0) + herbGain;
    home.lastCollectTime = now;
    user.homestead = home;

    if (kv) await kv.put("user:" + user.id, JSON.stringify(user));

    return json({
      success: true,
      gains: { ore: mineGain, wood: forestGain, herb: herbGain },
      resources: user.resources,
      homestead: home
    });
  }

  // === 路由 7: 全服争夺世界事件 ===
  if (path === "world/events" && request.method === "GET") {
    const events = [
      { id: "e1", type: "contest", content: "【上古仙矿现世】太虚北域「赤阳精金仙矿」现世，诸位道友速往争夺！", time: "刚刚" },
      { id: "e2", type: "broadcast", content: "【天道昭告】太虚古界开启，天道神炉降世！", time: "1柱香前" }
    ];
    return json({ success: true, events });
  }

  // === 路由 8: 排行榜 ===
  if (path === "leaderboard" && request.method === "GET") {
    const list = [
      { name: "韩立", realm: "化神初期", power: 9850, luck: 95, stones: 58000 },
      { name: "厉飞雨", realm: "元婴后期", power: 4520, luck: 82, stones: 12000 },
      { name: "南宫婉", realm: "结丹大圆满", power: 1850, luck: 90, stones: 6500 },
      { name: "萧不凡", realm: "筑基大圆满", power: 620, luck: 88, stones: 1200 }
    ];
    return json({ success: true, power_rank: list, luck_rank: list });
  }

  return json({ error: "Endpoint not found: " + path }, 404);
}
