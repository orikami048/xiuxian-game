window.XiuXian = window.XiuXian || {};

window.XiuXian.Combat = {
    _names: ['清风道人', '玄冰子', '九天散仙', '紫霞仙子', '破军星君', '贪狼妖王', '血影老祖', '凌云剑客', '百草真人', '千幻魔宗', '天星长老', '幽冥鬼使', '赤炎狂魔', '无极仙尊', '逍遥散人'],

    createOpponent: function(realmIndex) {
        const realms = window.XiuXian.Config.REALMS;
        const maxR = realms.length - 1;
        const rIdx = Math.min(Math.max(realmIndex + (Math.floor(Math.random()*3)-1), 0), maxR); // 附近境界
        const realm = realms[rIdx];
        
        const name = this._names[Math.floor(Math.random() * this._names.length)];
        
        return {
            name,
            realm: realm.name,
            realmIndex: rIdx,
            power: Math.floor(realm.basePow * (1 + Math.random() * 0.2)),
            maxHp: realm.baseHp,
            hp: realm.baseHp,
            atk: realm.baseAtk,
            def: realm.baseDef,
            luck: 40 + Math.floor(Math.random() * 40),
            equipment: []
        };
    },

    initDuel: function(playerState) {
        const playerPower = playerState.calculatePower();
        const playerStats = playerState.getEquippedStats();
        const realmData = playerState.getRealmData();
        const playerMaxHp = realmData.baseHp + playerStats.hp;

        return {
            player: {
                hp: playerMaxHp,
                maxHp: playerMaxHp,
                power: playerPower
            },
            opponent: this.createOpponent(playerState.player.realmIndex),
            round: 0,
            finished: false
        };
    },

    duelRound: function(duelState, playerState) {
        duelState.round++;
        
        const rollDice = () => [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
        let pDice = rollDice();
        let oDice = rollDice();
        let narrative = `第 ${duelState.round} 回合交锋：\n`;

        // 真言介入
        let hasFuze = false;
        let hasYinguo = false;
        
        for (const key in playerState.equipment) {
            const item = playerState.equipment[key];
            if (item && item.affixes) {
                if (item.affixes.some(a => a.effect === 'dice_min_3')) hasFuze = true;
                if (item.affixes.some(a => a.effect === 'reroll_min_dice')) hasYinguo = true;
            }
        }

        if (hasFuze) {
            let triggered = false;
            pDice = pDice.map(d => {
                if (d < 3) { triggered = true; return 3; }
                return d;
            });
            if (triggered) narrative += `[福泽天眷]触发，强行拉升气运！\n`;
        }

        if (hasYinguo) {
            const minDice = Math.min(...pDice);
            const minIndex = pDice.indexOf(minDice);
            pDice[minIndex] = Math.floor(Math.random()*6)+1;
            narrative += `[因果逆转]触发，重铸了一丝气数！\n`;
        }

        const pSum = pDice.reduce((a,b)=>a+b, 0);
        const oSum = oDice.reduce((a,b)=>a+b, 0);

        // 伤害计算: Dmg = max(10, floor(sumDice * (Power/15)))
        const pDmg = Math.max(10, Math.floor(pSum * (duelState.player.power / 15)));
        const oDmg = Math.max(10, Math.floor(oSum * (duelState.opponent.power / 15)));

        duelState.opponent.hp -= pDmg;
        duelState.player.hp -= oDmg;

        narrative += `你掷出 ${pDice.join(',')} (${pSum})，造成 ${pDmg} 伤害。\n`;
        narrative += `对手掷出 ${oDice.join(',')} (${oSum})，造成 ${oDmg} 伤害。`;

        let finished = false;
        let winner = null;

        if (duelState.player.hp <= 0 && duelState.opponent.hp <= 0) {
             finished = true;
             winner = 'draw';
        } else if (duelState.opponent.hp <= 0) {
             finished = true;
             winner = 'player';
        } else if (duelState.player.hp <= 0) {
             finished = true;
             winner = 'opponent';
        }

        duelState.finished = finished;

        return {
            playerDice: pDice,
            opponentDice: oDice,
            playerDmg: pDmg,
            opponentDmg: oDmg,
            playerHpLeft: duelState.player.hp,
            opponentHpLeft: duelState.opponent.hp,
            narrative,
            finished,
            winner
        };
    },

    resolveDuelVictory: function(state, opponent) {
        const stones = 50 + opponent.realmIndex * 100;
        state.player.spiritStones += stones;
        state.player.luck = Math.min(100, state.player.luck + 1);
        return `论道胜利！获得灵石 ${stones}，机缘+1。`;
    },

    resolveDuelDefeat: function(state) {
        state.player.luck = Math.max(10, state.player.luck - 2);
        return `论道落败。机缘-2。`;
    },

    // 秘境系统
    startExpedition: function(state) {
        if (state.player.heartFire <= 0) {
            return { inExpedition: false, message: '心火已熄，无法踏入太虚古墟。' };
        }
        return {
            inExpedition: true,
            tempLoot: [],
            steps: 0,
            maxSteps: 8,
            message: '燃起心火，踏入太虚古墟。'
        };
    },

    expeditionStep: function(state, expeditionState) {
        expeditionState.steps++;
        const r = Math.random();
        let event = '';
        let result = null;
        let message = '';

        if (r < 0.60) { // 发现材料宝箱
            event = 'chest';
            const mats = window.XiuXian.Config.MATERIALS;
            const keys = Object.keys(mats);
            const key = keys[Math.floor(Math.random() * keys.length)];
            const amount = Math.floor(Math.random() * 3) + 1;
            expeditionState.tempLoot.push({ type: 'material', key, amount });
            message = `发现残破宝箱，获得 ${mats[key].name} x${amount}。`;
        } else if (r < 0.80) { // 遭遇战
            event = 'combat';
            result = this.createOpponent(state.player.realmIndex);
            message = `遭遇劫修【${result.name}】！`;
        } else if (r < 0.95) { // 发现灵石
            event = 'spiritStones';
            const amount = Math.floor(Math.random() * 50) + 10;
            expeditionState.tempLoot.push({ type: 'stones', amount });
            message = `发现 ${amount} 块下品灵石。`;
        } else { // 陷阱
            event = 'trap';
            const lossExp = Math.floor(state.player.exp * 0.05);
            state.player.exp = Math.max(0, state.player.exp - lossExp);
            message = `踩中残阵，流失了 ${lossExp} 点修为！`;
        }

        return { event, result, message, stepsLeft: expeditionState.maxSteps - expeditionState.steps };
    },

    expeditionFight: function(state, encounter) {
        const playerPower = state.calculatePower();
        const luck = state.player.luck;
        
        // Score = D100 + floor(Power/10) + floor(Luck/5)
        const playerScore = Math.floor(Math.random()*100 + 1) + Math.floor(playerPower/10) + Math.floor(luck/5);
        const opponentScore = Math.floor(Math.random()*100 + 1) + Math.floor(encounter.power/10) + Math.floor(encounter.luck/5);

        const victory = playerScore >= opponentScore;
        let rewards = {};
        let message = '';

        if (victory) {
            let stones = 100;
            rewards.stones = stones;
            message = `险胜劫修，夺得 ${stones} 灵石。`;
            
            // 35% 抽心火
            if (Math.random() < 0.35) {
                state.player.luck = Math.min(100, state.player.luck + 4);
                message += ` 吸取运数，机缘+4。`;
            }
        } else {
            state.player.heartFire = Math.max(0, state.player.heartFire - 1);
            state.player.luck = Math.max(10, state.player.luck - 10);
            
            let lostItem = null;
            const equipKeys = Object.keys(state.equipment).filter(k => state.equipment[k] !== null);
            
            let protected = false;
            for (const k of equipKeys) {
                 if (state.equipment[k].affixes && state.equipment[k].affixes.some(a => a.effect === 'protect_equip_50')) {
                     if (Math.random() < 0.5) protected = true;
                 }
            }

            if (equipKeys.length > 0 && !protected && Math.random() < 0.45) { // 45% 被夺
                const dropKey = equipKeys[Math.floor(Math.random() * equipKeys.length)];
                lostItem = state.equipment[dropKey];
                state.equipment[dropKey] = null;
                message = `重伤败逃，法宝【${lostItem.name}】被夺！丢失收获，心火-1，机缘-10。`;
            } else if (equipKeys.length > 0 && !protected) { // 55% 受损 (目前仅文案提示)
                message = `重伤败逃，法宝受损！丢失收获，心火-1，机缘-10。`;
            } else if (protected) {
                message = `重伤败逃，【仙灵护体】生效保住了装备。丢失收获，心火-1，机缘-10。`;
            } else {
                 message = `重伤败逃！丢失收获，心火-1，机缘-10。`;
            }
        }

        return { victory, playerScore, opponentScore, rewards, message };
    },

    retreatExpedition: function(state, expeditionState) {
        let lootSummary = '';
        let stones = 0;
        let mats = {};

        expeditionState.tempLoot.forEach(item => {
            if (item.type === 'stones') {
                stones += item.amount;
                state.player.spiritStones += item.amount;
            } else if (item.type === 'material') {
                if (!mats[item.key]) mats[item.key] = 0;
                mats[item.key] += item.amount;
                state.addMaterial(item.key, item.amount);
            }
        });

        if (stones > 0) lootSummary += `灵石 x${stones} `;
        for (const k in mats) {
            lootSummary += `${window.XiuXian.Config.MATERIALS[k].name} x${mats[k]} `;
        }

        if (!lootSummary) lootSummary = '空手而归';

        return {
            loot: expeditionState.tempLoot,
            message: `安全撤离古墟。本次收获：${lootSummary}`
        };
    }
};
