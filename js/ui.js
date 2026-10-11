window.XiuXian = window.XiuXian || {};

XiuXian.UI = {
  init(state) {
    this.updateHeader(state);
    this.updateCultivation(state);
    this.updateGather(state);
    this.updateEquipment(state);
    this.updateForge(state);
    this.renderLogs(state);
  },

  updateHeader(state) {
    document.getElementById('char-name').textContent = state.player.name;
    document.getElementById('char-realm').textContent = state.getRealmData().name;
    document.getElementById('char-power').textContent = Math.floor(state.calculatePower());
    document.getElementById('char-luck').textContent = state.player.luck;
    document.getElementById('char-stones').textContent = state.player.spiritStones;
    
    let hearts = '';
    for(let i=0; i<state.player.heartFire; i++) hearts += '♥';
    document.getElementById('char-heartfire').textContent = hearts || '枯竭';
  },

  switchPanel(panelName) {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    
    const panel = document.getElementById(`panel-${panelName}`);
    if (panel) panel.classList.remove('hidden');
    
    const tab = document.querySelector(`.nav-tab[data-panel="${panelName}"]`);
    if (tab) tab.classList.add('active');
  },

  updateCultivation(state) {
    const realm = state.getRealmData();
    const expText = document.getElementById('exp-text');
    const expBar = document.getElementById('exp-bar');
    const btnBreakthrough = document.getElementById('btn-breakthrough');
    
    expText.textContent = `${Math.floor(state.player.exp)} / ${realm.maxExp}`;
    let percent = Math.min(100, (state.player.exp / realm.maxExp) * 100);
    expBar.style.width = `${percent}%`;

    btnBreakthrough.disabled = !state.canBreakthrough();

    const stats = state.getEquippedStats();
    document.getElementById('stat-atk').textContent = Math.floor(stats.atk);
    document.getElementById('stat-def').textContent = Math.floor(stats.def);
    document.getElementById('stat-spd').textContent = Math.floor(stats.spd);
    document.getElementById('stat-wis').textContent = Math.floor(stats.wis);
    document.getElementById('stat-hp').textContent = Math.floor(stats.hp);
    document.getElementById('stat-mp').textContent = Math.floor(stats.mp);
  },

  showCultivateResult(result) {
    if (result.isCrit) {
      this.showNotification("天人交感，修为大增！", "success");
    }
  },

  showBreakthroughResult(result) {
    if (result.success) {
      this.showNotification("突破成功！境界提升！", "success");
    } else {
      this.showNotification("突破失败，底蕴不足...", "danger");
    }
  },

  updateGather(state) {
    const listDiv = document.getElementById('gather-locations');
    listDiv.innerHTML = '';
    
    XiuXian.Config.GATHERING.locations.forEach((loc, index) => {
        const isUnlocked = state.player.realmIndex >= loc.unlockRealm;
        const card = document.createElement('div');
        card.className = 'location-card';
        card.innerHTML = `
            <div>
                <h4>${loc.name}</h4>
                <div class="material-cost">产出: ${loc.materials.map(m => XiuXian.Config.MATERIALS[m].name).join(', ')}</div>
            </div>
            <button class="btn-primary btn-gather" data-index="${index}" ${!isUnlocked ? 'disabled' : ''}>
                ${isUnlocked ? '采集' : '修为不足'}
            </button>
        `;
        listDiv.appendChild(card);
    });

    const bagDiv = document.getElementById('material-bag');
    bagDiv.innerHTML = '';
    for (const [key, count] of Object.entries(state.materials)) {
        if (count > 0) {
            const mat = XiuXian.Config.MATERIALS[key];
            const item = document.createElement('div');
            item.className = 'material-item';
            item.innerHTML = `<div class="icon">${mat.icon}</div><div>${mat.name}</div><div>x${count}</div>`;
            bagDiv.appendChild(item);
        }
    }
  },

  showGatherResult(result) {
     this.showNotification("采集完成", "success");
  },

  updateEquipment(state) {
    // 渲染槽位
    XiuXian.Config.EQUIPMENT_SLOTS.forEach(slotConf => {
        const slotEl = document.querySelector(`.equip-slot[data-slot="${slotConf.key}"]`);
        if (!slotEl) return;
        const item = state.equipment[slotConf.key];
        
        slotEl.className = `equip-slot`; // reset
        if (item) {
            slotEl.innerHTML = item.icon || '📦';
            // 添加品质特效
            const quality = XiuXian.Config.QUALITY_TIERS.find(q => q.name === item.quality);
            if (quality) slotEl.classList.add(quality.cssClass);
        } else {
            slotEl.innerHTML = '';
        }
    });

    // 渲染背包
    const invDiv = document.getElementById('inventory-list');
    invDiv.innerHTML = '';
    state.inventory.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'equip-list-item';
        el.innerHTML = `
            <div>
                <span>${item.icon || '📦'} ${item.name}</span>
                <span style="font-size: 12px; margin-left:10px;">+${item.layer}层</span>
            </div>
            <div>
                <button class="btn-secondary btn-equip" data-index="${index}">装备</button>
                <button class="btn-secondary btn-forge-target" data-index="${index}">百炼</button>
            </div>
        `;
        invDiv.appendChild(el);
    });
  },

  updateForge(state) {
    const listDiv = document.getElementById('recipe-list');
    listDiv.innerHTML = '';
    
    const recipes = XiuXian.Forge.getAvailableRecipes(state);
    recipes.forEach((recipe, idx) => {
        const canForge = XiuXian.Forge.canForge(state, recipe);
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        let matsHtml = Object.entries(recipe.materials).map(([matKey, count]) => {
            const has = state.materials[matKey] || 0;
            const matName = XiuXian.Config.MATERIALS[matKey].name;
            const sufficient = has >= count;
            return `<span class="${sufficient ? 'sufficient' : 'insufficient'}">${matName} ${has}/${count}</span>`;
        }).join(', ');

        card.innerHTML = `
            <h4>${recipe.name}</h4>
            <div class="material-cost">${matsHtml}</div>
            <button class="btn-primary btn-craft mt-2" data-recipe-idx="${idx}" ${!canForge ? 'disabled' : ''}>锻造</button>
        `;
        listDiv.appendChild(card);
    });
  },
  
  setUpgradeTarget(item, index) {
      const targetDiv = document.getElementById('upgrade-target');
      const btn = document.getElementById('btn-upgrade');
      
      targetDiv.dataset.invIndex = index;
      
      if (item) {
          targetDiv.innerHTML = item.icon || '📦';
          const quality = XiuXian.Config.QUALITY_TIERS.find(q => q.name === item.quality);
          targetDiv.className = `equip-slot ${quality ? quality.cssClass : ''}`;
          document.getElementById('upgrade-layer-text').textContent = `当前层数: ${item.layer}`;
          document.getElementById('upgrade-prob-text').textContent = `下一层成功率: -`; // 可自行计算
          btn.disabled = false;
      } else {
          targetDiv.innerHTML = '';
          targetDiv.className = 'equip-slot empty';
          document.getElementById('upgrade-layer-text').textContent = `当前层数: 0`;
          document.getElementById('upgrade-prob-text').textContent = `下一层成功率: -`;
          btn.disabled = true;
      }
  },
  
  showUpgradeResult(result) {
      if (result.success) {
          const targetDiv = document.getElementById('upgrade-target');
          targetDiv.classList.add('anvil-strike');
          setTimeout(() => targetDiv.classList.remove('anvil-strike'), 250);
          
          if(result.multiplier > 1) {
              const fly = document.createElement('div');
              fly.className = 'forge-mult-fly';
              fly.textContent = `x${result.multiplier}!`;
              targetDiv.appendChild(fly);
              setTimeout(() => fly.remove(), 1000);
          }
      }
  },

  updateDuel(duelState) {
     if(!duelState) return;
     document.getElementById('duel-player-hp-bar').style.width = `${Math.max(0, (duelState.playerHp / duelState.playerMaxHp) * 100)}%`;
     document.getElementById('duel-opponent-hp-bar').style.width = `${Math.max(0, (duelState.opponentHp / duelState.opponentMaxHp) * 100)}%`;
     
     document.getElementById('duel-player-power').textContent = duelState.playerPower;
     document.getElementById('duel-opponent-power').textContent = duelState.opponentPower;
     
     if (duelState.opponent) {
         document.getElementById('duel-opponent-name').textContent = duelState.opponent.name;
     }
  },
  
  showDuelRound(roundResult) {
      const pDice = document.getElementById('duel-player-dice');
      const oDice = document.getElementById('duel-opponent-dice');
      pDice.innerHTML = ''; oDice.innerHTML = '';
      
      roundResult.playerRolls.forEach(val => {
          pDice.innerHTML += `<div class="dice">${val}</div>`;
      });
      roundResult.opponentRolls.forEach(val => {
          oDice.innerHTML += `<div class="dice">${val}</div>`;
      });
      
      document.getElementById('duel-narrative').textContent = roundResult.log;
  },
  
  showDuelEnd(result) {
      this.showNotification(result.message, result.winner === 'player' ? 'success' : 'danger');
  },

  updateExpedition(expState) {
      if (!expState) {
          document.getElementById('expedition-entrance').classList.remove('hidden');
          document.getElementById('expedition-active').classList.add('hidden');
          return;
      }
      document.getElementById('expedition-entrance').classList.add('hidden');
      document.getElementById('expedition-active').classList.remove('hidden');
      
      document.getElementById('expedition-steps').textContent = expState.steps;
      
      const lootDiv = document.getElementById('temp-loot');
      lootDiv.innerHTML = '';
      for(const [k, v] of Object.entries(expState.loot)) {
          if (v > 0) {
              const mat = XiuXian.Config.MATERIALS[k];
              lootDiv.innerHTML += `<div class="material-item"><div class="icon">${mat.icon}</div><div>x${v}</div></div>`;
          }
      }
  },
  
  showExpeditionEvent(eventMsg) {
      document.getElementById('expedition-event').textContent = eventMsg;
  },

  renderLogs(state) {
      const container = document.getElementById('log-entries');
      container.innerHTML = '';
      state.logs.forEach(log => {
          const el = document.createElement('div');
          el.className = `log-entry log-${log.type}`;
          el.textContent = `[${log.timestamp}] ${log.text}`;
          container.appendChild(el);
      });
      container.scrollTop = container.scrollHeight;
  },

  addLog(text, type) {
      const container = document.getElementById('log-entries');
      const el = document.createElement('div');
      el.className = `log-entry log-${type}`;
      const d = new Date();
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      el.textContent = `[${timeStr}] ${text}`;
      container.appendChild(el);
      container.scrollTop = container.scrollHeight;
  },

  showNotification(message, type = 'info') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification-${type}`;
    notif.classList.remove('hidden');
    
    setTimeout(() => {
      notif.classList.add('hidden');
    }, 3000);
  }
};
