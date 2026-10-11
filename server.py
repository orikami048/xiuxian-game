import http.server
import socketserver
import sqlite3
import json
import os
import urllib.parse
import hashlib
import secrets
import random
import math
from datetime import datetime

PORT = 8088
DB_FILE = os.path.join(os.path.dirname(__file__), "xiuxian.db")

# 三阶配方定义 (与前端一致作为权威标准)
TIER_RECIPES = {
    1: {
        "name": "一阶·炼气",
        "tierTag": "tier-1",
        "items": [
            {"slot": "head", "name": "青竹发簪", "cost": {"wood_common": 4}, "stats": {"wis": 6, "hp": 25}, "power": 12},
            {"slot": "armor", "name": "素麻轻道袍", "cost": {"wood_common": 3, "herb_common": 3}, "stats": {"def": 8, "hp": 35}, "power": 15},
            {"slot": "hand", "name": "玄铁护腕", "cost": {"ore_common": 4}, "stats": {"atk": 6, "def": 4}, "power": 12},
            {"slot": "foot", "name": "草履踏青靴", "cost": {"wood_common": 4}, "stats": {"spd": 10, "def": 3}, "power": 10},
            {"slot": "weapon", "name": "青竹寒铁剑", "cost": {"wood_common": 5, "ore_common": 5}, "stats": {"atk": 25}, "power": 28},
            {"slot": "offhand", "name": "桃木辟邪符", "cost": {"wood_common": 4, "herb_common": 2}, "stats": {"def": 6, "mp": 15}, "power": 14},
            {"slot": "necklace", "name": "粗磨灵玉佩", "cost": {"ore_common": 4, "herb_common": 3}, "stats": {"mp": 20, "wis": 8}, "power": 15},
            {"slot": "ring", "name": "精铜聚灵戒", "cost": {"ore_common": 4}, "stats": {"atk": 5, "mp": 12}, "power": 10}
        ]
    },
    2: {
        "name": "二阶·筑基",
        "tierTag": "tier-2",
        "items": [
            {"slot": "head", "name": "流云羽灵冠", "cost": {"wood_rare": 1, "ore_common": 6}, "stats": {"wis": 22, "hp": 80}, "power": 55},
            {"slot": "armor", "name": "金丝玄灵法衣", "cost": {"ore_common": 8, "herb_common": 8}, "stats": {"def": 36, "hp": 140}, "power": 68},
            {"slot": "hand", "name": "青鳞玄铁腕", "cost": {"ore_common": 6, "wood_rare": 1}, "stats": {"atk": 26, "def": 18}, "power": 52},
            {"slot": "foot", "name": "疾风逐月靴", "cost": {"wood_rare": 1, "herb_common": 6}, "stats": {"spd": 32, "def": 12}, "power": 48},
            {"slot": "weapon", "name": "赤阳流火剑", "cost": {"wood_rare": 2, "ore_common": 8}, "stats": {"atk": 95}, "power": 110},
            {"slot": "offhand", "name": "阴阳八卦玄镜", "cost": {"ore_common": 6, "wood_rare": 1}, "stats": {"def": 30, "mp": 60}, "power": 58},
            {"slot": "necklace", "name": "温润凝神佩", "cost": {"wood_rare": 1, "ore_common": 6}, "stats": {"mp": 80, "wis": 28}, "power": 60},
            {"slot": "ring", "name": "须弥纳灵戒", "cost": {"ore_common": 6, "ore_rare": 1}, "stats": {"atk": 22, "mp": 55}, "power": 50}
        ]
    },
    3: {
        "name": "三阶·结丹",
        "tierTag": "tier-3",
        "items": [
            {"slot": "head", "name": "紫阳太虚九霄冠", "cost": {"wood_rare": 3, "ore_rare": 2}, "stats": {"wis": 75, "hp": 320}, "power": 220},
            {"slot": "armor", "name": "九转雷劫无垢袍", "cost": {"ore_rare": 3, "herb_rare": 1}, "stats": {"def": 115, "hp": 480}, "power": 280},
            {"slot": "hand", "name": "覆海霸王震山腕", "cost": {"ore_rare": 2, "ore_common": 12}, "stats": {"atk": 85, "def": 55}, "power": 210},
            {"slot": "foot", "name": "踏云凌虚逍遥履", "cost": {"ore_rare": 2, "herb_rare": 1}, "stats": {"spd": 95, "def": 40}, "power": 195},
            {"slot": "weapon", "name": "紫电青霜本命剑", "cost": {"wood_rare": 3, "ore_rare": 3}, "stats": {"atk": 280}, "power": 360},
            {"slot": "offhand", "name": "昊天摄魂九宝铃", "cost": {"ore_rare": 2, "wood_rare": 2}, "stats": {"def": 88, "mp": 180}, "power": 230},
            {"slot": "necklace", "name": "九曲天心本源佩", "cost": {"herb_rare": 2, "ore_rare": 2}, "stats": {"mp": 240, "wis": 85}, "power": 240},
            {"slot": "ring", "name": "大乾坤定海神戒", "cost": {"ore_rare": 3, "herb_rare": 1}, "stats": {"atk": 80, "mp": 190}, "power": 215}
        ]
    }
}

LAYER_UP_RATES = {
    1: 0.90,
    2: 0.75,
    3: 0.55,
    4: 0.40,
    5: 0.25,
    6: 0.15,
    7: 0.08,
    8: 0.03,
    9: 0.01
}

AFFIX_POOL = [
    {"name": "福泽天眷", "desc": "斗法掷骰保底提升至3", "effect": {"minDice": 3}},
    {"name": "因果逆转", "desc": "斗法每回合可重掷劣骰", "effect": {"reroll": True}},
    {"name": "本命通灵", "desc": "掷出6点时暴击伤害翻倍", "effect": {"critDmg": 2.0}},
    {"name": "气运夺髓", "desc": "胜出额外掠夺败者气运与灵石", "effect": {"stealLuck": 5}},
    {"name": "避煞金身", "desc": "秘境战败装备被夺几率减半", "effect": {"protectEquip": 0.5}}
]

SLOT_KEYS = ["head", "armor", "hand", "foot", "weapon", "offhand", "necklace", "ring"]

def get_strike_cost(tier, layer):
    if tier == 1:
        if layer <= 5:
            return {"matKey": "ore_common", "matName": "寒铁矿", "count": 1, "stones": 1}
        else:
            return {"matKey": "ore_common", "matName": "寒铁矿", "count": 2, "stones": 3}
    elif tier == 2:
        if layer <= 5:
            return {"matKey": "ore_common", "matName": "寒铁矿", "count": 3, "stones": 5}
        else:
            return {"matKey": "ore_rare", "matName": "精金", "count": 1, "stones": 10}
    else:
        if layer <= 5:
            return {"matKey": "ore_rare", "matName": "精金", "count": 1, "stones": 15}
        else:
            return {"matKey": "ore_rare", "matName": "精金", "count": 2, "stones": 30}

# 升级所需阿尔比恩专精经验计算
def get_mastery_req_xp(level):
    return math.floor(100 * math.pow(1.055, max(0, level - 1)))

# 专精带来的冲层几率相对提升 (1~100 级，100级满级相对提升 50%)
def get_mastery_success_multiplier(level):
    return 1.0 + (min(100, max(1, level)) - 1) / 99.0 * 0.50

# 初始化 SQLite 数据库
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 玩家表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        dao_name TEXT NOT NULL,
        realm TEXT NOT NULL,
        realm_index INTEGER DEFAULT 0,
        power INTEGER DEFAULT 10,
        luck INTEGER DEFAULT 75,
        heart_fire INTEGER DEFAULT 3,
        spirit_stones INTEGER DEFAULT 0,
        save_data TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 交易行表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS market_items (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        seller_name TEXT NOT NULL,
        item_name TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_data TEXT NOT NULL,
        price INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        buyer_id TEXT,
        buyer_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 账号表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        dao_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 登录会话表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
    )
    """)

    # 全球争夺与天道世界通报表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS world_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 预填充榜单与初始商品
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_users = [
            ("user_hanli", "韩立", "化神初期", 8, 9850, 95, 3, 58000),
            ("user_lifeiyu", "厉飞雨", "元婴后期", 7, 4520, 82, 3, 12000),
            ("user_nanggong", "南宫婉", "结丹大圆满", 6, 1850, 90, 3, 6500),
            ("user_xiaobufan", "萧不凡", "筑基大圆满", 5, 620, 88, 3, 1200),
            ("user_luren", "陆仁", "炼气九层", 3, 135, 68, 3, 85)
        ]
        for uid, name, r_name, r_idx, pow_val, luck_val, hf, stones in seed_users:
            cursor.execute("""
            INSERT INTO users (id, dao_name, realm, realm_index, power, luck, heart_fire, spirit_stones, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (uid, name, r_name, r_idx, pow_val, luck_val, hf, stones, datetime.now()))

    # 初始全服通报事件
    cursor.execute("SELECT COUNT(*) FROM world_events")
    if cursor.fetchone()[0] == 0:
        seed_events = [
            ("ev_init_1", "broadcast", "【天道昭告】太虚古界开启，天道神炉降世，凡炼制十层大圆满神兵者将震动九天！"),
            ("ev_init_2", "contest", "【上古仙矿现世】太虚北域浮现「赤阳精金仙矿」，诸位道友速速前往争夺机缘！")
        ]
        for eid, etype, econtent in seed_events:
            cursor.execute("INSERT INTO world_events (id, event_type, content) VALUES (?, ?, ?)", (eid, etype, econtent))

    conn.commit()
    conn.close()

# 鉴权辅助函数
def get_user_by_token(token):
    if not token:
        return None, None
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.account_id, a.username, a.dao_name 
    FROM sessions s 
    JOIN accounts a ON s.account_id = a.id 
    WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
    """, (token,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None, None

    account_id, username, dao_name = row
    cursor.execute("SELECT save_data, spirit_stones, luck, realm_index FROM users WHERE id = ?", (account_id,))
    u_row = cursor.fetchone()
    conn.close()

    if not u_row or not u_row[0]:
        return None, None
    
    try:
        user_state = json.loads(u_row[0])
    except Exception:
        user_state = {}
    return account_id, user_state

def save_user_state(account_id, user_state):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # 计算当前战力
    power = user_state.get("power", 10)
    luck = user_state.get("luck", 75)
    stones = user_state.get("spiritStones", 0)
    realm_idx = user_state.get("realmIndex", 1)
    dao_name = user_state.get("daoName", "散修")

    cursor.execute("""
    UPDATE users 
    SET save_data = ?, power = ?, luck = ?, spirit_stones = ?, realm_index = ?, dao_name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (json.dumps(user_state, ensure_ascii=False), power, luck, stones, realm_idx, dao_name, account_id))
    conn.commit()
    conn.close()

class XiuXianHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/leaderboard":
            self.handle_leaderboard()
        elif path == "/api/market/list":
            self.handle_market_list()
        elif path == "/api/world/events":
            self.handle_world_events()
        elif path == "/api/auth/me":
            self.handle_auth_me()
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        if path == "/api/auth/register":
            self.handle_auth_register(data)
        elif path == "/api/auth/login":
            self.handle_auth_login(data)
        elif path == "/api/user/sync":
            self.handle_user_sync(data)
        elif path == "/api/market/list_item":
            self.handle_market_list_item(data)
        elif path == "/api/market/buy_item":
            self.handle_market_buy_item(data)
        elif path == "/api/forge/start":
            self.handle_forge_start(data)
        elif path == "/api/forge/strike":
            self.handle_forge_strike(data)
        elif path == "/api/forge/quench":
            self.handle_forge_quench(data)
        elif path == "/api/homestead/collect":
            self.handle_homestead_collect(data)
        elif path == "/api/homestead/upgrade":
            self.handle_homestead_upgrade(data)
        elif path == "/api/world/contest":
            self.handle_world_contest(data)
        else:
            self.send_response(404)
            self.end_headers()

    def get_token_from_header(self):
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:].strip()
        return ""

    # === API 1: 天道金榜排行榜 ===
    def handle_leaderboard(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("""
        SELECT id, dao_name, realm, power, luck, spirit_stones 
        FROM users 
        ORDER BY power DESC LIMIT 10
        """)
        power_rank = [
            {"id": r[0], "name": r[1], "realm": r[2], "power": r[3], "luck": r[4], "stones": r[5]}
            for r in cursor.fetchall()
        ]

        cursor.execute("""
        SELECT id, dao_name, realm, luck, power 
        FROM users 
        ORDER BY luck DESC, power DESC LIMIT 10
        """)
        luck_rank = [
            {"id": r[0], "name": r[1], "realm": r[2], "luck": r[3], "power": r[4]}
            for r in cursor.fetchall()
        ]
        conn.close()

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        res = {"success": True, "power_rank": power_rank, "luck_rank": luck_rank}
        self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))

    # === API 2: 世界事件与争夺列表 ===
    def handle_world_events(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, event_type, content, created_at FROM world_events ORDER BY created_at DESC LIMIT 15")
        events = [{"id": r[0], "type": r[1], "content": r[2], "time": r[3]} for r in cursor.fetchall()]
        conn.close()

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "events": events}, ensure_ascii=False).encode("utf-8"))

    # === API 3: 获取当前个人信息 ===
    def handle_auth_me(self):
        token = self.get_token_from_header()
        account_id, user_state = get_user_by_token(token)
        if not account_id:
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "请先登录修行账号"}, ensure_ascii=False).encode("utf-8"))
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "user": user_state}, ensure_ascii=False).encode("utf-8"))

    # === API 4: 注册 ===
    def handle_auth_register(self, data):
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        dao_name = data.get("daoName", "").strip()

        if not username or not password or not dao_name:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "请填写完整道号、账号与密码"}).encode("utf-8"))
            return

        pass_hash = hashlib.sha256((password + ":xiuxian_secret_salt_2026").encode("utf-8")).hexdigest()
        account_id = "u_" + str(int(datetime.now().timestamp())) + "_" + str(secrets.randbelow(1000))
        token = secrets.token_hex(24)

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO accounts (id, username, password_hash, dao_name) VALUES (?, ?, ?, ?)",
                           (account_id, username, pass_hash, dao_name))
            cursor.execute("INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))",
                           (token, account_id))
            
            # 初始化阿尔比恩专精与家园字段
            initial_user = {
                "id": account_id,
                "username": username,
                "daoName": dao_name,
                "realmIndex": 1,
                "exp": 30,
                "spiritStones": 50,
                "luck": 75,
                "heartFire": 3,
                "maxHeartFire": 3,
                "resources": {
                    "wood_common": 20, "wood_rare": 3, "ore_common": 25, "ore_rare": 2, "herb_common": 15, "herb_rare": 1
                },
                "equipped": {s: None for s in SLOT_KEYS},
                "inventory": [],
                "mastery": {
                    "smithing": {"level": 1, "xp": 0},
                    "weapon": {"level": 1, "xp": 0},
                    "armor": {"level": 1, "xp": 0},
                    "head": {"level": 1, "xp": 0},
                    "hand": {"level": 1, "xp": 0},
                    "foot": {"level": 1, "xp": 0},
                    "offhand": {"level": 1, "xp": 0},
                    "necklace": {"level": 1, "xp": 0},
                    "ring": {"level": 1, "xp": 0}
                },
                "homestead": {
                    "mineLevel": 1,
                    "forestLevel": 1,
                    "herbLevel": 1,
                    "lastCollectTime": int(datetime.now().timestamp() * 1000)
                }
            }

            # 初始新手武器
            starter_sword = {
                "id": "eq_starter_" + str(int(datetime.now().timestamp())),
                "tier": 1,
                "tierName": "一阶·炼气(1层)",
                "tierTag": "tier-1",
                "name": "青竹寒铁剑",
                "slot": "weapon",
                "quality": "灵品·清辉",
                "qualityClass": "quality-ling",
                "power": 32,
                "stats": {"atk": 28},
                "durability": 100,
                "maxDurability": 100,
                "maker": dao_name,
                "year": "入道年",
                "forgeLuck": 75,
                "affix": None,
                "lineage": [f"由道友「{dao_name}」亲手铭刻道号入册"]
            }
            initial_user["inventory"].append(starter_sword)
            initial_user["equipped"]["weapon"] = starter_sword

            cursor.execute("""
            INSERT INTO users (id, dao_name, realm, realm_index, power, luck, heart_fire, spirit_stones, save_data, updated_at)
            VALUES (?, ?, '炼气二层', 1, 25, 75, 3, 50, ?, CURRENT_TIMESTAMP)
            """, (account_id, dao_name, json.dumps(initial_user, ensure_ascii=False)))
            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "token": token, "user": initial_user}, ensure_ascii=False).encode("utf-8"))
        except sqlite3.IntegrityError:
            conn.close()
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "该账号已被其他道友占用！"}).encode("utf-8"))

    # === API 5: 登录 ===
    def handle_auth_login(self, data):
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()

        pass_hash = hashlib.sha256((password + ":xiuxian_secret_salt_2026").encode("utf-8")).hexdigest()

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, dao_name, password_hash FROM accounts WHERE username = ?", (username,))
        row = cursor.fetchone()

        if not row or row[2] != pass_hash:
            conn.close()
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "修行账号或密押不符！"}).encode("utf-8"))
            return

        account_id, dao_name = row[0], row[1]
        token = secrets.token_hex(24)
        cursor.execute("INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))",
                       (token, account_id))

        cursor.execute("SELECT save_data FROM users WHERE id = ?", (account_id,))
        save_row = cursor.fetchone()
        user_data = json.loads(save_row[0]) if (save_row and save_row[0]) else {"id": account_id, "daoName": dao_name}

        conn.commit()
        conn.close()

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "token": token, "user": user_data}, ensure_ascii=False).encode("utf-8"))

    # === API 6: 权威锻造 - 开炉起胚 ===
    def handle_forge_start(self, data):
        token = self.get_token_from_header()
        account_id, user_state = get_user_by_token(token)
        if not account_id:
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "未登录或登录已失效"}, ensure_ascii=False).encode("utf-8"))
            return

        tier = int(data.get("tier", 1))
        recipe_idx = int(data.get("recipeIndex", 0))

        tier_data = TIER_RECIPES.get(tier)
        if not tier_data or recipe_idx < 0 or recipe_idx >= len(tier_data["items"]):
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "配方不存在"}, ensure_ascii=False).encode("utf-8"))
            return

        recipe = tier_data["items"][recipe_idx]
        user_res = user_state.get("resources", {})

        # 服务端扣减材料
        for k, req in recipe["cost"].items():
            if user_res.get(k, 0) < req:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": f"材料不足，缺少 {k}"}, ensure_ascii=False).encode("utf-8"))
                return

        for k, req in recipe["cost"].items():
            user_res[k] -= req

        # 初始词条浮动 85% ~ 130%
        luck_val = user_state.get("luck", 75)
        base_var = 0.85 + random.random() * 0.30
        luck_bonus = max(0, (luck_val - 50) * 0.003 * random.random())
        variance = round(base_var + luck_bonus, 2)

        init_stats = {}
        for s, v in recipe["stats"].items():
            init_stats[s] = max(1, round(v * variance))
        init_power = max(10, round(recipe["power"] * 0.7 * variance))

        anvil_state = {
            "tier": tier,
            "recipeIndex": recipe_idx,
            "slot": recipe["slot"],
            "layer": 1,
            "power": init_power,
            "stats": init_stats,
            "variance": variance,
            "totalBonusMult": 1.0
        }

        save_user_state(account_id, user_state)

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "anvil": anvil_state,
            "resources": user_res
        }, ensure_ascii=False).encode("utf-8"))

    # === API 7: 权威锻造 - 挥锤冲层 (含阿尔比恩天赋加成与经验结算) ===
    def handle_forge_strike(self, data):
        token = self.get_token_from_header()
        account_id, user_state = get_user_by_token(token)
        if not account_id:
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "未登录"}, ensure_ascii=False).encode("utf-8"))
            return

        anvil = data.get("anvil", {})
        tier = int(anvil.get("tier", 1))
        layer = int(anvil.get("layer", 1))
        slot = anvil.get("slot", "weapon")
        recipe_idx = int(anvil.get("recipeIndex", 0))

        if layer >= 10:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "已达大圆满极限！"}, ensure_ascii=False).encode("utf-8"))
            return

        cost = get_strike_cost(tier, layer)
        user_res = user_state.get("resources", {})
        stones = user_state.get("spiritStones", 0)

        if user_res.get(cost["matKey"], 0) < cost["count"] or stones < cost["stones"]:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "辅料或灵石不足！"}, ensure_ascii=False).encode("utf-8"))
            return

        # 扣减
        user_res[cost["matKey"]] -= cost["count"]
        user_state["spiritStones"] -= cost["stones"]

        # 阿尔比恩天赋判定 (总铁匠天赋 + 部位独立专精天赋)
        mastery = user_state.setdefault("mastery", {})
        smithing_m = mastery.setdefault("smithing", {"level": 1, "xp": 0})
        slot_m = mastery.setdefault(slot, {"level": 1, "xp": 0})

        # 天赋加成：综合熟练度提升冲层率 (最高 +50% 相对倍率，例如0.01可提至0.015~0.02)
        total_m_level = (smithing_m.get("level", 1) + slot_m.get("level", 1)) / 2.0
        success_mult = get_mastery_success_multiplier(total_m_level)

        base_rate = LAYER_UP_RATES.get(layer, 0.1)
        luck = user_state.get("luck", 75)
        # 实际概率 = (基础概率 * 天赋倍率) + 福缘微量加成
        actual_rate = min(0.98, (base_rate * success_mult) + (luck - 50) * 0.001)

        roll_val = random.random()
        mult = 1.1
        is_crit = False
        mult_roll = random.random() * 100
        crit3_th = 100 - (12 if luck > 80 else 5)
        crit2_th = crit3_th - (20 if luck > 75 else 12)

        if mult_roll >= crit3_th:
            mult = 3.0
            is_crit = True
        elif mult_roll >= crit2_th:
            mult = 2.0
            is_crit = True
        elif mult_roll >= 40:
            mult = 1.3
        elif mult_roll >= 20:
            mult = 1.2
        else:
            mult = 1.1

        # 经验奖励结算 (每次挥锤不论成败均增长熟练度，高阶与高层经验更丰厚)
        earned_xp = tier * 8 + layer * 4
        smithing_m["xp"] = smithing_m.get("xp", 0) + earned_xp
        slot_m["xp"] = slot_m.get("xp", 0) + earned_xp

        # 检查专精升级 (1~100级)
        s_req = get_mastery_req_xp(smithing_m.get("level", 1))
        if smithing_m["xp"] >= s_req and smithing_m.get("level", 1) < 100:
            smithing_m["xp"] -= s_req
            smithing_m["level"] = smithing_m.get("level", 1) + 1

        slot_req = get_mastery_req_xp(slot_m.get("level", 1))
        if slot_m["xp"] >= slot_req and slot_m.get("level", 1) < 100:
            slot_m["xp"] -= slot_req
            slot_m["level"] = slot_m.get("level", 1) + 1

        success = roll_val < actual_rate
        recipe = TIER_RECIPES[tier]["items"][recipe_idx]
        current_variance = round(0.85 + random.random() * 0.35 + (luck - 50) * 0.002, 2)

        is_world_broadcast = False
        broadcast_msg = ""

        if success:
            layer += 1
            layer_growth = [1, 1.3, 1.7, 2.3, 3.1, 4.2, 5.8, 8.0, 11.5, 18.0][layer - 1]
            anvil["layer"] = layer
            anvil["power"] = math.floor(recipe["power"] * layer_growth * (1 + (mult - 1) * 0.5) * current_variance)
            anvil["stats"] = {s: max(1, math.floor(v * layer_growth * current_variance)) for s, v in recipe["stats"].items()}
            anvil["variance"] = current_variance

            # 达到10层大圆满触发全服世界通报！
            if layer == 10:
                is_world_broadcast = True
                broadcast_msg = f"🌟【天道祥瑞·大圆满神兵降世】道友「{user_state.get('daoName')}」以极道机缘铸就十层大圆满【{recipe['name']}·归元】(战力+{anvil['power']})！"
                conn = sqlite3.connect(DB_FILE)
                cur = conn.cursor()
                cur.execute("INSERT INTO world_events (id, event_type, content) VALUES (?, 'broadcast', ?)",
                            ("ev_forge_" + str(int(datetime.now().timestamp() * 1000)), broadcast_msg))
                conn.commit()
                conn.close()
        else:
            if random.random() * 100 >= luck and layer > 1:
                layer -= 1
                anvil["layer"] = layer
                anvil["power"] = max(15, math.floor(anvil.get("power", 20) * 0.8))

        save_user_state(account_id, user_state)

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "strikeSuccess": success,
            "mult": mult,
            "isCrit": is_crit,
            "actualRate": actual_rate,
            "anvil": anvil,
            "resources": user_res,
            "spiritStones": user_state["spiritStones"],
            "mastery": mastery,
            "isWorldBroadcast": is_world_broadcast,
            "broadcastMsg": broadcast_msg
        }, ensure_ascii=False).encode("utf-8"))

    # === API 8: 权威锻造 - 淬火出炉收尾 ===
    def handle_forge_quench(self, data):
        token = self.get_token_from_header()
        account_id, user_state = get_user_by_token(token)
        if not account_id:
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "未登录"}, ensure_ascii=False).encode("utf-8"))
            return

        anvil = data.get("anvil", {})
        tier = int(anvil.get("tier", 1))
        layer = int(anvil.get("layer", 1))
        recipe_idx = int(anvil.get("recipeIndex", 0))
        tier_data = TIER_RECIPES[tier]
        recipe = tier_data["items"][recipe_idx]

        quality = "凡品"
        quality_class = "quality-fan"
        if layer == 10:
            quality = "仙品·大圆满"
            quality_class = "quality-xian"
        elif layer >= 7:
            quality = "宝品·通玄"
            quality_class = "quality-bao"
        elif layer >= 4:
            quality = "玄品·凝魄"
            quality_class = "quality-xuan"
        else:
            quality = "灵品·清辉"
            quality_class = "quality-ling"

        affix = None
        if layer >= 4 or random.random() < 0.5:
            affix = random.choice(AFFIX_POOL)

        new_equip = {
            "id": f"eq_{int(datetime.now().timestamp() * 1000)}_{secrets.randbelow(1000)}",
            "tier": tier,
            "tierName": f"{tier_data['name']}({layer}层)",
            "tierTag": "tier-3" if layer == 10 else ("tier-2" if layer >= 5 else "tier-1"),
            "name": f"{recipe['name']}{'·归元' if layer == 10 else ''}",
            "slot": recipe["slot"],
            "quality": quality,
            "qualityClass": quality_class,
            "power": anvil.get("power", recipe["power"]),
            "stats": anvil.get("stats", recipe["stats"]),
            "durability": 100,
            "maxDurability": 100,
            "maker": user_state.get("daoName", "散修"),
            "year": "天启年",
            "forgeLuck": user_state.get("luck", 75),
            "affix": affix,
            "lineage": [
                f"由道友「{user_state.get('daoName')}」经由天道服务端权威捶打 {layer} 锻淬炼",
                f"最终收炉烙印真名，成器为【{tier_data['name']}({layer}层)】"
            ]
        }

        user_state.setdefault("inventory", []).insert(0, new_equip)

        # 自动穿戴空槽
        equipped = user_state.setdefault("equipped", {s: None for s in SLOT_KEYS})
        if not equipped.get(recipe["slot"]):
            equipped[recipe["slot"]] = new_equip

        save_user_state(account_id, user_state)

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "equipment": new_equip,
            "user": user_state
        }, ensure_ascii=False).encode("utf-8"))

    # === API 9: 家园采矿与灵田收获 ===
    def handle_homestead_collect(self, data):
        token = self.get_token_from_header()
        account_id, user_state = get_user_by_token(token)
        if not account_id:
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "未登录"}, ensure_ascii=False).encode("utf-8"))
            return

        now_ms = int(datetime.now().timestamp() * 1000)
        home = user_state.setdefault("homestead", {
            "mineLevel": 1, "forestLevel": 1, "herbLevel": 1, "lastCollectTime": now_ms
        })
        last_t = home.get("lastCollectTime", now_ms)
        elapsed_sec = max(0, min(86400, (now_ms - last_t) // 1000)) # 最多积累24小时

        if elapsed_sec < 5:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "灵脉尚在积蓄，请稍候收获"}, ensure_ascii=False).encode("utf-8"))
            return

        # 产出计算 (低阶材料随时间产出)
        mine_gain = int(elapsed_sec * 0.1 * home.get("mineLevel", 1))
        forest_gain = int(elapsed_sec * 0.1 * home.get("forestLevel", 1))
        herb_gain = int(elapsed_sec * 0.08 * home.get("herbLevel", 1))

        res = user_state.setdefault("resources", {})
        res["ore_common"] = res.get("ore_common", 0) + mine_gain
        res["wood_common"] = res.get("wood_common", 0) + forest_gain
        res["herb_common"] = res.get("herb_common", 0) + herb_gain

        home["lastCollectTime"] = now_ms
        save_user_state(account_id, user_state)

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "gains": {"ore": mine_gain, "wood": forest_gain, "herb": herb_gain},
            "resources": res,
            "homestead": home
        }, ensure_ascii=False).encode("utf-8"))

    # === API 10: 家园设施升级 ===
    def handle_homestead_upgrade(self, data):
        token = self.get_token_from_header()
        account_id, user_state = get_user_by_token(token)
        if not account_id:
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "未登录"}, ensure_ascii=False).encode("utf-8"))
            return

        facility = data.get("facility", "mine") # mine, forest, herb
        home = user_state.setdefault("homestead", {
            "mineLevel": 1, "forestLevel": 1, "herbLevel": 1, "lastCollectTime": int(datetime.now().timestamp() * 1000)
        })

        lvl_key = f"{facility}Level"
        cur_lvl = home.get(lvl_key, 1)
        cost_stones = cur_lvl * 30

        if user_state.get("spiritStones", 0) < cost_stones:
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": f"灵石不足，升级需要 {cost_stones} 灵石"}, ensure_ascii=False).encode("utf-8"))
            return

        user_state["spiritStones"] -= cost_stones
        home[lvl_key] = cur_lvl + 1
        save_user_state(account_id, user_state)

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "facility": facility,
            "newLevel": home[lvl_key],
            "spiritStones": user_state["spiritStones"]
        }, ensure_ascii=False).encode("utf-8"))

    # === API 11: 全服高阶素材争夺 ===
    def handle_world_contest(self, data):
        token = self.get_token_from_header()
        account_id, user_state = get_user_by_token(token)
        if not account_id:
            self.send_response(401)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "未登录"}, ensure_ascii=False).encode("utf-8"))
            return

        event_id = data.get("eventId", "")
        # 争夺检定：Roll 点结合战力与福缘
        roll_p = random.randint(1, 100)
        roll_rival = random.randint(30, 95)
        pow_score = math.floor(user_state.get("power", 10) / 10)
        luck_score = math.floor(user_state.get("luck", 75) / 5)
        total_p = roll_p + pow_score + luck_score

        win = total_p >= roll_rival
        res = user_state.setdefault("resources", {})
        msg = ""

        if win:
            reward_type = random.choice(["ore_rare", "wood_rare", "herb_rare"])
            reward_names = {"ore_rare": "赤阳精金", "wood_rare": "万年雷击木", "herb_rare": "九叶玉芝"}
            res[reward_type] = res.get(reward_type, 0) + 1
            msg = f"【争夺大捷】力克群修！在全服争夺中夺得高阶仙料「{reward_names[reward_type]} ×1」！"
            
            # 全服广播
            b_msg = f"⚔️【全服争夺快讯】道友「{user_state.get('daoName')}」在远古天脉争夺战中力压群雄，成功夺走罕世仙材「{reward_names[reward_type]}」！"
            conn = sqlite3.connect(DB_FILE)
            cur = conn.cursor()
            cur.execute("INSERT INTO world_events (id, event_type, content) VALUES (?, 'contest', ?)",
                        ("ev_con_" + str(int(datetime.now().timestamp() * 1000)), b_msg))
            conn.commit()
            conn.close()
        else:
            msg = f"【争夺受阻】敌手势大，争夺惜败！未能夺得高阶仙材。"

        save_user_state(account_id, user_state)

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "win": win,
            "msg": msg,
            "resources": res
        }, ensure_ascii=False).encode("utf-8"))

    # === API 12: 用户数据上云同步 ===
    def handle_user_sync(self, data):
        user_id = data.get("id", "player_local")
        dao_name = data.get("dao_name", "无名散人")
        realm = data.get("realm", "炼气一层")
        realm_idx = data.get("realm_index", 0)
        power = data.get("power", 10)
        luck = data.get("luck", 75)
        heart_fire = data.get("heart_fire", 3)
        stones = data.get("spirit_stones", 0)
        save_data = json.dumps(data.get("full_state", {}), ensure_ascii=False)

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO users (id, dao_name, realm, realm_index, power, luck, heart_fire, spirit_stones, save_data, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            dao_name = excluded.dao_name,
            realm = excluded.realm,
            realm_index = excluded.realm_index,
            power = excluded.power,
            luck = excluded.luck,
            heart_fire = excluded.heart_fire,
            spirit_stones = excluded.spirit_stones,
            save_data = excluded.save_data,
            updated_at = CURRENT_TIMESTAMP
        """, (user_id, dao_name, realm, realm_idx, power, luck, heart_fire, stones, save_data))
        conn.commit()
        conn.close()

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "message": "云端金榜已同步"}, ensure_ascii=False).encode("utf-8"))

    # === API 13: 交易行在售列表 ===
    def handle_market_list(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, seller_id, seller_name, item_name, item_type, item_data, price, created_at
        FROM market_items
        WHERE status = 'active'
        ORDER BY created_at DESC
        """)
        items = []
        for r in cursor.fetchall():
            items.append({
                "id": r[0],
                "seller_id": r[1],
                "seller_name": r[2],
                "item_name": r[3],
                "item_type": r[4],
                "item_data": json.loads(r[5]),
                "price": r[6],
                "created_at": r[7]
            })
        conn.close()

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "items": items}, ensure_ascii=False).encode("utf-8"))

    # === API 14: 挂牌寄售 ===
    def handle_market_list_item(self, data):
        item_id = f"mkt_{int(datetime.now().timestamp() * 1000)}"
        seller_id = data.get("seller_id", "player_local")
        seller_name = data.get("seller_name", "无名散人")
        item_name = data.get("item_name", "法宝")
        item_type = data.get("item_type", "equipment")
        price = int(data.get("price", 10))
        item_data = json.dumps(data.get("item_data", {}), ensure_ascii=False)

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO market_items (id, seller_id, seller_name, item_name, item_type, item_data, price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        """, (item_id, seller_id, seller_name, item_name, item_type, item_data, price))
        conn.commit()
        conn.close()

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True, "item_id": item_id}, ensure_ascii=False).encode("utf-8"))

    # === API 15: 交易行购买商品 ===
    def handle_market_buy_item(self, data):
        item_id = data.get("item_id")
        buyer_id = data.get("buyer_id", "player_local")
        buyer_name = data.get("buyer_name", "无名散人")
        buyer_stones = int(data.get("buyer_stones", 0))

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, seller_id, item_name, price, item_type, item_data FROM market_items WHERE id = ? AND status = 'active'", (item_id,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "该宝物已被其他道友购走！"}, ensure_ascii=False).encode("utf-8"))
            return

        price = row[3]
        if buyer_stones < price:
            conn.close()
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "灵石不足！"}, ensure_ascii=False).encode("utf-8"))
            return

        item_data_obj = json.loads(row[5])
        if "lineage" in item_data_obj and isinstance(item_data_obj["lineage"], list):
            item_data_obj["lineage"].append(f"于万宝楼坊市以 {price} 灵石售予 道友「{buyer_name}」")

        cursor.execute("""
        UPDATE market_items 
        SET status = 'sold', buyer_id = ?, buyer_name = ?, item_data = ?
        WHERE id = ?
        """, (buyer_id, buyer_name, json.dumps(item_data_obj, ensure_ascii=False), item_id))

        cursor.execute("UPDATE users SET spirit_stones = spirit_stones + ? WHERE id = ?", (price, row[1]))
        conn.commit()
        conn.close()

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True, 
            "price": price, 
            "item_data": item_data_obj,
            "item_type": row[4]
        }, ensure_ascii=False).encode("utf-8"))

if __name__ == "__main__":
    init_db()
    os.chdir(os.path.dirname(__file__))
    with socketserver.TCPServer(("", PORT), XiuXianHandler) as httpd:
        print(f"修仙全栈权威服务端已就绪，端口: {PORT}")
        httpd.serve_forever()
