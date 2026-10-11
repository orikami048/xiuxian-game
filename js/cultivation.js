window.XiuXian = window.XiuXian || {};

window.XiuXian.Cultivation = {
    cultivate: function(state) {
        const realmData = state.getRealmData();
        const luck = state.player.luck;
        
        // 暴击判定: CritRate = Luck * 0.0035
        const critRate = luck * 0.0035;
        const roll = Math.random();
        const isCrit = roll < critRate;

        // 公式: ClickGain = floor(ClickExp * (Luck>70 ? 1.2 : 1.0) * (isCrit ? 2.2 : 1.0))
        const luckMult = luck > 70 ? 1.2 : 1.0;
        const critMult = isCrit ? 2.2 : 1.0;
        const expGained = Math.floor(realmData.clickExp * luckMult * critMult);

        state.addExp(expGained);

        return {
            expGained,
            isCrit,
            message: isCrit ? `冥想中福至心灵，暴击获得 ${expGained} 点修为！` : `吐纳灵气，获得 ${expGained} 点修为。`
        };
    },

    breakthrough: function(state) {
        if (!state.canBreakthrough()) {
            return { success: false, message: '尚未达到突破条件。' };
        }

        const realmData = state.getRealmData();
        const luck = state.player.luck;

        // 检查真言: 道心通明 (突破+10%)
        let hasBreakthroughBonus = false;
        for (const slotKey in state.equipment) {
            const item = state.equipment[slotKey];
            if (item && item.affixes && item.affixes.some(a => a.effect === 'breakthrough_10')) {
                hasBreakthroughBonus = true;
                break;
            }
        }

        // 阈值 Threshold = floor((100-Luck)/2)
        let threshold = Math.floor((100 - luck) / 2);
        if (hasBreakthroughBonus) {
            threshold = Math.max(1, threshold - 10);
        }

        const roll = Math.floor(Math.random() * 100) + 1; // 1-100
        const success = roll >= threshold;

        if (success) {
            state.player.realmIndex += 1;
            state.player.exp -= realmData.maxExp;
            if (state.player.exp < 0) state.player.exp = 0;
            state.player.luck = Math.min(100, state.player.luck + 5);
            return { success: true, roll, threshold, message: `突破成功！境界提升至【${window.XiuXian.Config.REALMS[state.player.realmIndex].name}】。机缘+5。` };
        } else {
            state.player.exp = Math.floor(state.player.exp * 0.85);
            state.player.luck = Math.max(10, state.player.luck - 8);
            return { success: false, roll, threshold, message: `突破失败！遭到雷劫反噬，修为受损，机缘-8。` };
        }
    },

    gather: function(state, locationIndex) {
        const locations = window.XiuXian.Config.GATHERING.locations;
        const loc = locations[locationIndex];
        
        if (state.player.realmIndex < loc.unlockRealm) {
            return { materials: {}, message: `境界不足，无法前往【${loc.name}】。` };
        }

        const luck = state.player.luck;
        const materialsGathered = {};
        let msgStr = `在【${loc.name}】中探索，`;

        loc.materials.forEach(matKey => {
            // 产出: baseYield ± 随机1
            let amount = loc.baseYield + (Math.random() < 0.5 ? -1 : (Math.random() < 0.5 ? 1 : 0));
            if (amount < 0) amount = 0;

            // luck>80时额外+1稀有材料概率
            if (luck > 80 && Math.random() < 0.3) {
                amount += 1;
            }

            if (amount > 0) {
                materialsGathered[matKey] = amount;
                state.addMaterial(matKey, amount);
                msgStr += `获得 ${window.XiuXian.Config.MATERIALS[matKey].name} x${amount} `;
            }
        });

        if (Object.keys(materialsGathered).length === 0) {
            msgStr += "一无所获。";
        }

        return { materials: materialsGathered, message: msgStr };
    }
};
