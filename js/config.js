/**
 * 《修仙模拟器·天命心火》 - 游戏配置常量
 * 所有数值严格遵循 PRD 规格定义
 */
window.XiuXian = window.XiuXian || {};

window.XiuXian.Config = {
    MAX_REALM: 8,
    INITIAL_LUCK: 75,
    INITIAL_HEART_FIRE: 3,
    INVENTORY_MAX: 32,

    // === PRD 3.2 九重天境界表 ===
    REALMS: [
        { name: '炼气一层',   maxExp: 100,    clickExp: 10,   secExp: 1,   basePow: 10,   baseHp: 100,   baseAtk: 12,   baseDef: 6 },
        { name: '炼气二层',   maxExp: 300,    clickExp: 18,   secExp: 3,   basePow: 25,   baseHp: 160,   baseAtk: 22,   baseDef: 12 },
        { name: '炼气三层',   maxExp: 750,    clickExp: 30,   secExp: 6,   basePow: 55,   baseHp: 260,   baseAtk: 45,   baseDef: 24 },
        { name: '炼气后期',   maxExp: 1600,   clickExp: 55,   secExp: 12,  basePow: 120,  baseHp: 450,   baseAtk: 95,   baseDef: 50 },
        { name: '筑基初期',   maxExp: 3500,   clickExp: 100,  secExp: 25,  basePow: 260,  baseHp: 850,   baseAtk: 210,  baseDef: 110 },
        { name: '筑基大圆满', maxExp: 8000,   clickExp: 190,  secExp: 55,  basePow: 580,  baseHp: 1600,  baseAtk: 460,  baseDef: 240 },
        { name: '结丹期',     maxExp: 18000,  clickExp: 380,  secExp: 120, basePow: 1300, baseHp: 3500,  baseAtk: 1050, baseDef: 550 },
        { name: '元婴老祖',   maxExp: 45000,  clickExp: 800,  secExp: 280, basePow: 3200, baseHp: 8500,  baseAtk: 2600, baseDef: 1400 },
        { name: '化神真君',   maxExp: 120000, clickExp: 1800, secExp: 650, basePow: 8800, baseHp: 22000, baseAtk: 7200, baseDef: 3800 }
    ],

    // === 材料定义 ===
    MATERIALS: {
        wood_common: { name: '青竹木',     icon: '🎋', tier: 1, desc: '灵峰翠竹，蕴含清灵之气' },
        ore_common:  { name: '寒铁矿',     icon: '🪨', tier: 1, desc: '千年寒潭中沉积的灵铁' },
        herb_common: { name: '凝血芝',     icon: '🍄', tier: 1, desc: '汲取地脉精华的赤色灵芝' },
        wood_rare:   { name: '避雷桃木',   icon: '🌳', tier: 2, desc: '万年桃木，天雷不侵' },
        ore_rare:    { name: '赤阳精金',   icon: '🔶', tier: 2, desc: '太阳精华凝结的稀世金属' },
        herb_rare:   { name: '九叶玉芝',   icon: '🌿', tier: 3, desc: '九千载一现的仙界灵药' }
    },

    // === PRD 4.1 装备槽位 ===
    EQUIPMENT_SLOTS: [
        { key: 'head',     name: '头部', icon: '👑', primary: 'wis', secondary: 'hp' },
        { key: 'armor',    name: '躯干', icon: '🥋', primary: 'def', secondary: 'hp' },
        { key: 'hand',     name: '护腕', icon: '🧤', primary: 'atk', secondary: 'def' },
        { key: 'foot',     name: '履靴', icon: '👢', primary: 'spd', secondary: 'def' },
        { key: 'weapon',   name: '兵刃', icon: '🗡️', primary: 'atk', secondary: 'atk' },
        { key: 'offhand',  name: '副手', icon: '🪞', primary: 'def', secondary: 'mp' },
        { key: 'necklace', name: '项饰', icon: '📿', primary: 'mp',  secondary: 'wis' },
        { key: 'ring',     name: '指环', icon: '💍', primary: 'atk', secondary: 'mp' }
    ],

    // === PRD 4.2 三阶装备配方 (每阶8件，覆盖全部槽位) ===
    RECIPES: {
        tier1: [
            { slot: 'head',     name: '青竹发簪',     materials: { wood_common: 4 },                        stats: { wis: 6, hp: 25 },             basePower: 12 },
            { slot: 'armor',    name: '素麻轻道袍',   materials: { wood_common: 3, herb_common: 3 },         stats: { def: 8, hp: 35 },             basePower: 15 },
            { slot: 'hand',     name: '玄铁护腕',     materials: { ore_common: 4 },                          stats: { atk: 6, def: 4 },            basePower: 12 },
            { slot: 'foot',     name: '草履踏青靴',   materials: { wood_common: 4 },                         stats: { spd: 10, def: 3 },           basePower: 10 },
            { slot: 'weapon',   name: '青竹寒铁剑',   materials: { wood_common: 5, ore_common: 5 },          stats: { atk: 25 },                   basePower: 28 },
            { slot: 'offhand',  name: '桃木辟邪符',   materials: { wood_common: 4, herb_common: 2 },         stats: { def: 6, mp: 15 },            basePower: 14 },
            { slot: 'necklace', name: '粗磨灵玉佩',   materials: { ore_common: 4, herb_common: 3 },          stats: { mp: 20, wis: 8 },            basePower: 15 },
            { slot: 'ring',     name: '精铜聚灵戒',   materials: { ore_common: 4 },                          stats: { atk: 5, mp: 12 },            basePower: 10 }
        ],
        tier2: [
            { slot: 'head',     name: '流云羽灵冠',     materials: { wood_rare: 1, ore_common: 6 },           stats: { wis: 22, hp: 80 },           basePower: 55 },
            { slot: 'armor',    name: '金丝玄灵法衣',   materials: { ore_common: 8, herb_common: 8 },         stats: { def: 36, hp: 140 },          basePower: 68 },
            { slot: 'hand',     name: '青鳞玄铁腕',     materials: { ore_common: 6, wood_rare: 1 },           stats: { atk: 26, def: 18 },         basePower: 52 },
            { slot: 'foot',     name: '疾风逐月靴',     materials: { wood_rare: 1, herb_common: 6 },          stats: { spd: 32, def: 12 },         basePower: 48 },
            { slot: 'weapon',   name: '赤阳流火剑',     materials: { wood_rare: 2, ore_common: 8 },           stats: { atk: 95 },                  basePower: 110 },
            { slot: 'offhand',  name: '阴阳八卦玄镜',   materials: { ore_common: 6, wood_rare: 1 },           stats: { def: 30, mp: 60 },          basePower: 58 },
            { slot: 'necklace', name: '温润凝神佩',     materials: { wood_rare: 1, ore_common: 6 },           stats: { mp: 80, wis: 28 },          basePower: 60 },
            { slot: 'ring',     name: '须弥纳灵戒',     materials: { ore_common: 6, ore_rare: 1 },            stats: { atk: 22, mp: 55 },          basePower: 50 }
        ],
        tier3: [
            { slot: 'head',     name: '紫阳太虚九霄冠', materials: { wood_rare: 3, ore_rare: 2 },             stats: { wis: 75, hp: 320 },          basePower: 220 },
            { slot: 'armor',    name: '九转雷劫无垢袍', materials: { ore_rare: 3, herb_rare: 1 },              stats: { def: 115, hp: 480 },        basePower: 280 },
            { slot: 'hand',     name: '覆海霸王震山腕', materials: { ore_rare: 2, ore_common: 12 },            stats: { atk: 85, def: 55 },         basePower: 210 },
            { slot: 'foot',     name: '踏云凌虚逍遥履', materials: { ore_rare: 2, herb_rare: 1 },              stats: { spd: 95, def: 40 },         basePower: 195 },
            { slot: 'weapon',   name: '紫电青霜本命剑', materials: { wood_rare: 3, ore_rare: 3 },              stats: { atk: 280 },                 basePower: 360 },
            { slot: 'offhand',  name: '昊天摄魂九宝铃', materials: { ore_rare: 2, wood_rare: 2 },              stats: { def: 88, mp: 180 },         basePower: 230 },
            { slot: 'necklace', name: '九曲天心本源佩', materials: { herb_rare: 2, ore_rare: 2 },              stats: { mp: 240, wis: 85 },         basePower: 240 },
            { slot: 'ring',     name: '大乾坤定海神戒', materials: { ore_rare: 3, herb_rare: 1 },              stats: { atk: 80, mp: 190 },         basePower: 215 }
        ]
    },

    // === PRD 4.3.1 锻造层级概率阶梯 ===
    FORGE_RATES: [0.90, 0.75, 0.55, 0.40, 0.25, 0.15, 0.08, 0.03, 0.01],

    // === PRD 4.3.3 数值增长曲线 ===
    GROWTH_CURVE: [1.0, 1.3, 1.7, 2.3, 3.1, 4.2, 5.8, 8.0, 11.5, 18.0],

    // === PRD 4.3.4 品质映射 ===
    QUALITY_TIERS: [
        { name: '灵品·清辉',   cssClass: 'quality-ling', minLayer: 1,  maxLayer: 3,  color: '#2b7a5a' },
        { name: '玄品·凝魄',   cssClass: 'quality-xuan', minLayer: 4,  maxLayer: 6,  color: '#1e5ba0' },
        { name: '宝品·通玄',   cssClass: 'quality-bao',  minLayer: 7,  maxLayer: 9,  color: '#8b45a6' },
        { name: '仙品·大圆满', cssClass: 'quality-xian', minLayer: 10, maxLayer: 10, color: '#d4a34b' }
    ],

    // === 气运真言词条池 ===
    AFFIXES: [
        { id: 'fuze_tianjuan',   name: '福泽天眷', desc: '论道骰点<3时拉升至3',     effect: 'dice_min_3',       tier: 'xuan' },
        { id: 'yinguo_nizhuan',  name: '因果逆转', desc: '自动重掷点数最小的骰子',   effect: 'reroll_min_dice',  tier: 'xuan' },
        { id: 'lingqi_benyong',  name: '灵气奔涌', desc: '修炼获取经验+15%',        effect: 'exp_bonus_15',     tier: 'ling' },
        { id: 'tiebi_jinshen',   name: '铁壁金身', desc: '防御力额外+12%',          effect: 'def_bonus_12',     tier: 'ling' },
        { id: 'tiannu_leijie',   name: '天怒雷劫', desc: '攻击力额外+18%',          effect: 'atk_bonus_18',     tier: 'bao' },
        { id: 'xianling_huti',   name: '仙灵护体', desc: '战败时50%几率保护装备不被夺', effect: 'protect_equip_50', tier: 'bao' },
        { id: 'daoxin_tongming', name: '道心通明', desc: '突破成功率+10%',           effect: 'breakthrough_10',  tier: 'xian' },
        { id: 'hunyuan_yiqi',    name: '混元一气', desc: '全属性+8%',               effect: 'all_stats_8',      tier: 'xian' }
    ],

    // === 采集系统 ===
    GATHERING: {
        locations: [
            { name: '灵峰竹林', materials: ['wood_common'], baseYield: 3, unlockRealm: 0 },
            { name: '寒铁矿脉', materials: ['ore_common'],  baseYield: 3, unlockRealm: 0 },
            { name: '灵药谷',   materials: ['herb_common'], baseYield: 2, unlockRealm: 0 },
            { name: '雷劫桃林', materials: ['wood_rare'],   baseYield: 1, unlockRealm: 3 },
            { name: '赤阳金矿', materials: ['ore_rare'],    baseYield: 1, unlockRealm: 4 },
            { name: '九叶灵圃', materials: ['herb_rare'],   baseYield: 1, unlockRealm: 6 }
        ],
        cooldownMs: 5000
    }
};
