# -*- coding: utf-8 -*-
"""
修仙模拟器 - 后端 API 服务 (Flask + SQLite)
严格遵从 PRD 第 6 节规范设计
"""
import os
import json
import uuid
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 开启全局跨域支持

# 数据库文件路径与建表文件路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'xiuxian.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


class ManagedConnection(sqlite3.Connection):
    """
    自定义 SQLite 连接类：
    支持以 with 语句优雅管理事务提交/回滚，并在上下文退出时自动关闭连接
    """
    def __enter__(self):
        super().__enter__()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            super().__exit__(exc_type, exc_val, exc_tb)
        finally:
            self.close()


def get_db():
    """
    返回 SQLite 数据库连接，设置 row_factory 为 sqlite3.Row。
    支持使用 with get_db() as conn 自动管理事务与连接释放。
    """
    conn = sqlite3.connect(DB_PATH, factory=ManagedConnection)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    读取 schema.sql 初始化数据库表结构与索引，
    并在初次启动时注入修仙天骄榜与万宝楼初始在售法宝数据。
    """
    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"未找到建表 SQL 文件: {SCHEMA_PATH}")

    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    with get_db() as conn:
        cursor = conn.cursor()
        # 执行建表及创建索引语句
        cursor.executescript(schema_sql)

        # 检查并注入修仙天骄榜初始数据
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (uid, name, r_name, r_idx, pow_val, luck_val, hf, stones))

        # 检查并注入万宝楼初始在售法宝数据
        cursor.execute("SELECT COUNT(*) FROM market_items")
        if cursor.fetchone()[0] == 0:
            seed_items = [
                (
                    "mkt_1", "user_hanli", "韩立", "青竹蜂云剑", "equipment", 120,
                    json.dumps({
                        "id": "seed_han_sword",
                        "name": "青竹蜂云剑",
                        "slot": "weapon",
                        "quality": "仙品·无双",
                        "qualityClass": "quality-xian",
                        "power": 180,
                        "durability": 100,
                        "maxDurability": 100,
                        "maker": "韩立",
                        "year": "甲申年",
                        "forgeLuck": 98,
                        "affix": {"name": "本命通灵", "desc": "掷出6点时暴击伤害翻倍", "effect": {"critDmg": 2.0}},
                        "lineage": ["由天南修士「韩立」于落云宗采万年雷竹亲铸", "挂牌于万宝楼坊市待价而沽"]
                    }, ensure_ascii=False)
                ),
                (
                    "mkt_2", "user_lifeiyu", "厉飞雨", "天外玄铁重甲", "equipment", 65,
                    json.dumps({
                        "id": "seed_li_armor",
                        "name": "天外玄铁重甲",
                        "slot": "armor",
                        "quality": "宝品·通玄",
                        "qualityClass": "quality-bao",
                        "power": 90,
                        "durability": 95,
                        "maxDurability": 100,
                        "maker": "厉飞雨",
                        "year": "戊子年",
                        "forgeLuck": 85,
                        "affix": {"name": "福泽天眷", "desc": "斗法掷骰保底提升", "effect": {"minDice": 3}},
                        "lineage": ["由道友「厉飞雨」开炉百炼铸成"]
                    }, ensure_ascii=False)
                ),
                (
                    "mkt_3", "user_nanggong", "南宫婉", "九叶玉芝 ×2", "material", 40,
                    json.dumps({
                        "type": "herb_rare",
                        "name": "九叶玉芝",
                        "count": 2,
                        "desc": "极其罕见的洞府仙草，炼制本命法宝必备！"
                    }, ensure_ascii=False)
                )
            ]
            for it_id, s_id, s_name, it_name, it_type, price, it_data in seed_items:
                cursor.execute("""
                    INSERT INTO market_items (id, seller_id, seller_name, item_name, item_type, item_data, price, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
                """, (it_id, s_id, s_name, it_name, it_type, it_data, price))

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 修仙数据库初始化完成: {DB_PATH}")


# ==========================================================
# API 1: POST /api/user/sync - 云端存档与金榜上报
# ==========================================================
@app.route('/api/user/sync', methods=['POST'])
def sync_user():
    """
    接收玩家完整快照并 UPSERT 到 users 表。
    请求体: {id, dao_name, realm, realm_index, power, luck, heart_fire, spirit_stones, full_state}
    返回: {success: true, message: '云端金榜已同步'}
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        user_id = data.get('id')
        if not user_id:
            return jsonify({'success': False, 'message': '缺少玩家唯一标识 (id)'}), 400

        dao_name = data.get('dao_name', '无名散人')
        realm = data.get('realm', '炼气一层')
        realm_index = int(data.get('realm_index', 0))
        power = int(data.get('power', 10))
        luck = int(data.get('luck', 75))
        heart_fire = int(data.get('heart_fire', 3))
        spirit_stones = int(data.get('spirit_stones', 0))
        full_state = data.get('full_state')
        save_data = json.dumps(full_state, ensure_ascii=False) if full_state is not None else None

        with get_db() as conn:
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
            """, (user_id, dao_name, realm, realm_index, power, luck, heart_fire, spirit_stones, save_data))

        return jsonify({'success': True, 'message': '云端金榜已同步'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'同步存档失败: {str(e)}'}), 500


# ==========================================================
# API 2: GET /api/leaderboard - 天道金榜
# ==========================================================
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """
    查询 users 表:
    - 战力榜: ORDER BY power DESC LIMIT 20
    - 气运榜: ORDER BY luck DESC, power DESC LIMIT 20
    返回: {success: true, power_rank: [...], luck_rank: [...]}
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # 战力金榜 (Top 20)
            cursor.execute("""
                SELECT id, dao_name, realm, power, luck, spirit_stones
                FROM users
                ORDER BY power DESC
                LIMIT 20
            """)
            power_rows = cursor.fetchall()
            power_rank = [
                {
                    "id": r["id"],
                    "name": r["dao_name"],
                    "realm": r["realm"],
                    "power": r["power"],
                    "luck": r["luck"],
                    "stones": r["spirit_stones"]
                }
                for r in power_rows
            ]

            # 气运福缘金榜 (Top 20)
            cursor.execute("""
                SELECT id, dao_name, realm, luck, power, spirit_stones
                FROM users
                ORDER BY luck DESC, power DESC
                LIMIT 20
            """)
            luck_rows = cursor.fetchall()
            luck_rank = [
                {
                    "id": r["id"],
                    "name": r["dao_name"],
                    "realm": r["realm"],
                    "luck": r["luck"],
                    "power": r["power"],
                    "stones": r["spirit_stones"]
                }
                for r in luck_rows
            ]

        return jsonify({
            'success': True,
            'power_rank': power_rank,
            'luck_rank': luck_rank
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取天道金榜失败: {str(e)}'}), 500


# ==========================================================
# API 3: GET /api/market/list - 交易行货架
# ==========================================================
@app.route('/api/market/list', methods=['GET'])
def get_market_list():
    """
    查询 market_items WHERE status='active' ORDER BY created_at DESC
    返回: {success: true, items: [...]}
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, seller_id, seller_name, item_name, item_type, item_data, price, created_at
                FROM market_items
                WHERE status = 'active'
                ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            items = []
            for r in rows:
                raw_data = r["item_data"]
                try:
                    item_data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                except Exception:
                    item_data = raw_data

                items.append({
                    "id": r["id"],
                    "seller_id": r["seller_id"],
                    "seller_name": r["seller_name"],
                    "item_name": r["item_name"],
                    "item_type": r["item_type"],
                    "item_data": item_data,
                    "price": r["price"],
                    "created_at": r["created_at"]
                })

        return jsonify({
            'success': True,
            'items': items
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取交易行货架失败: {str(e)}'}), 500


# ==========================================================
# API 4: POST /api/market/list_item - 玩家寄售
# ==========================================================
@app.route('/api/market/list_item', methods=['POST'])
def market_list_item():
    """
    玩家寄售神兵或灵材:
    接收: {seller_id, seller_name, item_name, item_type, price, item_data}
    生成 id = 'mkt_' + uuid
    插入 market_items
    返回: {success: true, item_id: 'mkt_xxx'}
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        seller_id = data.get('seller_id')
        seller_name = data.get('seller_name', '无名散人')
        item_name = data.get('item_name')
        item_type = data.get('item_type', 'equipment')
        price = data.get('price')
        item_data = data.get('item_data')

        if not seller_id:
            return jsonify({'success': False, 'message': '缺少卖家信息 (seller_id)'}), 400
        if not item_name:
            return jsonify({'success': False, 'message': '缺少法宝名称 (item_name)'}), 400
        if price is None:
            return jsonify({'success': False, 'message': '缺少寄售标价 (price)'}), 400

        try:
            price = int(price)
            if price <= 0:
                return jsonify({'success': False, 'message': '标价必须为正整数'}), 400
        except ValueError:
            return jsonify({'success': False, 'message': '标价格式非法'}), 400

        item_data_str = json.dumps(item_data, ensure_ascii=False) if not isinstance(item_data, str) else item_data
        item_id = f"mkt_{uuid.uuid4().hex[:12]}"

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO market_items (id, seller_id, seller_name, item_name, item_type, item_data, price, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
            """, (item_id, seller_id, seller_name, item_name, item_type, item_data_str, price))

        return jsonify({
            'success': True,
            'item_id': item_id,
            'message': '法宝挂牌上架成功'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'寄售法宝失败: {str(e)}'}), 500


# ==========================================================
# API 5: POST /api/market/buy_item - 购宝交割
# ==========================================================
@app.route('/api/market/buy_item', methods=['POST'])
def market_buy_item():
    """
    购宝交割 (原子校验与所有权划转):
    接收: {buyer_id, buyer_name, item_id} (兼容量化携带的 buyer_stones)
    原子校验:
      1. 商品 status == 'active'
      2. 买家灵石充足 (查 users 表)
      3. 扣减买家灵石, 增加卖家灵石
      4. 更新 item lineage (因果履历)
      5. 状态 → 'sold', 记录 buyer_id 与 buyer_name
    使用数据库事务保证原子性
    返回: {success: true, message: '购宝成功', price: ..., item_data: ..., item_type: ...}
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        buyer_id = data.get('buyer_id')
        buyer_name = data.get('buyer_name', '无名散人')
        item_id = data.get('item_id')
        buyer_stones_input = data.get('buyer_stones')

        if not buyer_id or not item_id:
            return jsonify({'success': False, 'message': '缺少买家ID (buyer_id) 或商品ID (item_id)'}), 400

        with get_db() as conn:
            cursor = conn.cursor()

            # 1. 校验商品是否存在且依然在售 (status == 'active')
            cursor.execute("""
                SELECT id, seller_id, seller_name, item_name, item_type, item_data, price, status
                FROM market_items
                WHERE id = ?
            """, (item_id,))
            item = cursor.fetchone()

            if not item:
                return jsonify({'success': False, 'message': '商品不存在'}), 404

            if item['status'] != 'active':
                return jsonify({'success': False, 'message': '该法宝已被其他同门捷足先登或已下架！'}), 400

            price = item['price']
            seller_id = item['seller_id']

            # 2. 校验买家灵石充足 (查 users 表)
            cursor.execute("SELECT id, dao_name, spirit_stones FROM users WHERE id = ?", (buyer_id,))
            buyer = cursor.fetchone()

            if not buyer:
                # 买家尚未同步至 users 表，但请求体携带了有效买家灵石
                if buyer_stones_input is not None and int(buyer_stones_input) >= price:
                    cursor.execute("""
                        INSERT INTO users (id, dao_name, realm, realm_index, power, luck, heart_fire, spirit_stones)
                        VALUES (?, ?, '炼气一层', 0, 10, 75, 3, ?)
                    """, (buyer_id, buyer_name, int(buyer_stones_input)))
                    buyer_stones = int(buyer_stones_input)
                else:
                    return jsonify({'success': False, 'message': '买家档案不存在且灵石不足'}), 400
            else:
                buyer_stones = buyer['spirit_stones']

            if buyer_stones < price:
                return jsonify({'success': False, 'message': f'囊中羞涩！购买需 {price} 灵石，当前仅有 {buyer_stones} 灵石'}), 400

            # 3. 扣减买家灵石, 增加卖家灵石
            cursor.execute("""
                UPDATE users
                SET spirit_stones = spirit_stones - ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (price, buyer_id))

            cursor.execute("""
                UPDATE users
                SET spirit_stones = spirit_stones + ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (price, seller_id))

            # 4. 更新 item lineage (因果履历)
            raw_data = item['item_data']
            try:
                item_data_obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
            except Exception:
                item_data_obj = {}

            if isinstance(item_data_obj, dict):
                if 'lineage' not in item_data_obj or not isinstance(item_data_obj['lineage'], list):
                    item_data_obj['lineage'] = []
                item_data_obj['lineage'].append(f"于万宝楼以 {price} 灵石售予 道友「{buyer_name}」")
            new_item_data_str = json.dumps(item_data_obj, ensure_ascii=False)

            # 5. 状态 → 'sold', 记录 buyer
            cursor.execute("""
                UPDATE market_items
                SET status = 'sold', buyer_id = ?, buyer_name = ?, item_data = ?
                WHERE id = ? AND status = 'active'
            """, (buyer_id, buyer_name, new_item_data_str, item_id))

            if cursor.rowcount == 0:
                raise RuntimeError('并发购宝冲突：法宝已被其他同门捷足先登！')

        return jsonify({
            'success': True,
            'message': '购宝成功',
            'price': price,
            'item_data': item_data_obj,
            'item_type': item['item_type']
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'购宝交割异常: {str(e)}'}), 500


# ==========================================================
# 前端静态文件路由 (方便直接访问游戏)
# ==========================================================
@app.route('/')
def serve_index():
    """主页映射"""
    if os.path.exists(os.path.join(STATIC_DIR, 'index.html')):
        return send_from_directory(STATIC_DIR, 'index.html')
    return jsonify({'success': True, 'message': '修仙模拟器后端服务运行正常'})


@app.route('/<path:filename>')
def serve_static(filename):
    """静态文件映射"""
    file_path = os.path.join(STATIC_DIR, filename)
    if os.path.exists(file_path):
        return send_from_directory(STATIC_DIR, filename)
    return jsonify({'success': False, 'message': '未找到资源'}), 404


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=8888, debug=True)
