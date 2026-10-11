/**
 * 《修仙模拟器：天命心火》核心引擎
 * 纯文字 + 2D平面微动效 + 8大装备槽角色面板 + 三阶修仙装备库 + 气运真名 + 秘境搜打撤 (Extraction) + SQLite金榜交易行
 */

(function () {
  // === 境界体系 ===
  const REALMS = [
    { name: "炼气一层", desc: "引气入体，初窥门径", maxExp: 100, clickExp: 10, secExp: 1, basePow: 10, baseHp: 100, baseMp: 50, baseAtk: 12, baseDef: 6, baseSpd: 10, baseWis: 8 },
    { name: "炼气二层", desc: "灵气入体，经脉初通", maxExp: 300, clickExp: 18, secExp: 3, basePow: 25, baseHp: 160, baseMp: 90, baseAtk: 22, baseDef: 12, baseSpd: 15, baseWis: 16 },
    { name: "炼气三层", desc: "百穴微张，真气沉丹田", maxExp: 750, clickExp: 30, secExp: 6, basePow: 55, baseHp: 260, baseMp: 160, baseAtk: 45, baseDef: 24, baseSpd: 22, baseWis: 30 },
    { name: "炼气后期", desc: "周天圆融，御物通玄", maxExp: 1600, clickExp: 55, secExp: 12, basePow: 120, baseHp: 450, baseMp: 300, baseAtk: 95, baseDef: 50, baseSpd: 35, baseWis: 60 },
    { name: "筑基初期", desc: "真元凝液，灵台方寸渐明", maxExp: 3500, clickExp: 100, secExp: 25, basePow: 260, baseHp: 850, baseMp: 600, baseAtk: 210, baseDef: 110, baseSpd: 60, baseWis: 120 },
    { name: "筑基大圆满", desc: "九转筑基，铸就无垢金身", maxExp: 8000, clickExp: 190, secExp: 55, basePow: 580, baseHp: 1600, baseMp: 1200, baseAtk: 460, baseDef: 240, baseSpd: 110, baseWis: 250 },
    { name: "结丹期", desc: "金丹初结，寿元八百载", maxExp: 18000, clickExp: 380, secExp: 120, basePow: 1300, baseHp: 3500, baseMp: 2600, baseAtk: 1050, baseDef: 550, baseSpd: 220, baseWis: 550 },
    { name: "元婴老祖", desc: "破丹成婴，元神出窍傲苍穹", maxExp: 45000, clickExp: 800, secExp: 280, basePow: 3200, baseHp: 8500, baseMp: 6500, baseAtk: 2600, baseDef: 1400, baseSpd: 480, baseWis: 1300 },
    { name: "化神真君", desc: "天人合一，神游太虚夺造化", maxExp: 120000, clickExp: 1800, secExp: 650, basePow: 8800, baseHp: 22000, baseMp: 18000, baseAtk: 7200, baseDef: 3800, baseSpd: 1200, baseWis: 3500 }
  ];

  // 槽位配置 (8大槽位)
  const SLOT_CONFIG = {
    head: { name: "头部", icon: "👑", desc: "冠帽发簪" },
    armor: { name: "躯干", icon: "🥋", desc: "道袍法甲" },
    hand: { name: "护腕", icon: "🧤", desc: "手甲腕带" },
    foot: { name: "履靴", icon: "👢", desc: "踏云法靴" },
    weapon: { name: "兵刃", icon: "🗡️", desc: "主手飞剑" },
    offhand: { name: "副手", icon: "🪞", desc: "法镜灵宝" },
    necklace: { name: "项饰", icon: "📿", desc: "灵佩宝珠" },
    ring: { name: "指环", icon: "💍", desc: "乾坤须弥" }
  };

  // 国风纯矢量装备图宝库 (按8大槽位专属定制，支持不同品质与阶位色泽)
  const EQUIP_SVG_ICONS = {
    weapon: (color = "#d4a34b") => `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 剑刃流光 -->
        <path d="M48 6L58 16L30 44L20 44L20 34L48 6Z" fill="${color}" stroke="#1c1813" stroke-width="2"/>
        <line x1="24" y1="40" x2="52" y2="12" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
        <!-- 剑格与护手 -->
        <path d="M14 42L26 30L28 32L16 44Z" fill="#8c7c64" stroke="#1c1813" stroke-width="1.5"/>
        <path d="M22 50L34 38L32 36L20 48Z" fill="#8c7c64" stroke="#1c1813" stroke-width="1.5"/>
        <!-- 剑柄与剑首 -->
        <line x1="18" y1="46" x2="8" y2="56" stroke="#5a432b" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="8" cy="56" r="3.5" fill="${color}" stroke="#1c1813" stroke-width="1.5"/>
        <!-- 灵气粒子 -->
        <circle cx="50" cy="10" r="1.5" fill="#ffffff"/>
      </svg>
    `,
    armor: (color = "#d4a34b") => `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 道袍主身 -->
        <path d="M20 12L32 18L44 12L52 24L44 28L42 54L22 54L20 28L12 24L20 12Z" fill="#322a22" stroke="${color}" stroke-width="2"/>
        <!-- 阴阳对襟 -->
        <path d="M32 18L26 36L32 54L38 36L32 18Z" fill="#f4eee2" opacity="0.3"/>
        <line x1="32" y1="18" x2="32" y2="54" stroke="${color}" stroke-width="1.5"/>
        <!-- 护心宝镜 -->
        <circle cx="32" cy="28" r="5" fill="${color}" stroke="#ffffff" stroke-width="1"/>
      </svg>
    `,
    head: (color = "#d4a34b") => `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 仙冠法髻 -->
        <path d="M14 40C16 26 22 16 32 12C42 16 48 26 50 40C42 43 22 43 14 40Z" fill="#2d261e" stroke="${color}" stroke-width="2"/>
        <!-- 碧玉流云发簪横穿 -->
        <line x1="8" y1="28" x2="56" y2="28" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="10" cy="28" r="4" fill="#2b7a5a" stroke="#fff" stroke-width="1"/>
        <!-- 冠顶明珠 -->
        <circle cx="32" cy="14" r="3.5" fill="#ffffff" stroke="${color}" stroke-width="1.5"/>
      </svg>
    `,
    hand: (color = "#d4a34b") => `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 护腕铁甲 -->
        <rect x="18" y="18" width="28" height="30" rx="6" fill="#2d2720" stroke="${color}" stroke-width="2"/>
        <!-- 缠手绑带与铜钉 -->
        <line x1="18" y1="28" x2="46" y2="28" stroke="#8c7c64" stroke-width="2"/>
        <line x1="18" y1="38" x2="46" y2="38" stroke="#8c7c64" stroke-width="2"/>
        <circle cx="25" cy="33" r="2" fill="${color}"/>
        <circle cx="39" cy="33" r="2" fill="${color}"/>
        <polygon points="32,22 36,25 32,28 28,25" fill="#ff4400"/>
      </svg>
    `,
    foot: (color = "#d4a34b") => `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 踏云飞靴 -->
        <path d="M22 14L34 14L34 36L48 44C48 48 44 52 38 52L18 52C16 46 18 36 22 14Z" fill="#28221b" stroke="${color}" stroke-width="2"/>
        <!-- 祥云纹路 -->
        <path d="M26 44C30 40 38 42 42 46" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="44" cy="46" r="2" fill="#fff"/>
      </svg>
    `,
    offhand: (color = "#d4a34b") => `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 八卦灵镜边框 -->
        <polygon points="32,10 48,16 54,32 48,48 32,54 16,48 10,32 16,16" fill="#241e17" stroke="${color}" stroke-width="2.5"/>
        <!-- 镜心神光 -->
        <circle cx="32" cy="32" r="12" fill="#f4eee2" opacity="0.6"/>
        <circle cx="32" cy="32" r="8" fill="#1c1813" stroke="${color}" stroke-width="1"/>
        <circle cx="32" cy="32" r="3" fill="#ffffff"/>
      </svg>
    `,
    necklace: (color = "#d4a34b") => `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 灵珠项链圆弧 -->
        <path d="M14 18C18 38 46 38 50 18" stroke="#8c7c64" stroke-width="2" stroke-linecap="round"/>
        <!-- 吊坠本命灵佩 -->
        <polygon points="32,32 40,42 32,54 24,42" fill="#2b7a5a" stroke="${color}" stroke-width="2"/>
        <circle cx="32" cy="43" r="2.5" fill="#ffffff"/>
      </svg>
    `,
    ring: (color = "#d4a34b") => `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 须弥戒环 -->
        <ellipse cx="32" cy="36" rx="16" ry="12" fill="none" stroke="${color}" stroke-width="4"/>
        <ellipse cx="32" cy="36" rx="11" ry="8" fill="#1c1813" opacity="0.4"/>
        <!-- 须弥嵌宝 -->
        <polygon points="32,16 38,24 32,30 26,24" fill="#a63126" stroke="#fff" stroke-width="1.2"/>
        <circle cx="32" cy="23" r="1.5" fill="#ffd700"/>
      </svg>
    `
  };

  function getEquipSvgIcon(slotKey, qualityClass = "") {
    let color = "#d4a34b";
    if (qualityClass === "quality-xian") color = "#ff3300";
    else if (qualityClass === "quality-bao") color = "#b842ff";
    else if (qualityClass === "quality-xuan") color = "#2080f0";
    else if (qualityClass === "quality-ling") color = "#2b7a5a";
    else if (qualityClass === "quality-fan") color = "#8c7c64";

    const fn = EQUIP_SVG_ICONS[slotKey] || EQUIP_SVG_ICONS.weapon;
    return fn(color);
  }

  // 三阶修仙装备图鉴与百炼配方
  const TIER_RECIPES = {
    1: {
      name: "一阶·炼气",
      tierTag: "tier-1",
      intro: "以青竹凡木与寒铁初矿炼制入门仙器，消耗材料少，适合初入仙途筑牢根基。",
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
      tierTag: "tier-2",
      intro: "需融入地脉灵木与淬火精金，灵气共鸣强劲，筑基修士护道必备。",
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
      tierTag: "tier-3",
      intro: "采万年雷击木、赤阳精金与稀世仙草熔铸，天地变色，有移山填海之威！",
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

  const AFFIX_POOL = [
    { name: "福泽天眷", desc: "斗法掷骰保底提升至3", effect: { minDice: 3 } },
    { name: "因果逆转", desc: "斗法每回合可重掷劣骰", effect: { reroll: true } },
    { name: "本命通灵", desc: "掷出6点时暴击伤害翻倍", effect: { critDmg: 2.0 } },
    { name: "气运夺髓", desc: "胜出额外掠夺败者气运与灵石", effect: { stealLuck: 5 } },
    { name: "避煞金身", desc: "秘境战败装备被夺几率减半", effect: { protectEquip: 0.5 } }
  ];

  const NPC_NAMES = [
    "陆仁", "韩立", "厉飞雨", "南宫婉", "萧不凡", "李逍遥", "林惊羽", "白小纯", "石昊", "叶凡"
  ];

  // 游戏主状态
  let state = {
    daoName: "太虚散人",
    realmIndex: 1, // 炼气二层
    exp: 32,
    spiritStones: 20,
    luck: 75,
    heartFire: 3,
    maxHeartFire: 3,

    resources: {
      wood_common: 12,
      wood_rare: 2,
      ore_common: 15,
      ore_rare: 1,
      herb_common: 8,
      herb_rare: 0
    },

    // 8大装备槽位
    equipped: {
      head: null,
      armor: null,
      hand: null,
      foot: null,
      weapon: null,
      offhand: null,
      necklace: null,
      ring: null
    },

    inventory: [], // 背包法宝列表
    currentForgeTier: 1, // 熔炉当前选择阶位

    // 阿尔比恩专精命运盘 (总铁匠 + 8部位独立天赋)
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

    // 洞府仙山家园 (低阶灵脉、竹林与灵田自产)
    homestead: {
      mineLevel: 1,
      forestLevel: 1,
      herbLevel: 1,
      lastCollectTime: Date.now()
    },

    // 秘境搜打撤
    extraction: {
      active: false,
      floor: 1,
      ap: 5,
      tempLoot: [],
      currentEnemy: null
    },

    logs: []
  };

  // 存档加载与保存
  function loadSavedGame() {
    const saved = localStorage.getItem("xiuxian_save_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = Object.assign(state, parsed);
        // 兼容补全 8 槽位
        if (!state.equipped.head) state.equipped.head = null;
        if (!state.equipped.hand) state.equipped.hand = null;
        if (!state.equipped.foot) state.equipped.foot = null;
        if (!state.equipped.offhand) state.equipped.offhand = null;
        if (!state.equipped.necklace) state.equipped.necklace = null;
        if (!state.equipped.ring) state.equipped.ring = null;
      } catch (e) {
        console.error("加载存档失败", e);
      }
    } else {
      addLog("在山洞中闭关打坐，经脉初通", "normal");
      addLog("在悬崖边迎初阳吐纳，修为有所精进", "normal");
      addLog("【宿怨】同门弟子曾于秘境中盗取你本命心火，此仇未报！", "stolen");

      // 赠送一件新手新手一阶青竹寒铁剑
      const starterSword = {
        id: "starter_sword_01",
        tier: 1,
        tierName: "一阶·炼气",
        tierTag: "tier-1",
        name: "青竹寒铁剑",
        slot: "weapon",
        quality: "灵品·清辉",
        qualityClass: "quality-ling",
        power: 32,
        stats: { atk: 28 },
        durability: 100,
        maxDurability: 100,
        maker: state.daoName,
        year: "入门时",
        forgeLuck: 75,
        affix: null,
        lineage: ["入门宗门长老赠予剑胚，由自己亲手开刃印刻道号"]
      };
      state.inventory.push(starterSword);
      state.equipped.weapon = starterSword;
    }
  }

  function saveGame() {
    localStorage.setItem("xiuxian_save_v1", JSON.stringify(state));
  }

  function addLog(text, type = "normal") {
    const time = new Date().toTimeString().split(" ")[0].substring(0, 5);
    state.logs.unshift({ time, text, type });
    if (state.logs.length > 50) state.logs.pop();
    renderLogs();
  }

  // === 《寻道大千》国风无阻断浮空 Toast 提示系统 (彻底替代原生系统弹窗 alert) ===
  function showToast(message, type = "normal") {
    const container = document.getElementById("xiuxian-toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    let icon = "✨";
    let typeClass = "";
    if (type === "blessing") {
      icon = "🌟";
      typeClass = "toast-blessing";
    } else if (type === "danger" || type === "stolen") {
      icon = "⚠️";
      typeClass = "toast-danger";
    } else if (type === "battle") {
      icon = "⚔️";
      typeClass = "toast-battle";
    }

    toast.className = `xiuxian-toast ${typeClass}`;
    toast.innerHTML = `<span>${icon}</span><span>${message.replace(/\n/g, ' ')}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  // === 计算角色综合八维属性 ===
  function calculateTotalAttributes() {
    const realm = REALMS[state.realmIndex];
    let stats = {
      hp: realm.baseHp,
      mp: realm.baseMp,
      atk: realm.baseAtk,
      def: realm.baseDef,
      spd: realm.baseSpd,
      wis: realm.baseWis,
      luck: state.luck,
      power: realm.basePow
    };

    // 叠加 8 大槽位装备属性
    Object.keys(state.equipped).forEach(slotKey => {
      const eq = state.equipped[slotKey];
      if (eq) {
        stats.power += eq.power || 0;
        if (eq.stats) {
          if (eq.stats.hp) stats.hp += eq.stats.hp;
          if (eq.stats.mp) stats.mp += eq.stats.mp;
          if (eq.stats.atk) stats.atk += eq.stats.atk;
          if (eq.stats.def) stats.def += eq.stats.def;
          if (eq.stats.spd) stats.spd += eq.stats.spd;
          if (eq.stats.wis) stats.wis += eq.stats.wis;
        }
      }
    });

    // 气运对战力总值修正
    stats.power = Math.floor(stats.power * (1 + (state.luck - 50) * 0.003));
    return stats;
  }

  // === 刷新所有界面渲染 ===
  function updateUI() {
    const realm = REALMS[state.realmIndex];
    const totalStats = calculateTotalAttributes();

    // 顶部状态
    document.getElementById("top-stones").innerText = state.spiritStones;
    document.getElementById("top-exp").innerText = state.exp;
    document.getElementById("top-power").innerText = totalStats.power;
    document.getElementById("top-luck").innerText = state.luck;
    document.getElementById("top-heartfire").innerText = `${state.heartFire}/${state.maxHeartFire}`;

    // 顶部账号状态栏
    const barDaoName = document.getElementById("bar-dao-name");
    const barAuthStatus = document.getElementById("bar-auth-status");
    const btnOpenAuth = document.getElementById("btn-open-auth");
    if (barDaoName) barDaoName.innerText = state.daoName;
    if (barAuthStatus) {
      if (authState && authState.username) {
        barAuthStatus.innerText = "云端道籍 · 已核准";
        barAuthStatus.className = "tier-tag tier-3";
        if (btnOpenAuth) btnOpenAuth.innerText = `👤 ${authState.username}`;
      } else {
        barAuthStatus.innerText = "单机散修";
        barAuthStatus.className = "tier-tag tier-1";
        if (btnOpenAuth) btnOpenAuth.innerText = "🔑 账号登入 / 开辟道途";
      }
    }

    // 境界卡片
    document.getElementById("realm-title").innerText = realm.name;
    document.getElementById("realm-desc").innerText = realm.desc;
    const pct = Math.min(100, Math.floor((state.exp / realm.maxExp) * 100));
    document.getElementById("realm-progress-bar").style.width = pct + "%";
    document.getElementById("realm-progress-text").innerText = `修为: ${state.exp} / ${realm.maxExp}`;

    const breakBtn = document.getElementById("breakthrough-btn");
    if (state.exp >= realm.maxExp && state.realmIndex < REALMS.length - 1) {
      breakBtn.style.display = "inline-block";
    } else {
      breakBtn.style.display = "none";
    }

    const clickGain = Math.floor(realm.clickExp * (1 + (state.luck > 70 ? 0.2 : 0)));
    document.getElementById("click-gain-text").innerText = `每次修炼 +${clickGain} 修为`;

    // 洞府资源
    document.getElementById("res-wood-common").innerText = state.resources.wood_common;
    document.getElementById("res-wood-rare").innerText = state.resources.wood_rare;
    document.getElementById("res-ore-common").innerText = state.resources.ore_common;
    document.getElementById("res-ore-rare").innerText = state.resources.ore_rare;
    document.getElementById("res-herb-common").innerText = state.resources.herb_common;
    document.getElementById("res-herb-rare").innerText = state.resources.herb_rare;

    // 角色面板与 8 大槽位
    renderCharacterPanel(totalStats);
    // 渲染工坊打造列表
    renderForgeItems();
    // 渲染藏宝阁列表
    renderEquipmentView();
  }

  // 渲染角色主面板 (立绘与 8 大槽位)
  function renderCharacterPanel(stats) {
    const realm = REALMS[state.realmIndex];
    const badgeEl = document.getElementById("char-badge-realm");
    if (badgeEl) badgeEl.innerText = `${realm.name} · ${state.daoName}`;

    const nameplate = document.getElementById("char-nameplate-text");
    if (nameplate) nameplate.innerText = state.daoName;

    // 八维属性
    document.getElementById("char-stat-atk").innerText = stats.atk;
    document.getElementById("char-stat-def").innerText = stats.def;
    document.getElementById("char-stat-spd").innerText = stats.spd;
    document.getElementById("char-stat-wis").innerText = stats.wis;
    document.getElementById("char-stat-hp").innerText = stats.hp;
    document.getElementById("char-stat-mp").innerText = stats.mp;
    document.getElementById("char-stat-luck").innerText = stats.luck;
    document.getElementById("char-stat-hf").innerText = `${state.heartFire}/${state.maxHeartFire}`;

    // 更新立绘四周 8 个槽位
    Object.keys(SLOT_CONFIG).forEach(slotKey => {
      const cell = document.getElementById(`slot-${slotKey}`);
      const nameEl = document.getElementById(`slot-name-${slotKey}`);
      const artEl = document.getElementById(`slot-art-${slotKey}`);
      if (!cell || !nameEl) return;

      // 清除旧的动态光晕
      cell.classList.remove("filled", "slot-glow-ling", "slot-glow-xuan", "slot-glow-bao", "slot-glow-xian");

      const item = state.equipped[slotKey];
      if (item) {
        cell.classList.add("filled");

        // 动态附加品质光晕动效
        if (item.qualityClass === "quality-xian") cell.classList.add("slot-glow-xian");
        else if (item.qualityClass === "quality-bao") cell.classList.add("slot-glow-bao");
        else if (item.qualityClass === "quality-xuan") cell.classList.add("slot-glow-xuan");
        else if (item.qualityClass === "quality-ling") cell.classList.add("slot-glow-ling");

        nameEl.innerText = item.name;
        nameEl.style.color = item.qualityClass === "quality-xian" ? "#a63126" : item.qualityClass === "quality-bao" ? "#8430b8" : "#2b7a5a";
        if (artEl) {
          artEl.innerHTML = getEquipSvgIcon(slotKey, item.qualityClass);
        }
      } else {
        nameEl.innerText = "空置";
        nameEl.style.color = "var(--text-muted)";
        if (artEl) {
          artEl.innerHTML = `<span style="opacity:0.35;">${getEquipSvgIcon(slotKey, 'quality-fan')}</span>`;
        }
      }
    });
  }

  // === 槽位检视与穿戴/更换弹窗 ===
  let currentInspectingSlot = "weapon";

  function openSlotInspect(slotKey) {
    currentInspectingSlot = slotKey;
    const cfg = SLOT_CONFIG[slotKey];
    document.getElementById("inspect-modal-title").innerText = `${cfg.icon} 【${cfg.name}】${cfg.desc}槽位`;

    const currentBox = document.getElementById("inspect-current-box");
    const currentItem = state.equipped[slotKey];

    if (currentItem) {
      currentBox.innerHTML = `
        <div class="equip-card" style="margin:0;">
          <div class="equip-title" style="align-items:flex-start;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="equip-art-box" style="width:34px; height:34px; background:#fffcf7; border:1px solid #c9bea9; border-radius:6px; padding:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                ${getEquipSvgIcon(currentItem.slot, currentItem.qualityClass)}
              </div>
              <div>
                <div>
                  <span class="tier-tag ${currentItem.tierTag || 'tier-1'}">${currentItem.tierName || '一阶·炼气'}</span>
                  <span class="item-badge ${currentItem.qualityClass}">${currentItem.quality}</span>
                  <b style="margin-left:4px;">${currentItem.name}</b>
                </div>
                <div style="color:#a63126; font-size:11px; margin-top:2px;">战力 +${currentItem.power}</div>
              </div>
            </div>
          </div>
          <div class="equip-stats">
            <span>耐久: ${currentItem.durability}/${currentItem.maxDurability}</span>
            <span>属性: ${formatItemStats(currentItem.stats)}</span>
          </div>
          ${currentItem.affix ? `<div class="equip-affix">✦ 气运真言: 【${currentItem.affix.name}】(${currentItem.affix.desc})</div>` : ''}
          <div class="equip-maker-seal">
            <span class="equip-seal-mark">真名印信</span>
            <span>${currentItem.maker} 亲铸 · 铸时福缘: ${currentItem.forgeLuck}</span>
          </div>
          <div style="margin-top:6px; display:flex; justify-content:flex-end;">
            <button class="action-btn danger" onclick="window.game.unequipSlot('${slotKey}')">卸下至背包</button>
          </div>
        </div>
      `;
    } else {
      currentBox.innerHTML = `<div style="text-align:center; padding:12px; background:#f4eee2; border-radius:8px; font-size:11px; color:#888;">当前槽位尚未佩戴法宝，请在下方选择背包中的法宝穿戴</div>`;
    }

    // 候选列表
    const candList = document.getElementById("inspect-candidates-list");
    candList.innerHTML = "";

    const candidates = state.inventory.filter(i => i.slot === slotKey && (!currentItem || i.id !== currentItem.id));

    if (candidates.length === 0) {
      candList.innerHTML = `<div style="text-align:center; padding:10px; font-size:10px; color:#888;">背包中无同部位法宝，可前往【洞府】百炼炉亲手锻造！</div>`;
    } else {
      candidates.forEach(cand => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#fffcf7; border:1px solid #c9bea9; border-radius:6px; padding:6px 8px;";
        row.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="equip-art-box" style="width:26px; height:26px; background:#fffcf7; border:1px solid #c9bea9; border-radius:4px; padding:2px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${getEquipSvgIcon(cand.slot, cand.qualityClass)}
            </div>
            <div>
              <div style="font-size:11px; font-weight:bold;">
                <span class="tier-tag ${cand.tierTag || 'tier-1'}">${cand.tierName || '一阶'}</span>
                <span>${cand.name}</span>
              </div>
              <div style="font-size:9px; color:#888;">战力+${cand.power} · ${cand.maker} 亲铸</div>
            </div>
          </div>
          <button class="action-btn primary" onclick="window.game.equipItemFromInspect('${cand.id}')">穿戴</button>
        `;
        candList.appendChild(row);
      });
    }

    document.getElementById("inspect-modal").classList.add("active");
  }

  function unequipSlot(slotKey) {
    if (state.equipped[slotKey]) {
      const cell = document.getElementById(`slot-${slotKey}`);
      if (cell) {
        cell.classList.add("equip-flash-out");
        setTimeout(() => cell.classList.remove("equip-flash-out"), 500);
      }
      addLog(`卸下了【${SLOT_CONFIG[slotKey].name}】槽位的「${state.equipped[slotKey].name}」`, "normal");
      state.equipped[slotKey] = null;
      saveGame();
      updateUI();
      openSlotInspect(slotKey);
    }
  }

  // 角色面板槽位右上角直接快捷卸下
  function unequipSlotDirect(slotKey) {
    if (state.equipped[slotKey]) {
      const equipName = state.equipped[slotKey].name;
      const cell = document.getElementById(`slot-${slotKey}`);
      if (cell) {
        cell.classList.add("equip-flash-out");
        setTimeout(() => cell.classList.remove("equip-flash-out"), 500);
      }
      state.equipped[slotKey] = null;
      addLog(`【解下法宝】快捷卸下了【${SLOT_CONFIG[slotKey].name}】槽位的「${equipName}」，已收入藏宝阁！`, "normal");
      saveGame();
      updateUI();
    }
  }

  function equipItemFromInspect(itemId) {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;
    state.equipped[item.slot] = item;

    const cell = document.getElementById(`slot-${item.slot}`);
    if (cell) {
      cell.classList.add("equip-flash-in");
      setTimeout(() => cell.classList.remove("equip-flash-in"), 650);
    }

    addLog(`穿戴了法宝「${item.name}」，道躯真元大幅激增！`, "blessing");
    saveGame();
    updateUI();
    document.getElementById("inspect-modal").classList.remove("active");
  }

  function toggleEquip(equipId) {
    const item = state.inventory.find(i => i.id === equipId);
    if (!item) return;

    if (state.equipped[item.slot] && state.equipped[item.slot].id === item.id) {
      const cell = document.getElementById(`slot-${item.slot}`);
      if (cell) {
        cell.classList.add("equip-flash-out");
        setTimeout(() => cell.classList.remove("equip-flash-out"), 500);
      }
      state.equipped[item.slot] = null;
      addLog(`卸下了法宝「${item.name}」`, "normal");
    } else {
      state.equipped[item.slot] = item;
      const cell = document.getElementById(`slot-${item.slot}`);
      if (cell) {
        cell.classList.add("equip-flash-in");
        setTimeout(() => cell.classList.remove("equip-flash-in"), 650);
      }
      addLog(`穿戴了法宝「${item.name}」，战力激增！`, "blessing");
    }
    saveGame();
    updateUI();
  }

  function formatItemStats(stats) {
    if (!stats) return "无";
    const parts = [];
    if (stats.atk) parts.push(`攻+${stats.atk}`);
    if (stats.def) parts.push(`防+${stats.def}`);
    if (stats.spd) parts.push(`速+${stats.spd}`);
    if (stats.wis) parts.push(`识+${stats.wis}`);
    if (stats.hp) parts.push(`气血+${stats.hp}`);
    if (stats.mp) parts.push(`真元+${stats.mp}`);
    return parts.join(" ");
  }

  function switchForgeTier(tier) {
    state.currentForgeTier = tier;
    for (let t = 1; t <= 3; t++) {
      const btn = document.getElementById(`forge-tier-btn-${t}`);
      if (btn) btn.className = `action-btn ${t === tier ? 'gold' : ''}`;
    }
    const introEl = document.getElementById("forge-tier-intro");
    if (introEl && TIER_RECIPES[tier]) introEl.innerText = TIER_RECIPES[tier].intro;
    renderForgeItems();
  }

  function renderForgeItems() {
    const container = document.getElementById("forge-items-list");
    if (!container) return;
    container.innerHTML = "";

    const tierData = TIER_RECIPES[state.currentForgeTier || 1];
    if (!tierData) return;

    tierData.items.forEach((itemRecipe, index) => {
      const cfg = SLOT_CONFIG[itemRecipe.slot];
      const card = document.createElement("div");
      card.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#f4ece0; padding:7px 10px; border-radius:6px; border:1px solid #ddd2bd;";

      const costTexts = [];
      if (itemRecipe.cost.wood_common) costTexts.push(`青竹木×${itemRecipe.cost.wood_common}`);
      if (itemRecipe.cost.wood_rare) costTexts.push(`桃木×${itemRecipe.cost.wood_rare}`);
      if (itemRecipe.cost.ore_common) costTexts.push(`寒铁×${itemRecipe.cost.ore_common}`);
      if (itemRecipe.cost.ore_rare) costTexts.push(`精金×${itemRecipe.cost.ore_rare}`);
      if (itemRecipe.cost.herb_common) costTexts.push(`凝血芝×${itemRecipe.cost.herb_common}`);
      if (itemRecipe.cost.herb_rare) costTexts.push(`玉芝×${itemRecipe.cost.herb_rare}`);

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="equip-art-box" style="width:28px; height:28px; background:#fffcf7; border:1px solid #c9bea9; border-radius:6px; padding:2px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${getEquipSvgIcon(itemRecipe.slot, state.currentForgeTier === 3 ? 'quality-bao' : (state.currentForgeTier === 2 ? 'quality-xuan' : 'quality-ling'))}
          </div>
          <div>
            <div style="font-size:12px; font-weight:bold;">
              <span class="tier-tag ${tierData.tierTag}">${tierData.name}</span>
              <span>亲铸·${itemRecipe.name}</span>
            </div>
            <div style="font-size:9px; color:var(--text-muted); margin-top:2px;">
              需: ${costTexts.join(", ")}
            </div>
          </div>
        </div>
        <button class="action-btn gold" onclick="window.game.forgeItemByRecipe(${state.currentForgeTier || 1}, ${index})">开炉亲铸</button>
      `;
      container.appendChild(card);
    });
  }

  // ============================================================
  // === 核心玩法升级：百炼三昧锻造台 (挥锤锻打 · 1~10层气运冲顶) ===
  // ============================================================
  let anvilState = {
    active: false,
    tier: 1,
    tierData: null,
    recipe: null,
    layer: 1, // 当前层数 1 ~ 10
    power: 18,
    stats: {},
    totalBonusMult: 1.0
  };

  // 1~10层突破基础成功率梯队 (9冲10仅0.01！)
  const LAYER_UP_RATES = {
    1: 0.90, // 1冲2
    2: 0.75, // 2冲3
    3: 0.55, // 3冲4
    4: 0.40, // 4冲5
    5: 0.25, // 5冲6
    6: 0.15, // 6冲7
    7: 0.08, // 7冲8
    8: 0.03, // 8冲9
    9: 0.01  // 9冲10 (0.01 极致天道大圆满！)
  };

  // 生成受福缘影响的词条浮动倍率 (范围 0.85 ~ 1.30)
  function rollStatVariance(luckScore = 75) {
    // 基础波动 0.85 ~ 1.15
    const baseVar = 0.85 + Math.random() * 0.30;
    // 福缘超过 50 则带来最高 +0.15 的天命上限补正
    const luckBonus = Math.max(0, (luckScore - 50) * 0.003 * Math.random());
    return +(baseVar + luckBonus).toFixed(2);
  }

  // 开炉起胚，进入百炼台 (优先请求服务器权威鉴权验证)
  async function forgeItemByRecipe(tier, recipeIdx) {
    const tierData = TIER_RECIPES[tier];
    const recipe = tierData.items[recipeIdx];

    // 检查材料扣除
    const cost = recipe.cost;
    for (let key in cost) {
      if ((state.resources[key] || 0) < cost[key]) {
        showToast("原料不足！需要充足的资源才能开炉炼制", "danger");
        return;
      }
    }

    if (authState && authState.token) {
      try {
        const res = await fetch("/api/forge/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authState.token}`
          },
          body: JSON.stringify({ tier, recipeIndex: recipeIdx })
        });
        const data = await res.json();
        if (data.success) {
          state.resources = data.resources;
          anvilState = {
            active: true,
            tier: tier,
            tierData: tierData,
            recipe: recipe,
            recipeIndex: recipeIdx,
            slot: recipe.slot,
            layer: data.anvil.layer,
            power: data.anvil.power,
            stats: data.anvil.stats,
            totalBonusMult: 1.0,
            lastVariance: data.anvil.variance
          };
          saveGame();
          updateUI();
          document.getElementById("forge-anvil-modal").classList.add("active");
          renderAnvilUI();
          addLog(`【云端鉴权·开炉起胚】三昧真火炉鼎已就绪，天道核验成功！凝聚出「${tierData.name}(1层)·${recipe.name}」胚料！`, "blessing");
          return;
        } else {
          showToast(data.error || "开炉未成", "danger");
          return;
        }
      } catch (e) {
        console.warn("服务端通信微恙，切换至本地离线模式", e);
      }
    }

    // 本地降级回退
    for (let key in cost) {
      state.resources[key] -= cost[key];
    }
    const initVar = rollStatVariance(state.luck);
    const initialStats = {};
    for (let s in recipe.stats) {
      initialStats[s] = Math.max(1, Math.round(recipe.stats[s] * initVar));
    }
    const initialPower = Math.max(10, Math.round(recipe.power * 0.7 * initVar));

    anvilState = {
      active: true,
      tier: tier,
      tierData: tierData,
      recipe: recipe,
      recipeIndex: recipeIdx,
      slot: recipe.slot,
      layer: 1,
      power: initialPower,
      stats: initialStats,
      totalBonusMult: 1.0,
      lastVariance: initVar
    };

    saveGame();
    updateUI();
    document.getElementById("forge-anvil-modal").classList.add("active");
    renderAnvilUI();
    addLog(`【开炉起胚】投入真火熔炉，凝聚出「一阶(1层)·${recipe.name}」剑胚！词条初始浮动 ${(initVar * 100).toFixed(0)}%，开始百炼捶打！`, "normal");
  }

  // 获取每一锤锻打所需的辅料与灵石消耗
  function getStrikeCost(tier, layer) {
    if (tier === 1) {
      if (layer <= 5) {
        return { matKey: 'ore_common', matName: '寒铁矿', count: 1, stones: 1 };
      } else {
        return { matKey: 'ore_common', matName: '寒铁矿', count: 2, stones: 3 };
      }
    } else if (tier === 2) {
      if (layer <= 5) {
        return { matKey: 'ore_common', matName: '寒铁矿', count: 3, stones: 5 };
      } else {
        return { matKey: 'ore_rare', matName: '精金', count: 1, stones: 10 };
      }
    } else {
      if (layer <= 5) {
        return { matKey: 'ore_rare', matName: '精金', count: 1, stones: 15 };
      } else {
        return { matKey: 'ore_rare', matName: '精金', count: 2, stones: 30 };
      }
    }
  }

  // 物理火花粒子系统
  let sparkParticles = [];
  let sparkAnimId = null;

  function spawnAnvilSparks() {
    const canvas = document.getElementById("anvil-sparks-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const originX = canvas.width / 2;
    const originY = canvas.height / 2 + 15;

    // 每次捶击激发出 25~35 颗高能流火火星
    for (let i = 0; i < 30; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // 向上方扇形喷射
      const speed = 2.5 + Math.random() * 6.5;
      sparkParticles.push({
        x: originX + (Math.random() * 20 - 10),
        y: originY + (Math.random() * 10 - 5),
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.8),
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.4 ? "#ffd700" : (Math.random() > 0.5 ? "#ff5500" : "#ffffff"),
        alpha: 1,
        life: 20 + Math.floor(Math.random() * 15)
      });
    }

    if (!sparkAnimId) {
      animateSparks();
    }
  }

  function animateSparks() {
    const canvas = document.getElementById("anvil-sparks-canvas");
    if (!canvas) {
      sparkAnimId = null;
      return;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = sparkParticles.length - 1; i >= 0; i--) {
      const p = sparkParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // 重力下坠
      p.alpha -= 0.035;
      p.life--;

      if (p.life <= 0 || p.alpha <= 0) {
        sparkParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (sparkParticles.length > 0) {
      sparkAnimId = requestAnimationFrame(animateSparks);
    } else {
      sparkAnimId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // 触发物理重锤挥击与受击变形
  function triggerHammerStrikeVisuals() {
    // 铁匠骨骼右臂联动挥击
    const puppetArm = document.getElementById("puppet-arm-right");
    if (puppetArm) {
      puppetArm.classList.remove("striking");
      void puppetArm.offsetWidth;
      puppetArm.classList.add("striking");
    }

    const hammerEl = document.getElementById("forge-hammer-tool");
    if (hammerEl) {
      hammerEl.classList.remove("swing-hammer");
      void hammerEl.offsetWidth; // 触发 reflow 重置动画
      hammerEl.classList.add("swing-hammer");
    }

    // 锤头击打在剑胚上的受力瞬间 (约130ms后) 触发受击压扁与火星四溅
    setTimeout(() => {
      const ingotEl = document.getElementById("anvil-ingot-icon");
      if (ingotEl) {
        ingotEl.classList.remove("hit-squash");
        void ingotEl.offsetWidth;
        ingotEl.classList.add("hit-squash");
      }
      spawnAnvilSparks();
    }, 130);
  }

  function renderAnvilUI() {
    if (!anvilState.active) return;
    const recipe = anvilState.recipe;
    const cfg = SLOT_CONFIG[recipe.slot];

    document.getElementById("anvil-item-name").innerText = `${recipe.name} (${cfg.name})`;
    const qualityClass = anvilState.layer === 10 ? 'quality-xian' : (anvilState.layer >= 7 ? 'quality-bao' : (anvilState.layer >= 4 ? 'quality-xuan' : 'quality-ling'));
    const ingotEl = document.getElementById("anvil-ingot-icon");
    if (ingotEl) {
      ingotEl.innerHTML = getEquipSvgIcon(recipe.slot, qualityClass);
    }

    // 渲染 1~10 层指示刻度
    const stepper = document.getElementById("anvil-layer-stepper");
    stepper.innerHTML = "";
    for (let l = 1; l <= 10; l++) {
      const dot = document.createElement("div");
      dot.className = `layer-step-dot ${l <= anvilState.layer ? (l === 10 ? 'max' : 'active') : ''}`;
      dot.title = `第${l}层`;
      stepper.appendChild(dot);
    }

    document.getElementById("anvil-layer-text").innerText = `${anvilState.tierData.name} (${anvilState.layer}层${anvilState.layer === 10 ? ' · 大圆满' : ''})`;
    document.getElementById("anvil-power-text").innerText = `+${anvilState.power}`;
    document.getElementById("anvil-luck-text").innerText = state.luck;

    // 实时词条数值与浮动范围显示
    const statsDetailEl = document.getElementById("anvil-stats-detail");
    const rangeHintEl = document.getElementById("anvil-range-hint");
    if (statsDetailEl) {
      statsDetailEl.innerText = formatItemStats(anvilState.stats);
    }
    if (rangeHintEl) {
      rangeHintEl.innerText = `词条波动率: ${( (anvilState.lastVariance || 1.0) * 100).toFixed(0)}% (范围85%~130%)`;
    }

    const rateText = document.getElementById("anvil-rate-text");
    if (anvilState.layer >= 10) {
      rateText.innerText = "已达大圆满极限！";
      rateText.style.color = "#ff3300";
    } else {
      const baseR = LAYER_UP_RATES[anvilState.layer] || 0.1;
      // 阿尔比恩天赋加成显示
      const smithLvl = state.mastery?.smithing?.level || 1;
      const slotLvl = state.mastery?.[recipe.slot]?.level || 1;
      const masteryMult = 1.0 + ((smithLvl + slotLvl) / 2.0 - 1) / 99.0 * 0.5;
      const finalR = Math.min(0.98, baseR * masteryMult);
      const ratePct = (finalR * 100).toFixed(finalR < 0.05 ? 2 : 0);
      rateText.innerText = `${ratePct}% (天赋提升+${((masteryMult - 1) * 100).toFixed(1)}%) ${anvilState.layer === 9 ? '🔥(天道险峰)' : ''}`;
      rateText.style.color = anvilState.layer >= 7 ? "#ff6633" : "#5cd68a";
    }

    // 渲染每一锤消耗提示
    const costDetailEl = document.getElementById("anvil-cost-detail");
    const resHasEl = document.getElementById("anvil-res-has");
    const strikeBtn = document.getElementById("anvil-strike-btn");
    if (costDetailEl && resHasEl) {
      if (anvilState.layer >= 10) {
        costDetailEl.innerText = "神品大圆满无需再锤";
        resHasEl.innerText = "";
        if (strikeBtn) strikeBtn.disabled = true;
      } else {
        const cost = getStrikeCost(anvilState.tier, anvilState.layer);
        costDetailEl.innerText = `${cost.matName}×${cost.count} + 灵石×${cost.stones}`;
        const hasMat = state.resources[cost.matKey] || 0;
        const hasStones = state.spiritStones || 0;
        resHasEl.innerText = `拥有: ${cost.matName}×${hasMat}, 灵石×${hasStones}`;
        const canAfford = hasMat >= cost.count && hasStones >= cost.stones;
        resHasEl.style.color = canAfford ? "#5cd68a" : "#ff4444";
        if (strikeBtn) strikeBtn.disabled = false;
      }
    }
  }

  // 关闭锻造台弹窗 (自动停止连续锤击)
  function closeAnvilModal() {
    stopAutoForge();
    const modal = document.getElementById("forge-anvil-modal");
    if (modal) modal.classList.remove("active");
  }

  // 《寻道大千》全自动连续锤击系统
  let autoForgeTimer = null;
  let isAutoForging = false;

  function stopAutoForge() {
    if (autoForgeTimer) {
      clearInterval(autoForgeTimer);
      autoForgeTimer = null;
    }
    isAutoForging = false;
    const btn = document.getElementById("auto-forge-btn");
    if (btn) {
      btn.innerText = "开启自动连锤";
      btn.classList.remove("running");
    }
  }

  function toggleAutoForge() {
    if (isAutoForging) {
      stopAutoForge();
      showToast("已停止自动连锤", "normal");
      return;
    }

    if (!anvilState.active) {
      showToast("尚未开炉选定剑胚！", "danger");
      return;
    }

    if (anvilState.layer >= 10) {
      showToast("此神兵已达十层大圆满，请淬火收炉！", "blessing");
      return;
    }

    const cost = getStrikeCost(anvilState.tier, anvilState.layer);
    const hasMat = state.resources[cost.matKey] || 0;
    const hasStones = state.spiritStones || 0;
    if (hasMat < cost.count || hasStones < cost.stones) {
      showToast("原料或灵石不足，无法开启连锤！", "danger");
      return;
    }

    isAutoForging = true;
    const btn = document.getElementById("auto-forge-btn");
    if (btn) {
      btn.innerText = "停止自动连锤 (进行中)";
      btn.classList.add("running");
    }
    showToast("⚡ 自动连锤已启动！如临洞府仙境闭关顿悟……", "blessing");

    // 立即打一锤，随后每 550ms 自动快速落锤 (寻道大千爽快节奏)
    strikeAnvilHammer();
    autoForgeTimer = setInterval(() => {
      if (!isAutoForging || !anvilState.active || anvilState.layer >= 10) {
        stopAutoForge();
        return;
      }
      const c = getStrikeCost(anvilState.tier, anvilState.layer);
      if ((state.resources[c.matKey] || 0) < c.count || (state.spiritStones || 0) < c.stones) {
        stopAutoForge();
        showToast("材料或灵石耗尽，自动连锤暂停", "danger");
        return;
      }
      strikeAnvilHammer();
    }, 550);
  }

  // 核心：挥锤锻打 (向服务器发送权威请求，核验材料、经验、冲层与全服广播)
  async function strikeAnvilHammer() {
    if (!anvilState.active) return;

    if (anvilState.layer >= 10) {
      showToast("此神兵已达【一阶(10层)大圆满】极限造化，请收炉入库！", "blessing");
      stopAutoForge();
      return;
    }

    const cost = getStrikeCost(anvilState.tier, anvilState.layer);
    const hasMat = state.resources[cost.matKey] || 0;
    const hasStones = state.spiritStones || 0;

    if (hasMat < cost.count) {
      showToast(`辅料不足！需【${cost.matName}×${cost.count}】，可在家园或灵峰开采`, "danger");
      stopAutoForge();
      return;
    }
    if (hasStones < cost.stones) {
      showToast(`真元灵石不足！需【灵石×${cost.stones}】`, "danger");
      stopAutoForge();
      return;
    }

    // 物理挥锤、火花飞溅与受击变形动效
    triggerHammerStrikeVisuals();

    // 挥锤震屏微动效
    const chamber = document.getElementById("anvil-chamber-box");
    if (chamber) {
      chamber.classList.remove("anvil-strike");
      void chamber.offsetWidth;
      chamber.classList.add("anvil-strike");
    }

    // 权威服务器处理
    if (authState && authState.token) {
      try {
        const res = await fetch("/api/forge/strike", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authState.token}`
          },
          body: JSON.stringify({ anvil: anvilState })
        });
        const data = await res.json();
        if (data.success) {
          state.resources = data.resources;
          state.spiritStones = data.spiritStones;
          if (data.mastery) state.mastery = data.mastery;

          // 飘字展示倍率
          const multBox = document.getElementById("anvil-mult-box");
          const flyEl = document.createElement("div");
          flyEl.className = `forge-mult-fly ${data.isCrit ? 'crit' : 'normal'}`;
          flyEl.innerText = data.isCrit ? `🔥 ×${data.mult.toFixed(1)} 天道开光！！` : `×${data.mult.toFixed(1)} 淬炼精纯`;
          multBox.appendChild(flyEl);
          setTimeout(() => flyEl.remove(), 1000);

          anvilState.layer = data.anvil.layer;
          anvilState.power = data.anvil.power;
          anvilState.stats = data.anvil.stats;
          anvilState.lastVariance = data.anvil.variance;

          if (data.strikeSuccess) {
            if (anvilState.layer === 10) {
              addLog(`🌟【天道大吉】逆天改命！以权威服务器核准铸成「十层大圆满·${anvilState.recipe.name}」！！全服已通报！`, "blessing");
              showToast(`🌟【大圆满神兵降世】成功铸就十层大圆满【${anvilState.recipe.name}】！战力 +${anvilState.power}！`, "blessing");
              stopAutoForge();
            } else {
              addLog(`【权威百炼精进】成功冲入「${anvilState.layer}层」！阿尔比恩熟练度提升，战力提升至 +${anvilState.power}。`, "normal");
              showToast(`冲层成功！升至【${anvilState.layer}层】，战力 +${anvilState.power}`, "blessing");
            }
          } else {
            addLog(`【淬火未进】火候略欠，未能冲入下一层，但道心专精熟练度仍有所增进！`, "normal");
            showToast(`淬火未进，剑胚稳固未损`, "normal");
          }

          if (data.isWorldBroadcast && data.broadcastMsg) {
            setWorldBroadcast(data.broadcastMsg);
          }

          saveGame();
          updateUI();
          renderAnvilUI();
          return;
        } else {
          showToast(data.error || "锤打未谐", "danger");
          stopAutoForge();
          return;
        }
      } catch (e) {
        console.warn("服务端通信异常，执行本地锻造", e);
      }
    }

    // 本地备用分支
    state.resources[cost.matKey] -= cost.count;
    state.spiritStones -= cost.stones;

    // 本地阿尔比恩熟练度增长
    if (state.mastery) {
      state.mastery.smithing.xp += 10;
      if (state.mastery[anvilState.slot]) state.mastery[anvilState.slot].xp += 10;
    }

    const luckScore = state.luck;
    const roll = Math.random() * 100;
    let mult = 1.1;
    let isCrit = false;
    const crit3Threshold = 100 - (luckScore > 80 ? 12 : 5);
    const crit2Threshold = crit3Threshold - (luckScore > 75 ? 20 : 12);

    if (roll >= crit3Threshold) { mult = 3.0; isCrit = true; }
    else if (roll >= crit2Threshold) { mult = 2.0; isCrit = true; }
    else if (roll >= 40) mult = 1.3;
    else if (roll >= 20) mult = 1.2;

    const multBox = document.getElementById("anvil-mult-box");
    const flyEl = document.createElement("div");
    flyEl.className = `forge-mult-fly ${isCrit ? 'crit' : 'normal'}`;
    flyEl.innerText = isCrit ? `🔥 ×${mult.toFixed(1)} 天道开光！！` : `×${mult.toFixed(1)} 淬炼精纯`;
    multBox.appendChild(flyEl);
    setTimeout(() => flyEl.remove(), 1000);

    const baseRate = LAYER_UP_RATES[anvilState.layer] || 0.1;
    const actualRate = Math.min(0.98, baseRate + (state.luck - 50) * 0.001);

    if (Math.random() < actualRate) {
      anvilState.layer++;
      anvilState.totalBonusMult *= mult;
      const currentVariance = rollStatVariance(state.luck);
      anvilState.lastVariance = currentVariance;
      const layerGrowth = [1, 1.3, 1.7, 2.3, 3.1, 4.2, 5.8, 8.0, 11.5, 18.0][anvilState.layer - 1] || 2.0;
      anvilState.power = Math.floor(anvilState.recipe.power * layerGrowth * (1 + (mult - 1) * 0.5) * currentVariance);
      for (let s in anvilState.recipe.stats) {
        anvilState.stats[s] = Math.max(1, Math.floor(anvilState.recipe.stats[s] * layerGrowth * currentVariance));
      }
      addLog(`【百炼精进】成功精进至「一阶(${anvilState.layer}层)」！战力提升至 +${anvilState.power}。`, "normal");
      if (anvilState.layer === 10) {
        showToast(`🌟【十层大圆满】逆天改命铸成神兵！战力 +${anvilState.power}`, "blessing");
        stopAutoForge();
      } else {
        showToast(`冲层成功！升至【${anvilState.layer}层】，战力 +${anvilState.power}`, "blessing");
      }
    } else {
      addLog(`【淬火未进】未能冲入下一层，神胚稳固未损。`, "normal");
      showToast(`火候微欠，剑胚稳固未损`, "normal");
    }

    saveGame();
    updateUI();
    renderAnvilUI();
  }

  // 淬火收炉：正式生成神兵，烙印真名
  async function quenchAndFinishForge() {
    if (!anvilState.active) return;
    stopAutoForge();

    if (authState && authState.token) {
      try {
        const res = await fetch("/api/forge/quench", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authState.token}`
          },
          body: JSON.stringify({ anvil: anvilState })
        });
        const data = await res.json();
        if (data.success) {
          state = Object.assign(state, data.user);
          anvilState.active = false;
          document.getElementById("forge-anvil-modal").classList.remove("active");

          addLog(`【权威淬火出炉】道宝「${data.equipment.name}」已由天道服务器盖印真名入册！`, "blessing");
          saveGame();
          updateUI();
          showToast(`【淬火大吉】${data.equipment.name} 铸成入库！战力 +${data.equipment.power}`, "blessing");
          return;
        }
      } catch (e) {
        console.warn("服务端出炉异常，使用本地结算", e);
      }
    }

    const layer = anvilState.layer;
    const recipe = anvilState.recipe;
    const tierData = anvilState.tierData;

    let quality = "凡品";
    let qualityClass = "quality-fan";
    if (layer === 10) { quality = "仙品·大圆满"; qualityClass = "quality-xian"; }
    else if (layer >= 7) { quality = "宝品·通玄"; qualityClass = "quality-bao"; }
    else if (layer >= 4) { quality = "玄品·凝魄"; qualityClass = "quality-xuan"; }
    else { quality = "灵品·清辉"; qualityClass = "quality-ling"; }

    let affix = (layer >= 4 || Math.random() < 0.5) ? AFFIX_POOL[Math.floor(Math.random() * AFFIX_POOL.length)] : null;

    const newEquip = {
      id: "eq_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      tier: anvilState.tier,
      tierName: `${tierData.name}(${layer}层)`,
      tierTag: layer === 10 ? 'tier-3' : (layer >= 5 ? 'tier-2' : 'tier-1'),
      name: `${recipe.name}${layer === 10 ? '·归元' : ''}`,
      slot: recipe.slot,
      quality,
      qualityClass,
      power: anvilState.power,
      stats: anvilState.stats,
      durability: 100,
      maxDurability: 100,
      maker: state.daoName,
      year: "丙午年",
      forgeLuck: state.luck,
      affix: affix,
      lineage: [
        `由道友「${state.daoName}」于百炼锻台挥锤 ${layer} 锻`,
        `最终成器为【${tierData.name}(${layer}层)】！`
      ]
    };

    state.inventory.unshift(newEquip);
    if (!state.equipped[recipe.slot]) state.equipped[recipe.slot] = newEquip;

    anvilState.active = false;
    document.getElementById("forge-anvil-modal").classList.remove("active");

    addLog(`【神兵收炉】亲铸神兵【${newEquip.name}】烙印真名：「${state.daoName} 亲铸」！`, "blessing");
    saveGame();
    updateUI();
    showToast(`【淬火收炉】神兵【${newEquip.name}】已收入藏宝阁！战力 +${newEquip.power}`, "blessing");
  }

  // 渲染藏宝阁
  function renderEquipmentView() {
    const container = document.getElementById("equip-list-container");
    if (!container) return;
    container.innerHTML = "";

    if (state.inventory.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">藏宝阁空空如也，尚未开炉亲铸神兵。<br>快去洞府百炼炉打造属于你的第一件本命仙器！</div>`;
      return;
    }

    state.inventory.forEach(item => {
      const isEquipped = state.equipped[item.slot] && state.equipped[item.slot].id === item.id;
      const card = document.createElement("div");
      card.className = "equip-card";

      card.innerHTML = `
        <div class="equip-title" style="align-items:flex-start;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="equip-art-box" style="width:34px; height:34px; background:#fffcf7; border:1px solid #c9bea9; border-radius:6px; padding:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${getEquipSvgIcon(item.slot, item.qualityClass)}
            </div>
            <div>
              <div>
                <span class="tier-tag ${item.tierTag || 'tier-1'}">${item.tierName || '一阶·炼气'}</span>
                <span class="item-badge ${item.qualityClass}">${item.quality}</span>
                <span style="margin-left:4px; font-weight:bold;">${item.name}</span>
                ${isEquipped ? '<span style="color:#2b7a5a; font-size:11px; margin-left:4px;">[已佩戴]</span>' : ''}
              </div>
              <div style="color:#a63126; font-size:11px; margin-top:2px;">战力 +${item.power}</div>
            </div>
          </div>
        </div>
        <div class="equip-stats">
          <span>部位: ${SLOT_CONFIG[item.slot] ? SLOT_CONFIG[item.slot].name : item.slot}</span>
          <span>属性: ${formatItemStats(item.stats)}</span>
          <span class="equip-durability">耐久: ${item.durability}/${item.maxDurability}</span>
        </div>
        ${item.affix ? `<div class="equip-affix">✦ 气运真言: 【${item.affix.name}】(${item.affix.desc})</div>` : ''}
        <div class="equip-maker-seal">
          <span class="equip-seal-mark">真名印信</span>
          <span>${item.maker} 亲铸 · 铸时福缘: ${item.forgeLuck}</span>
        </div>
        ${item.lineage && item.lineage.length > 1 ? `<div style="font-size:9px; color:#888; margin-top:2px;">因果: ${item.lineage[item.lineage.length - 1]}</div>` : ''}
        <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
          ${item.durability < item.maxDurability ? `<button class="action-btn" onclick="window.game.repairEquip('${item.id}')">修缮(寒铁×2)</button>` : ''}
          <button class="action-btn ${isEquipped ? 'danger' : 'primary'}" onclick="window.game.toggleEquip('${item.id}')">
            ${isEquipped ? '卸下' : '穿戴'}
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function toggleEquip(equipId) {
    const item = state.inventory.find(i => i.id === equipId);
    if (!item) return;

    if (state.equipped[item.slot] && state.equipped[item.slot].id === item.id) {
      state.equipped[item.slot] = null;
      addLog(`卸下了法宝「${item.name}」`, "normal");
    } else {
      state.equipped[item.slot] = item;
      addLog(`穿戴了法宝「${item.name}」，战力激增！`, "blessing");
    }
    saveGame();
    updateUI();
  }

  function repairEquip(equipId) {
    const item = state.inventory.find(i => i.id === equipId);
    if (!item) return;
    if (state.resources.ore_common < 2) {
      alert("修缮法宝需消耗 寒铁矿 ×2！");
      return;
    }
    state.resources.ore_common -= 2;
    item.durability = item.maxDurability;
    addLog(`在洞府炉火中修缮了法宝「${item.name}」，锋芒重现！`, "normal");
    saveGame();
    updateUI();
  }

  // 渲染日志
  function renderLogs() {
    const logBox = document.getElementById("log-scroll-area");
    if (!logBox) return;
    logBox.innerHTML = "";
    state.logs.forEach(log => {
      const div = document.createElement("div");
      div.className = `log-entry ${log.type}`;
      div.innerText = `[${log.time}] ${log.text}`;
      logBox.appendChild(div);
    });
  }

  // 太极 Canvas
  function initTaijiCanvas() {
    const canvas = document.getElementById("taiji-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 130 * dpr;
    canvas.height = 130 * dpr;
    ctx.scale(dpr, dpr);

    let angle = 0;

    function draw() {
      ctx.clearRect(0, 0, 130, 130);
      const cx = 65, cy = 65, r = 58;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180, 160, 130, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.fillStyle = "#faf7ee";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, false);
      ctx.fillStyle = "#26221c";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2, false);
      ctx.fillStyle = "#faf7ee";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, r / 2, r / 2, -Math.PI / 2, Math.PI / 2, false);
      ctx.fillStyle = "#26221c";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, -r / 2, r / 6, 0, Math.PI * 2);
      ctx.fillStyle = "#26221c";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, r / 2, r / 6, 0, Math.PI * 2);
      ctx.fillStyle = "#faf7ee";
      ctx.fill();

      ctx.restore();

      angle += 0.008;
      requestAnimationFrame(draw);
    }

    draw();
  }

  // 打坐点击
  function handleTaijiClick() {
    const realm = REALMS[state.realmIndex];
    let gain = realm.clickExp;
    const isCrit = Math.random() * 100 < (state.luck * 0.35);
    if (isCrit) gain = Math.floor(gain * 2.2);

    state.exp += gain;
    if (Math.random() < 0.25) state.spiritStones += 1;
    if (Math.random() < 0.08) state.luck = Math.min(100, state.luck + 1);

    updateUI();

    const wrapper = document.getElementById("taiji-wrapper");
    const floatEl = document.createElement("div");
    floatEl.className = `float-text ${isCrit ? "crit" : ""}`;
    floatEl.innerText = isCrit ? `+${gain} 修为 (天眷暴击!)` : `+${gain} 修为`;
    floatEl.style.left = `${45 + (Math.random() * 40 - 20)}px`;
    floatEl.style.top = `${30 + (Math.random() * 20 - 10)}px`;
    wrapper.appendChild(floatEl);

    setTimeout(() => floatEl.remove(), 850);
  }

  // 突破
  function handleBreakthrough() {
    const realm = REALMS[state.realmIndex];
    if (state.exp < realm.maxExp) return;

    const roll = Math.floor(Math.random() * 100) + 1;
    const threshold = 100 - state.luck;

    if (roll >= threshold / 2) {
      state.exp -= realm.maxExp;
      state.realmIndex++;
      state.luck = Math.min(100, state.luck + 5);
      addLog(`【突破圆满】成功晋升至「${REALMS[state.realmIndex].name}」！道基大成。`, "blessing");
      showToast(`【突破大吉】恭喜道友晋升至「${REALMS[state.realmIndex].name}」！`, "blessing");
    } else {
      state.exp = Math.floor(state.exp * 0.85);
      state.luck = Math.max(10, state.luck - 8);
      addLog(`【渡劫受阻】心魔突起，破境未果，修为略有倒退。`, "stolen");
      showToast(`渡劫受阻：心魔突起，建议提升福缘后再尝试`, "danger");
    }

    saveGame();
    updateUI();
  }

  // 资源采集
  function gatherResource(type) {
    let gainText = "";
    const isLucky = Math.floor(Math.random() * 100) + 1 < state.luck;

    if (type === "wood") {
      state.resources.wood_common += 3;
      gainText = "获得 青竹木 ×3";
      if (isLucky && Math.random() < 0.3) {
        state.resources.wood_rare += 1;
        gainText += "，偶得「避雷桃木」×1！";
      }
    } else if (type === "ore") {
      state.resources.ore_common += 3;
      gainText = "开采出 寒铁矿 ×3";
      if (isLucky && Math.random() < 0.25) {
        state.resources.ore_rare += 1;
        gainText += "，深处得「赤阳精金」×1！";
      }
    } else if (type === "herb") {
      state.resources.herb_common += 2;
      gainText = "采得 凝血芝 ×2";
      if (isLucky && Math.random() < 0.2) {
        state.resources.herb_rare += 1;
        gainText += "，药圃伴生仙草「九叶玉芝」×1！";
      }
    }

    addLog(`洞府百工：进行采撷，${gainText}`, isLucky ? "blessing" : "normal");
    saveGame();
    updateUI();
  }

  // ==========================================
  // === 模式 1：论道台 (灵气骰博弈) ===
  // ==========================================
  let duelState = {
    active: false,
    enemy: null,
    playerHp: 100,
    enemyHp: 100,
    round: 1,
    playerDices: [1, 1, 1],
    enemyDices: [1, 1, 1]
  };

  function startDuel() {
    const oppoName = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
    const oppoPower = Math.floor(calculateTotalAttributes().power * (0.8 + Math.random() * 0.4));

    duelState = {
      active: true,
      enemy: { name: oppoName, power: oppoPower },
      playerHp: 100,
      enemyHp: 100,
      round: 1,
      playerDices: [3, 4, 5],
      enemyDices: [2, 3, 4]
    };

    document.getElementById("duel-modal").classList.add("active");
    updateDuelUI();
  }

  function updateDuelUI() {
    document.getElementById("duel-enemy-name").innerText = `${duelState.enemy.name} (战力 ${duelState.enemy.power})`;
    document.getElementById("duel-player-hp").innerText = duelState.playerHp;
    document.getElementById("duel-enemy-hp").innerText = duelState.enemyHp;
    document.getElementById("duel-round-text").innerText = `第 ${duelState.round} 回合`;

    const pContainer = document.getElementById("duel-player-dices");
    pContainer.innerHTML = "";
    duelState.playerDices.forEach(d => {
      const el = document.createElement("div");
      el.className = "dice-cube";
      el.innerText = d;
      pContainer.appendChild(el);
    });

    const eContainer = document.getElementById("duel-enemy-dices");
    eContainer.innerHTML = "";
    duelState.enemyDices.forEach(d => {
      const el = document.createElement("div");
      el.className = "dice-cube";
      el.innerText = d;
      eContainer.appendChild(el);
    });
  }

  function executeDuelRound() {
    const pDices = [];
    const eDices = [];

    // 装备词条干预检测
    let minD = 1;
    Object.values(state.equipped).forEach(eq => {
      if (eq && eq.affix && eq.affix.effect && eq.affix.effect.minDice) {
        minD = Math.max(minD, eq.affix.effect.minDice);
      }
    });

    for (let i = 0; i < 3; i++) {
      pDices.push(Math.max(minD, Math.floor(Math.random() * 6) + 1));
      eDices.push(Math.floor(Math.random() * 6) + 1);
    }

    duelState.playerDices = pDices;
    duelState.enemyDices = eDices;

    const pSum = pDices.reduce((a, b) => a + b, 0);
    const eSum = eDices.reduce((a, b) => a + b, 0);

    const playerPow = calculateTotalAttributes().power;
    const pDmg = Math.max(10, Math.floor(pSum * (playerPow / 15)));
    const eDmg = Math.max(8, Math.floor(eSum * (duelState.enemy.power / 15)));

    duelState.enemyHp = Math.max(0, duelState.enemyHp - pDmg);
    duelState.playerHp = Math.max(0, duelState.playerHp - eDmg);

    updateDuelUI();

    if (duelState.enemyHp <= 0 || duelState.playerHp <= 0) {
      setTimeout(() => {
        if (duelState.enemyHp <= 0) {
          state.spiritStones += 15;
          state.exp += 50;
          addLog(`【论道大捷】击败同门「${duelState.enemy.name}」，收获灵石+15、修为+50！`, "battle");
          showToast(`【论道大捷】击破「${duelState.enemy.name}」气机，获胜！`, "battle");
        } else {
          addLog(`【论道落败】不敌同门「${duelState.enemy.name}」，回洞府闭门思过。`, "normal");
          showToast(`【论道惜败】同门「${duelState.enemy.name}」略胜一筹`, "normal");
        }
        document.getElementById("duel-modal").classList.remove("active");
        saveGame();
        updateUI();
      }, 500);
    } else {
      duelState.round++;
    }
  }

  // ==========================================
  // === 模式 2：太虚秘境 (搜打撤 Extraction) ===
  // ==========================================
  function enterExtraction() {
    const hasEquip = Object.values(state.equipped).some(e => e !== null);
    let warning = "【秘境警示】\n太虚秘境乃高风险之地，在其中搜刮之物需通过「归返古阵」撤离才能带回！\n";
    if (hasEquip) {
      warning += "\n【极其重要】：你已穿戴真名装备！若在秘境遭遇战中战败，对方将有极高概率【杀人夺宝】，掠夺你辛苦打造的神兵！你确定要带装涉险吗？";
    }

    if (!confirm(warning)) return;

    state.extraction.active = true;
    state.extraction.floor = 1;
    state.extraction.ap = 6;
    state.extraction.tempLoot = [];
    state.extraction.currentEnemy = null;

    document.getElementById("extraction-modal").classList.add("active");
    updateExtractionUI();
    addLog(`【步入秘境】踏入太虚古墟，荒古煞气扑面而来……`, "normal");
  }

  function updateExtractionUI() {
    document.getElementById("extract-floor-text").innerText = `第 ${state.extraction.floor} 重古迹`;
    document.getElementById("extract-ap-text").innerText = `行动气力: ${state.extraction.ap}`;

    const lootGrid = document.getElementById("extract-loot-grid");
    lootGrid.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      const slot = document.createElement("div");
      slot.className = "loot-slot";
      if (state.extraction.tempLoot[i]) {
        const item = state.extraction.tempLoot[i];
        slot.innerHTML = `<span style="color:#d4a34b;">${item.name}</span><br><span style="color:#888;">x${item.count}</span>`;
      } else {
        slot.innerHTML = `<span style="color:#555;">[虚位]</span>`;
      }
      lootGrid.appendChild(slot);
    }

    if (!state.extraction.currentEnemy) {
      document.getElementById("extract-explore-btn").style.display = "inline-block";
      document.getElementById("extract-escape-btn").style.display = "inline-block";
      document.getElementById("extract-fight-btn").style.display = "none";
    } else {
      document.getElementById("extract-explore-btn").style.display = "none";
      document.getElementById("extract-escape-btn").style.display = "none";
      document.getElementById("extract-fight-btn").style.display = "inline-block";
    }
  }

  function extractionExplore() {
    if (state.extraction.ap <= 0) {
      alert("气力耗尽！必须寻找归返石阵撤离，否则有崩塌之危！");
      return;
    }
    state.extraction.ap--;
    const roll = Math.random();
    const eventBox = document.getElementById("extract-event-box");

    if (roll < 0.45) {
      const loots = [
        { name: "赤阳精金", count: 1, type: "ore_rare" },
        { name: "古修灵石", count: 35, type: "stones" },
        { name: "避雷桃木", count: 1, type: "wood_rare" },
        { name: "九叶玉芝", count: 1, type: "herb_rare" }
      ];
      const found = loots[Math.floor(Math.random() * loots.length)];
      state.extraction.tempLoot.push(found);
      eventBox.innerHTML = `<div style="color:#2b7a5a;">【机缘降临】翻出古修遗物：<b>${found.name} ×${found.count}</b>！已收入临时储物袋。</div>`;
    } else if (roll < 0.85) {
      const oppoName = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
      const oppoPower = Math.floor(calculateTotalAttributes().power * (0.85 + Math.random() * 0.45));
      state.extraction.currentEnemy = { name: oppoName, power: oppoPower, hasEquip: Math.random() < 0.65 };
      eventBox.innerHTML = `
        <div style="color:#c93b2b; font-weight:bold;">
          【狭路相逢】同门修士「${oppoName}」自暗处闪出！<br>
          见你身负宝物，誓要【杀人夺宝】！(敌方战力: ${oppoPower})
        </div>
      `;
    } else {
      eventBox.innerHTML = `<div style="color:#d4a34b;">【天道佑护】眼前出现一座完好的「归返古阵」，灵石充盈，可随时引导撤离！</div>`;
    }

    updateExtractionUI();
  }

  function extractionFight() {
    const enemy = state.extraction.currentEnemy;
    if (!enemy) return;

    const playerRoll = Math.floor(Math.random() * 100) + 1;
    const enemyRoll = Math.floor(Math.random() * 100) + 1;
    const totalPow = calculateTotalAttributes().power;

    const playerTotal = playerRoll + Math.floor(totalPow / 10) + Math.floor(state.luck / 5);
    const enemyTotal = enemyRoll + Math.floor(enemy.power / 10) + 10;

    let resultMsg = `【天道斗法争锋】\n你掷出天道骰：${playerRoll} (综合点数: ${playerTotal})\n对方掷出天道骰：${enemyRoll} (综合点数: ${enemyTotal})\n\n`;

    if (playerTotal >= enemyTotal) {
      // 玩家获胜
      resultMsg += `【大获全胜】你击破「${enemy.name}」的护体法罩，对方重创败遁！\n`;
      state.extraction.tempLoot.push({ name: "缴获灵石", count: 40, type: "stones" });

      // 概率夺取对方亲铸装备
      if (enemy.hasEquip && Math.random() < 0.5) {
        const stolenEquip = {
          id: "stolen_" + Date.now(),
          tier: 2,
          tierName: "二阶·筑基",
          tierTag: "tier-2",
          name: "寒月绝影飞剑",
          slot: "weapon",
          quality: "宝品·通玄",
          qualityClass: "quality-bao",
          power: 95,
          stats: { atk: 88 },
          durability: 85,
          maxDurability: 100,
          maker: enemy.name,
          year: "乙卯年",
          forgeLuck: 85,
          affix: AFFIX_POOL[0],
          lineage: [
            `由同门「${enemy.name}」亲铸`,
            `于太虚秘境被道友「${state.daoName}」正面击溃并【杀人夺宝】强行缴获！`
          ]
        };
        state.inventory.unshift(stolenEquip);
        resultMsg += `\n✦【杀人夺宝】缴获了对方身上的亲铸装备：【${stolenEquip.name}】(${enemy.name} 亲铸)！\n`;
        addLog(`【杀人夺宝】正面击溃「${enemy.name}」，缴获其亲铸法宝「${stolenEquip.name}」！`, "blessing");
      }

      if (Math.random() < 0.35) {
        resultMsg += `✦【抽取心火】抽取其一丝本命心火，自身福缘沸腾！\n`;
        state.luck = Math.min(100, state.luck + 4);
      }

      state.extraction.currentEnemy = null;
      showToast(`【大获全胜】击破「${enemy.name}」护体法罩，缴获大量灵宝！`, "blessing");
    } else {
      // 玩家战败：高风险惩罚
      resultMsg += `【战败受创】你真元枯竭，被「${enemy.name}」轰退十丈！\n`;
      resultMsg += `• 临时储物袋中刚搜到的所有宝物全部被抢空！\n`;

      // 随机从 8 个槽位中夺取或损坏一件
      const equippedKeys = Object.keys(state.equipped).filter(k => state.equipped[k] !== null);
      if (equippedKeys.length > 0) {
        const targetSlot = equippedKeys[Math.floor(Math.random() * equippedKeys.length)];
        const targetEquip = state.equipped[targetSlot];

        if (Math.random() < 0.45) {
          state.equipped[targetSlot] = null;
          state.inventory = state.inventory.filter(i => i.id !== targetEquip.id);
          resultMsg += `\n🚨【奇耻大辱·法宝被夺】对方冷笑斩断血脉契约，将你亲铸的【${targetEquip.name}】强行夺走！\n`;
          addLog(`【奇耻大辱】秘境战败，亲铸本命法宝「${targetEquip.name}」被同门「${enemy.name}」夺走！`, "stolen");
          showToast(`【法宝被夺】亲铸「${targetEquip.name}」被同门夺走！`, "danger");
        } else {
          targetEquip.durability = Math.max(0, targetEquip.durability - 50);
          resultMsg += `\n• 你的法宝【${targetEquip.name}】器灵护主受创，耐久暴跌 50 点！需回百炼炉修缮。\n`;
          showToast(`法宝「${targetEquip.name}」耐久暴跌50点`, "danger");
        }
      }

      state.heartFire = Math.max(0, state.heartFire - 1);
      state.luck = Math.max(10, state.luck - 10);
      resultMsg += `\n🚨【心火被盗】「${enemy.name}」狞笑盗取了你的本命心火！(心火剩余: ${state.heartFire}/${state.maxHeartFire})\n`;
      addLog(`【惨痛遇劫】同门弟子「${enemy.name}」盗取我本命心火！气运受挫！`, "stolen");

      state.extraction.active = false;
      document.getElementById("extraction-modal").classList.remove("active");
      saveGame();
      updateUI();
      showToast(`秘境战败：本命心火被盗，临时储物袋洗劫一空！`, "danger");
      return;
    }

    updateExtractionUI();
  }

  function extractionEscape() {
    let report = "【安全撤离·满载而归】带回战利品：";
    state.extraction.tempLoot.forEach(item => {
      report += ` ${item.name}×${item.count};`;
      if (item.type === "stones") state.spiritStones += item.count;
      else if (state.resources[item.type] !== undefined) state.resources[item.type] += item.count;
    });

    state.extraction.active = false;
    document.getElementById("extraction-modal").classList.remove("active");
    addLog(`【大捷归府】从太虚古墟成功撤离，带回大量珍稀矿植与灵宝！`, "blessing");
    saveGame();
    updateUI();
    showToast(state.extraction.tempLoot.length > 0 ? report : "安全撤离出太虚古墟", "blessing");
  }

  // ==========================================
  // === 数据库支持：排行榜与交易行 ===
  // ==========================================
  let currentRankTab = "power";

  async function syncWithServer() {
    try {
      const realm = REALMS[state.realmIndex];
      const stats = calculateTotalAttributes();
      const payload = {
        id: "player_" + (localStorage.getItem("xiuxian_uid") || (Date.now() + "_" + Math.floor(Math.random()*1000))),
        dao_name: state.daoName,
        realm: realm.name,
        realm_index: state.realmIndex,
        power: stats.power,
        luck: state.luck,
        heart_fire: state.heartFire,
        spirit_stones: state.spiritStones,
        full_state: state
      };
      if (!localStorage.getItem("xiuxian_uid")) {
        localStorage.setItem("xiuxian_uid", payload.id.replace("player_", ""));
      }

      await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  }

  async function fetchLeaderboard() {
    const rankBox = document.getElementById("rank-list-box");
    if (!rankBox) return;
    rankBox.innerHTML = "<div style='text-align:center; padding:15px; font-size:11px; color:#888;'>天道神识感应中……</div>";

    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (!data.success) return;

      const list = currentRankTab === "power" ? data.power_rank : data.luck_rank;
      rankBox.innerHTML = "";

      list.forEach((item, index) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#fdfbf7; border:1px solid #c9bea9; border-radius:8px; padding:8px 10px;";
        const rankBadge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;

        row.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:bold; font-size:14px; width:22px; text-align:center;">${rankBadge}</span>
            <div>
              <div style="font-size:12px; font-weight:bold;">${item.name} <span style="font-size:10px; color:#756a5c;">[${item.realm}]</span></div>
              <div style="font-size:10px; color:#b37400;">气运福缘: ${item.luck}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px; font-weight:bold; color:#a63126;">战力 ${item.power}</div>
            <div style="font-size:9px; color:#888;">灵石: ${item.stones || 0}</div>
          </div>
        `;
        rankBox.appendChild(row);
      });
    } catch (e) {
      rankBox.innerHTML = "<div style='text-align:center; padding:15px; font-size:11px; color:#888;'>暂未连接云端数据库</div>";
    }
  }

  function switchRankTab(type) {
    currentRankTab = type;
    document.getElementById("rank-tab-power").className = `action-btn ${type === 'power' ? 'gold' : ''}`;
    document.getElementById("rank-tab-luck").className = `action-btn ${type === 'luck' ? 'gold' : ''}`;
    fetchLeaderboard();
  }

  async function fetchMarketItems() {
    const marketBox = document.getElementById("market-list-box");
    if (!marketBox) return;
    marketBox.innerHTML = "<div style='text-align:center; padding:15px; font-size:11px; color:#888;'>万宝楼掌柜正整理在售宝录……</div>";

    try {
      const res = await fetch("/api/market/list");
      const data = await res.json();
      if (!data.success) return;

      marketBox.innerHTML = "";
      if (data.items.length === 0) {
        marketBox.innerHTML = "<div style='text-align:center; padding:20px; font-size:11px; color:#888;'>坊市当前暂无在售法宝，欢迎道友上架亲铸神兵！</div>";
        return;
      }

      data.items.forEach(item => {
        const card = document.createElement("div");
        card.className = "equip-card";
        const itData = item.item_data;

        card.innerHTML = `
          <div class="equip-title">
            <span>
              ${item.item_type === 'equipment' ? `
                <span class="tier-tag ${itData.tierTag || 'tier-1'}">${itData.tierName || '一阶'}</span>
                <span class="item-badge ${itData.qualityClass}">${itData.quality}</span>
              ` : '<span class="item-badge" style="background:#d4e9d7; color:#205c44;">灵材</span>'}
              <span style="margin-left:4px;">${item.item_name}</span>
            </span>
            <span style="color:#d4a34b; font-size:13px; font-weight:bold;">${item.price} 灵石</span>
          </div>
          ${item.item_type === 'equipment' ? `
            <div class="equip-stats">
              <span>部位: ${SLOT_CONFIG[itData.slot] ? SLOT_CONFIG[itData.slot].name : itData.slot}</span>
              <span>战力 +${itData.power}</span>
            </div>
            ${itData.affix ? `<div class="equip-affix">✦ 气运真言: 【${itData.affix.name}】(${itData.affix.desc})</div>` : ''}
            <div class="equip-maker-seal">
              <span class="equip-seal-mark">真名印信</span>
              <span>${itData.maker} 亲铸 · 铸时福缘: ${itData.forgeLuck}</span>
            </div>
          ` : `
            <div style="font-size:10px; color:#756a5c; margin:4px 0;">${itData.desc || '珍贵药草与矿石'}</div>
          `}
          <div style="margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:10px; color:#888;">卖家: 道友「${item.seller_name}」</span>
            <button class="action-btn gold" onclick="window.game.buyMarketItem('${item.id}', ${item.price})">购买</button>
          </div>
        `;
        marketBox.appendChild(card);
      });
    } catch (e) {
      marketBox.innerHTML = "<div style='text-align:center; padding:15px; font-size:11px; color:#888;'>暂未连接云端交易行服务</div>";
    }
  }

  function openSellModal() {
    const select = document.getElementById("sell-item-select");
    select.innerHTML = "";

    const equippedIds = Object.values(state.equipped).filter(e => e !== null).map(e => e.id);
    const unequipped = state.inventory.filter(i => !equippedIds.includes(i.id));

    if (unequipped.length === 0) {
      alert("背包中没有空闲的法宝！(已佩戴的法宝请先在【角色】或【宝阁】中卸下，或在【洞府】重新开炉)");
      return;
    }

    unequipped.forEach(i => {
      const opt = document.createElement("option");
      opt.value = i.id;
      opt.innerText = `[${i.tierName || '一阶'}][${i.quality}] ${i.name} (战力+${i.power}) - ${i.maker} 亲铸`;
      select.appendChild(opt);
    });

    document.getElementById("sell-modal").classList.add("active");
  }

  async function confirmSellItem() {
    const select = document.getElementById("sell-item-select");
    const priceInput = document.getElementById("sell-price-input");
    const equipId = select.value;
    const price = parseInt(priceInput.value, 10);

    if (!equipId || isNaN(price) || price <= 0) {
      showToast("请输入正确的寄售标价！", "danger");
      return;
    }

    const item = state.inventory.find(i => i.id === equipId);
    if (!item) return;

    try {
      const res = await fetch("/api/market/list_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: localStorage.getItem("xiuxian_uid") || "player_local",
          seller_name: state.daoName,
          item_name: item.name,
          item_type: "equipment",
          price: price,
          item_data: item
        })
      });
      const data = await res.json();
      if (data.success) {
        state.inventory = state.inventory.filter(i => i.id !== equipId);
        addLog(`【万宝楼寄售】您将亲铸的「${item.name}」以 ${price} 灵石挂牌上架！`, "blessing");
        document.getElementById("sell-modal").classList.remove("active");
        saveGame();
        updateUI();
        fetchMarketItems();
        showToast(`【挂牌成功】「${item.name}」已陈列坊市，标价 ${price} 灵石`, "blessing");
      }
    } catch (e) {
      showToast("上架未成，网络微恙", "danger");
    }
  }

  async function buyMarketItem(marketItemId, price) {
    if (state.spiritStones < price) {
      showToast(`灵石不足！需要 ${price} 灵石，当前有 ${state.spiritStones}`, "danger");
      return;
    }

    try {
      const res = await fetch("/api/market/buy_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: marketItemId,
          buyer_id: localStorage.getItem("xiuxian_uid") || "player_local",
          buyer_name: state.daoName,
          buyer_stones: state.spiritStones
        })
      });
      const data = await res.json();
      if (data.success) {
        state.spiritStones -= price;
        if (data.item_type === "equipment") {
          state.inventory.unshift(data.item_data);
          addLog(`【万宝楼得宝】花费 ${price} 灵石购得同门法宝「${data.item_data.name}」(${data.item_data.maker} 亲铸)！`, "blessing");
          showToast(`【购宝成功】法宝「${data.item_data.name}」已收入藏宝阁！`, "blessing");
        } else {
          const mat = data.item_data;
          if (state.resources[mat.type] !== undefined) state.resources[mat.type] += mat.count;
          addLog(`【坊市购材】购入灵材「${mat.name} ×${mat.count}」！`, "blessing");
          showToast(`【购材成功】灵材已收入洞府百工仓库！`, "blessing");
        }
        saveGame();
        updateUI();
        fetchMarketItems();
      } else {
        showToast(data.error || "购买未成", "danger");
      }
    } catch (e) {
      showToast("购买失败，通讯有阻", "danger");
    }
  }

  // === 阿尔比恩专精命运盘渲染与计算 ===
  function getMasteryReqXp(level) {
    return Math.floor(100 * Math.pow(1.055, Math.max(0, level - 1)));
  }

  function renderMasteryView() {
    const smithing = state.mastery?.smithing || { level: 1, xp: 0 };
    const smithLvlEl = document.getElementById("mastery-lvl-smithing");
    const smithBonusEl = document.getElementById("mastery-bonus-smithing");
    const smithBarEl = document.getElementById("mastery-bar-smithing");
    const smithXpEl = document.getElementById("mastery-xp-smithing");

    const smithBonus = (((smithing.level - 1) / 99.0) * 25.0).toFixed(1);
    if (smithLvlEl) smithLvlEl.innerText = `Lv.${smithing.level} / 100`;
    if (smithBonusEl) smithBonusEl.innerText = `+${smithBonus}%`;
    const smithReq = getMasteryReqXp(smithing.level);
    const smithPct = Math.min(100, Math.floor((smithing.xp / smithReq) * 100));
    if (smithBarEl) smithBarEl.style.width = smithPct + "%";
    if (smithXpEl) smithXpEl.innerText = `熟练度: ${smithing.xp} / ${smithReq}`;

    const grid = document.getElementById("mastery-grid-container");
    if (!grid) return;
    grid.innerHTML = "";

    const slotKeys = ["weapon", "armor", "head", "hand", "foot", "offhand", "necklace", "ring"];
    slotKeys.forEach(sKey => {
      const cfg = SLOT_CONFIG[sKey];
      const node = state.mastery?.[sKey] || { level: 1, xp: 0 };
      const req = getMasteryReqXp(node.level);
      const pct = Math.min(100, Math.floor((node.xp / req) * 100));
      const bonusPct = (((node.level - 1) / 99.0) * 25.0).toFixed(1);

      const div = document.createElement("div");
      div.className = "mastery-node";
      div.innerHTML = `
        <div class="mastery-node-header">
          <span>${cfg.icon} ${cfg.name}专精</span>
          <span style="color:#2b7a5a;">Lv.${node.level}</span>
        </div>
        <div style="font-size:9px; color:#888;">单部位冲层加成: <b style="color:#b37400;">+${bonusPct}%</b></div>
        <div class="mastery-progress-bar">
          <div class="mastery-progress-fill" style="width:${pct}%;"></div>
        </div>
        <div style="font-size:8px; color:#aaa; text-align:right;">${node.xp}/${req}</div>
      `;
      grid.appendChild(div);
    });
  }

  // === 洞府仙山家园系统 ===
  function renderHomesteadView() {
    const home = state.homestead || { mineLevel: 1, forestLevel: 1, herbLevel: 1, lastCollectTime: Date.now() };
    const mineEl = document.getElementById("home-lvl-mine");
    const forestEl = document.getElementById("home-lvl-forest");
    const herbEl = document.getElementById("home-lvl-herb");
    if (mineEl) mineEl.innerText = `${home.mineLevel}级 (${(home.mineLevel * 0.1).toFixed(1)}矿/秒)`;
    if (forestEl) forestEl.innerText = `${home.forestLevel}级 (${(home.forestLevel * 0.1).toFixed(1)}木/秒)`;
    if (herbEl) herbEl.innerText = `${home.herbLevel}级 (${(home.herbLevel * 0.08).toFixed(2)}药/秒)`;

    fetchWorldEvents();
  }

  async function collectHomesteadResources() {
    if (authState && authState.token) {
      try {
        const res = await fetch("/api/homestead/collect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authState.token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          state.resources = data.resources;
          state.homestead = data.homestead;
          saveGame();
          updateUI();
          renderHomesteadView();
          addLog(`【洞府灵脉大成】一键收纳灵材：寒铁矿+${data.gains.ore}，青竹木+${data.gains.wood}，凝血芝+${data.gains.herb}！`, "blessing");
          showToast(`【灵脉丰收】寒铁+${data.gains.ore}，青竹+${data.gains.wood}，灵芝+${data.gains.herb}`, "blessing");
          return;
        } else {
          showToast(data.error || "灵脉积蓄未足", "normal");
          return;
        }
      } catch (e) {
        console.warn("服务端收获失败，执行离线收获", e);
      }
    }

    // 离线收获计算
    const home = state.homestead || { mineLevel: 1, forestLevel: 1, herbLevel: 1, lastCollectTime: Date.now() };
    const now = Date.now();
    const elapsed = Math.max(5, Math.min(86400, Math.floor((now - (home.lastCollectTime || now)) / 1000)));
    const mineGain = Math.floor(elapsed * 0.1 * home.mineLevel);
    const forestGain = Math.floor(elapsed * 0.1 * home.forestLevel);
    const herbGain = Math.floor(elapsed * 0.08 * home.herbLevel);

    state.resources.ore_common += mineGain;
    state.resources.wood_common += forestGain;
    state.resources.herb_common += herbGain;
    home.lastCollectTime = now;
    state.homestead = home;

    saveGame();
    updateUI();
    renderHomesteadView();
    addLog(`【洞府采收】收获矿石+${mineGain}，灵木+${forestGain}，仙草+${herbGain}！`, "blessing");
    showToast(`【灵脉收获】寒铁+${mineGain}，青竹+${forestGain}，凝血芝+${herbGain}`, "blessing");
  }

  async function upgradeHomesteadFacility(facility) {
    const home = state.homestead || { mineLevel: 1, forestLevel: 1, herbLevel: 1 };
    const curLvl = home[`${facility}Level`] || 1;
    const cost = curLvl * 30;

    if (state.spiritStones < cost) {
      showToast(`灵石不足！升级需要 ${cost} 灵石，当前仅有 ${state.spiritStones}`, "danger");
      return;
    }

    if (authState && authState.token) {
      try {
        const res = await fetch("/api/homestead/upgrade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authState.token}`
          },
          body: JSON.stringify({ facility })
        });
        const data = await res.json();
        if (data.success) {
          state.spiritStones = data.spiritStones;
          home[`${facility}Level`] = data.newLevel;
          state.homestead = home;
          saveGame();
          updateUI();
          renderHomesteadView();
          addLog(`【仙府扩建】${facility === 'mine' ? '聚灵铁矿脉' : facility === 'forest' ? '千竿青竹幽林' : '回阳灵药圃'}晋升至 ${data.newLevel} 级！自产速率提升！`, "blessing");
          return;
        }
      } catch (e) {}
    }

    state.spiritStones -= cost;
    home[`${facility}Level`] = curLvl + 1;
    state.homestead = home;
    saveGame();
    updateUI();
    renderHomesteadView();
    addLog(`【仙府扩建】设施晋升至 ${curLvl + 1} 级！`, "blessing");
  }

  // === 全服世界通报与高阶素材争夺 ===
  function setWorldBroadcast(text) {
    const el = document.getElementById("world-broadcast-text");
    if (el) el.innerText = text;
  }

  async function fetchWorldEvents() {
    const contestBox = document.getElementById("world-contest-list");
    if (!contestBox) return;

    try {
      const res = await fetch("/api/world/events");
      const data = await res.json();
      if (!data.success) return;

      contestBox.innerHTML = "";
      if (data.events.length === 0) {
        contestBox.innerHTML = `<div style="text-align:center; padding:10px; font-size:11px; color:#888;">暂无全服争夺事件</div>`;
        return;
      }

      data.events.forEach(ev => {
        const card = document.createElement("div");
        card.className = "contest-item-card";
        card.innerHTML = `
          <div>
            <div style="font-size:11px; font-weight:bold; color:#a63126;">${ev.content}</div>
            <div style="font-size:9px; color:#888;">时间: ${ev.time || '不久前'}</div>
          </div>
          <div>
            <button class="action-btn danger" style="font-size:10px; padding:3px 8px;" onclick="window.game.participateWorldContest('${ev.id}')">
              出击争夺
            </button>
          </div>
        `;
        contestBox.appendChild(card);
      });

      if (data.events[0]) {
        setWorldBroadcast(data.events[0].content);
      }
    } catch (e) {}
  }

  async function participateWorldContest(eventId) {
    if (!authState || !authState.token) {
      showToast("请先登录专属修行账号方可参与全服争夺！", "danger");
      openAuthModal();
      return;
    }

    try {
      const res = await fetch("/api/world/contest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authState.token}`
        },
        body: JSON.stringify({ eventId })
      });
      const data = await res.json();
      if (data.success) {
        state.resources = data.resources;
        saveGame();
        updateUI();
        fetchWorldEvents();
        showToast(data.msg, data.win ? "blessing" : "danger");
        addLog(data.msg, data.win ? "blessing" : "stolen");
      } else {
        showToast(data.error || "争夺未果", "danger");
      }
    } catch (e) {
      showToast("全服气机震荡，通讯暂阻", "danger");
    }
  }

  // 导航切换
  function switchTab(pageId) {
    document.querySelectorAll(".page-view").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-tab").forEach(el => el.classList.remove("active"));

    const targetPage = document.getElementById(`page-${pageId}`);
    const targetTab = document.getElementById(`tab-${pageId}`);
    if (targetPage) targetPage.classList.add("active");
    if (targetTab) targetTab.classList.add("active");

    if (pageId === "rank") fetchLeaderboard();
    if (pageId === "market") fetchMarketItems();
    if (pageId === "bag") renderEquipmentView();
    if (pageId === "character") updateUI();
    if (pageId === "mastery") renderMasteryView();
    if (pageId === "homestead") renderHomesteadView();
  }

  // 挂机循环
  function gameTick() {
    const realm = REALMS[state.realmIndex];
    state.exp += realm.secExp;
    if (Math.random() < 0.2) state.spiritStones += 1;
    if (state.heartFire < state.maxHeartFire && Math.random() < 0.05) {
      state.heartFire++;
      addLog("本命心火在体内重新凝聚复燃，元气渐复", "blessing");
    }
    updateUI();
  }

  // === 微灵气粒子画布 (升腾浮动金青光粒) ===
  function initCharacterParticles() {
    const canvas = document.getElementById("char-particles-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = (rect.width || 175) * dpr;
    canvas.height = (rect.height || 280) * dpr;
    ctx.scale(dpr, dpr);

    const particles = [];
    for (let i = 0; i < 22; i++) {
      particles.push({
        x: Math.random() * (rect.width || 175),
        y: Math.random() * (rect.height || 280),
        r: Math.random() * 2 + 0.8,
        speed: Math.random() * 0.6 + 0.3,
        alpha: Math.random() * 0.7 + 0.2,
        color: Math.random() < 0.6 ? "212, 163, 75" : "75, 185, 130"
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, rect.width || 175, rect.height || 280);
      particles.forEach(p => {
        p.y -= p.speed;
        p.alpha -= 0.003;
        if (p.y < 0 || p.alpha <= 0) {
          p.y = (rect.height || 280) + 5;
          p.x = Math.random() * (rect.width || 175);
          p.alpha = Math.random() * 0.7 + 0.3;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.shadowBlur = 4;
        ctx.fill();
      });
      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  // ==========================================
  // === 账号系统与服务器鉴权管理 ===
  // ==========================================
  let authState = {
    token: localStorage.getItem("xiuxian_token") || null,
    username: localStorage.getItem("xiuxian_username") || null,
    isOnline: false
  };

  function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    const nameInput = document.getElementById("auth-daoname-input");
    const userInput = document.getElementById("auth-username-input");
    if (nameInput) nameInput.value = state.daoName || "";
    if (userInput && authState.username) userInput.value = authState.username;
    modal.classList.add("active");
  }

  async function submitAuthRegister() {
    const nameInput = document.getElementById("auth-daoname-input");
    const userInput = document.getElementById("auth-username-input");
    const passInput = document.getElementById("auth-password-input");

    const daoName = nameInput.value.trim();
    const username = userInput.value.trim();
    const password = passInput.value.trim();

    if (!daoName || !username || !password) {
      alert("请填写完整道号、修行账号与道心密押！");
      return;
    }
    if (password.length < 6) {
      alert("道心密押至少需 6 位字符以固神识防测！");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daoName, username, password })
      });
      const data = await res.json();
      if (data.success) {
        authState.token = data.token;
        authState.username = username;
        authState.isOnline = true;
        localStorage.setItem("xiuxian_token", data.token);
        localStorage.setItem("xiuxian_username", username);

        if (data.user) {
          state.daoName = data.user.daoName;
        } else {
          state.daoName = daoName;
        }

        saveGame();
        updateUI();
        document.getElementById("auth-modal").classList.remove("active");
        addLog(`【开辟道途】成功注册专属修行账号「${username}」，真名「${state.daoName}」已入天道仙册！`, "blessing");
        alert(`【天道仙册·立道成功】\n恭喜道友！专属修行账号【${username}】已成，真名【${state.daoName}】！\n后续一切锻造、神兵与历练均由天道服务器权威核验。`);
      } else {
        alert(data.error || "开辟道途失败，请稍后重试");
      }
    } catch (e) {
      // 离线/本地模式降级支持
      state.daoName = daoName;
      authState.username = username;
      saveGame();
      updateUI();
      document.getElementById("auth-modal").classList.remove("active");
      addLog(`【开辟道途】已在本地立道，真名「${daoName}」！`, "blessing");
      alert(`【立道大吉】道号「${daoName}」已立！`);
    }
  }

  async function submitAuthLogin() {
    const userInput = document.getElementById("auth-username-input");
    const passInput = document.getElementById("auth-password-input");

    const username = userInput.value.trim();
    const password = passInput.value.trim();

    if (!username || !password) {
      alert("请输入修行账号与密押！");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        authState.token = data.token;
        authState.username = username;
        authState.isOnline = true;
        localStorage.setItem("xiuxian_token", data.token);
        localStorage.setItem("xiuxian_username", username);

        if (data.user) {
          // 云端数据回填合并
          state = Object.assign(state, data.user);
        }

        saveGame();
        updateUI();
        document.getElementById("auth-modal").classList.remove("active");
        addLog(`【道心归位】账号「${username}」登入成功，云端本命真身已同步归位！`, "blessing");
        alert(`【道心归位·登入成功】\n欢迎归来，道友【${state.daoName}】！`);
      } else {
        alert(data.error || "登入未谐，请核验密押");
      }
    } catch (e) {
      alert("服务器连接微恙，请稍候重试");
    }
  }

  // 启动
  window.addEventListener("DOMContentLoaded", () => {
    loadSavedGame();
    initTaijiCanvas();
    initCharacterParticles();
    updateUI();
    renderLogs();

    document.getElementById("taiji-wrapper").addEventListener("click", handleTaijiClick);
    document.getElementById("breakthrough-btn").addEventListener("click", handleBreakthrough);

    setInterval(gameTick, 1000);
    setInterval(saveGame, 10000);
    setTimeout(syncWithServer, 2000);
    setInterval(syncWithServer, 20000);
  });

  window.game = {
    switchTab,
    gatherResource,
    toggleEquip,
    repairEquip,
    startDuel,
    executeDuelRound,
    enterExtraction,
    extractionExplore,
    extractionFight,
    extractionEscape,
    switchRankTab,
    fetchMarketItems,
    openSellModal,
    confirmSellItem,
    buyMarketItem,
    openSlotInspect,
    unequipSlot,
    unequipSlotDirect,
    equipItemFromInspect,
    switchForgeTier,
    forgeItemByRecipe,
    strikeAnvilHammer,
    quenchAndFinishForge,
    closeAnvilModal,
    toggleAutoForge,
    openAuthModal,
    submitAuthRegister,
    submitAuthLogin,
    collectHomesteadResources,
    upgradeHomesteadFacility,
    participateWorldContest
  };
})();
