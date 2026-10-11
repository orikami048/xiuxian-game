window.XiuXian = window.XiuXian || {};

window.XiuXian.GameState = class {
    constructor() {
        this.reset();
    }

    reset() {
        this.player = {
            name: '散修',
            realmIndex: 0,
            exp: 0,
            luck: window.XiuXian.Config.INITIAL_LUCK,
            heartFire: window.XiuXian.Config.INITIAL_HEART_FIRE,
            spiritStones: 0
        };
        this.equipment = {
            head: null, armor: null, hand: null, foot: null,
            weapon: null, offhand: null, necklace: null, ring: null
        };
        this.inventory = [];
        this.materials = {
            wood_common: 0, ore_common: 0, herb_common: 0,
            wood_rare: 0, ore_rare: 0, herb_rare: 0
        };
        this.logs = [];
    }

    save() {
        const data = {
            player: this.player,
            equipment: this.equipment,
            inventory: this.inventory,
            materials: this.materials,
            logs: this.logs.slice(-100) // 限制日志数量，防止存档过大
        };
        localStorage.setItem('xiuxian_save', JSON.stringify(data));
    }

    load() {
        const dataStr = localStorage.getItem('xiuxian_save');
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                this.player = { ...this.player, ...data.player };
                this.equipment = { ...this.equipment, ...data.equipment };
                this.inventory = data.inventory || [];
                this.materials = { ...this.materials, ...data.materials };
                this.logs = data.logs || [];
                return true;
            } catch (e) {
                console.error('加载存档失败', e);
            }
        }
        return false;
    }

    addLog(text, type = 'info') {
        this.logs.push({ text, type, timestamp: Date.now() });
        if (this.logs.length > 200) this.logs.shift();
    }

    getRealmData() {
        return window.XiuXian.Config.REALMS[this.player.realmIndex];
    }

    canBreakthrough() {
        const realmData = this.getRealmData();
        return this.player.exp >= realmData.maxExp && this.player.realmIndex < window.XiuXian.Config.MAX_REALM;
    }

    getEquippedStats() {
        let totalStats = { atk: 0, def: 0, spd: 0, wis: 0, hp: 0, mp: 0, power: 0 };
        for (const slotKey in this.equipment) {
            const item = this.equipment[slotKey];
            if (item) {
                for (const stat in item.stats) {
                    totalStats[stat] = (totalStats[stat] || 0) + item.stats[stat];
                }
                totalStats.power += item.power;
            }
        }
        return totalStats;
    }

    calculatePower() {
        const realmData = this.getRealmData();
        const basePow = realmData.basePow;
        const equipStats = this.getEquippedStats();
        
        let equipPowSum = equipStats.power;
        
        // Power = floor((BasePow + sum(EquipPow)) * (1 + (Luck-50)*0.003))
        const power = Math.floor((basePow + equipPowSum) * (1 + (this.player.luck - 50) * 0.003));
        return power;
    }

    addExp(amount) {
        let actualAmount = amount;
        // 检查真言：灵气奔涌
        let hasExpBonus = false;
        for (const slotKey in this.equipment) {
            const item = this.equipment[slotKey];
            if (item && item.affixes && item.affixes.some(a => a.effect === 'exp_bonus_15')) {
                hasExpBonus = true;
                break;
            }
        }
        if (hasExpBonus) actualAmount = Math.floor(actualAmount * 1.15);

        this.player.exp += actualAmount;
        const realmData = this.getRealmData();
        if (this.player.exp > realmData.maxExp * 1.5) { // 经验溢出上限
             this.player.exp = Math.floor(realmData.maxExp * 1.5);
        }
    }

    addMaterial(key, amount) {
        if (this.materials[key] !== undefined) {
            this.materials[key] += amount;
        }
    }

    removeMaterial(key, amount) {
        if (this.materials[key] >= amount) {
            this.materials[key] -= amount;
            return true;
        }
        return false;
    }

    hasMaterials(materialsObj) {
        for (const key in materialsObj) {
            if (this.materials[key] < materialsObj[key]) return false;
        }
        return true;
    }

    equipItem(item) {
        if (!item || !item.slot) return false;
        const oldItem = this.equipment[item.slot];
        if (oldItem) {
            this.addToInventory(oldItem);
        }
        this.equipment[item.slot] = item;
        this.removeFromInventory(item.id);
        return true;
    }

    unequipItem(slotKey) {
        const item = this.equipment[slotKey];
        if (item) {
            if (this.inventory.length >= window.XiuXian.Config.INVENTORY_MAX) {
                return false; // 背包已满
            }
            this.equipment[slotKey] = null;
            this.addToInventory(item);
            return true;
        }
        return false;
    }

    addToInventory(item) {
        if (this.inventory.length < window.XiuXian.Config.INVENTORY_MAX) {
            this.inventory.push(item);
            return true;
        }
        return false;
    }

    removeFromInventory(itemId) {
        const index = this.inventory.findIndex(i => i.id === itemId);
        if (index > -1) {
            this.inventory.splice(index, 1);
            return true;
        }
        return false;
    }
};
