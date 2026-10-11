/**
 * 百炼三昧锻造台 - 装备锻造与升级引擎
 * PRD 第4节严格实现
 */
window.XiuXian = window.XiuXian || {};

window.XiuXian.Forge = {
    /**
     * 获取当前境界可用配方
     */
    getAvailableRecipes: function(state) {
        const realmIndex = state.player.realmIndex;
        const recipes = window.XiuXian.Config.RECIPES;
        let available = [...recipes.tier1];
        if (realmIndex >= 4) available = available.concat(recipes.tier2);
        if (realmIndex >= 6) available = available.concat(recipes.tier3);
        return available;
    },

    /**
     * 检查材料是否充足
     */
    canForge: function(state, recipe) {
        return state.hasMaterials(recipe.materials);
    },

    /**
     * 查找配方所属阶
     */
    _getRecipeTier: function(recipe) {
        const R = window.XiuXian.Config.RECIPES;
        if (R.tier3.indexOf(recipe) !== -1) return 3;
        if (R.tier2.indexOf(recipe) !== -1) return 2;
        return 1;
    },

    /**
     * 锻造新装备
     * 消耗材料，生成带真名烙印的初始装备
     */
    craft: function(state, recipe) {
        if (!this.canForge(state, recipe)) {
            return { item: null, message: '材料不足，无法锻造。' };
        }
        if (state.inventory.length >= window.XiuXian.Config.INVENTORY_MAX) {
            return { item: null, message: '背包已满，无法锻造。' };
        }

        // 消耗材料
        for (const matKey in recipe.materials) {
            state.removeMaterial(matKey, recipe.materials[matKey]);
        }

        const tierNumber = this._getRecipeTier(recipe);
        const slotConf = window.XiuXian.Config.EQUIPMENT_SLOTS.find(s => s.key === recipe.slot);

        const item = {
            id: 'eq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: recipe.name,
            slot: recipe.slot,
            icon: slotConf ? slotConf.icon : '📦',
            tier: tierNumber,
            layer: 1,
            quality: '灵品·清辉',
            qualityClass: 'quality-ling',
            // 存储基础属性（不随层数变化的原始值）
            baseStats: { ...recipe.stats },
            // 当前实际属性（受 Growth 曲线影响）
            stats: { ...recipe.stats },
            basePower: recipe.basePower,
            power: recipe.basePower,
            // 锻造者真名烙印 (PRD 公理二)
            creator: state.player.name,
            createdYear: new Date().getFullYear(),
            forgedLuck: state.player.luck,
            // 因果流转履历 (PRD 公理三)
            lineage: ['由「' + state.player.name + '」亲手锻造于' + new Date().getFullYear() + '年'],
            affixes: []
        };

        state.addToInventory(item);
        return { item, message: `成功锻造出【${item.name}】！` };
    },

    /**
     * 百炼冲层 (1→10)
     * PRD 4.3 严格实现：概率矩阵 + 倍率引擎 + 品质晋升 + 真言觉醒
     */
    upgrade: function(item, luck) {
        if (!item) return { success: false, message: '请先选择要百炼的法宝。' };
        if (item.layer >= 10) return { success: false, message: '法宝已臻大圆满，无法继续百炼。' };

        const config = window.XiuXian.Config;

        // === PRD 4.3.1 概率计算 ===
        const baseRate = config.FORGE_RATES[item.layer - 1];
        const p = Math.min(0.98, baseRate + (luck - 50) * 0.001);

        if (Math.random() > p) {
            return {
                success: false,
                newLayer: item.layer,
                multiplier: 1.0,
                quality: item.quality,
                affixGained: null,
                message: `百炼失败！法宝轻微震荡，层数不变。(成功率: ${(p * 100).toFixed(1)}%)`
            };
        }

        // === PRD 4.3.2 倍率引擎 ===
        let multiplier = 1.1;
        const t3 = 100 - (luck > 80 ? 12 : 5);
        const t2 = t3 - (luck > 75 ? 20 : 12);
        const r = Math.random() * 100;

        if (r >= t3) multiplier = 3.0;
        else if (r >= t2) multiplier = 2.0;
        else if (r >= 40) multiplier = 1.3;
        else if (r >= 20) multiplier = 1.2;

        // 冲层成功
        item.layer += 1;

        // === PRD 4.3.3 基于 Growth 曲线重算属性 ===
        const growth = config.GROWTH_CURVE[item.layer - 1];

        // Stat_i = floor(BaseStat_i × Growth(L))
        for (const stat in item.baseStats) {
            item.stats[stat] = Math.floor(item.baseStats[stat] * growth);
        }

        // Power = floor(BasePower × Growth(L) × (1 + (M-1) × 0.5))
        item.power = Math.floor(item.basePower * growth * (1 + (multiplier - 1) * 0.5));

        // === PRD 4.3.4 品质晋升 ===
        let qualityObj;
        if (item.layer >= 10) qualityObj = config.QUALITY_TIERS[3];
        else if (item.layer >= 7) qualityObj = config.QUALITY_TIERS[2];
        else if (item.layer >= 4) qualityObj = config.QUALITY_TIERS[1];
        else qualityObj = config.QUALITY_TIERS[0];

        item.quality = qualityObj.name;
        item.qualityClass = qualityObj.cssClass;

        // === 真言觉醒检查 ===
        let affixGained = null;
        let shouldAwaken = false;

        if (item.layer === 10) {
            // 仙品：100% 觉醒顶级真言
            shouldAwaken = true;
        } else if (item.layer >= 7 && item.affixes.length < 2) {
            // 宝品：100% 觉醒
            shouldAwaken = true;
        } else if (item.layer >= 4 && item.layer < 7 && item.affixes.length < 1) {
            // 玄品：50% 觉醒
            shouldAwaken = Math.random() < 0.5;
        }

        if (shouldAwaken) {
            const available = config.AFFIXES.filter(a => !item.affixes.find(ia => ia.id === a.id));
            if (available.length > 0) {
                affixGained = available[Math.floor(Math.random() * available.length)];
                item.affixes.push({ ...affixGained });
            }
        }

        // 构建消息
        let msg = `百炼成功！法宝升至【${item.layer}层】`;
        if (multiplier >= 3.0) msg += '，天道大开光！三倍共鸣！';
        else if (multiplier >= 2.0) msg += '，精金异化暴击！双倍共鸣！';
        else msg += `，${multiplier}x 共鸣。`;
        if (affixGained) msg += ` 觉醒真言：【${affixGained.name}】！`;

        return {
            success: true,
            newLayer: item.layer,
            multiplier,
            quality: item.quality,
            affixGained,
            message: msg
        };
    }
};
