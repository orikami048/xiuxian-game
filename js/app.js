window.XiuXian = window.XiuXian || {};

XiuXian.App = {
  state: null,
  particles: null,
  duelState: null,
  expeditionState: null,
  autoTickInterval: null,
  
  init() {
    // 确保依赖模块存在，这里做简单的兜底
    if (!XiuXian.GameState) {
        console.warn("逻辑层尚未实现，暂用 Mock 数据");
        this.mockLogic();
    }

    this.state = new XiuXian.GameState();
    this.state.load();
    
    this.particles = new XiuXian.ParticleSystem('char-particles-canvas');
    this.particles.start();
    
    XiuXian.UI.init(this.state);
    
    this.bindEvents();
    this.startAutoTick();
    
    if (this.state.logs.length === 0) {
        this.logMessage('修仙之路，自此开始。', 'info');
    }
  },
  
  mockLogic() {
      // 临时 Mock 以便 UI 独立运行测试
      XiuXian.GameState = class {
          constructor() {
              this.player = { name: "散修", realmIndex: 0, exp: 0, luck: 75, heartFire: 3, spiritStones: 0 };
              this.equipment = {};
              this.inventory = [];
              this.materials = {};
              this.logs = [];
          }
          load() {} save() {}
          getRealmData() { return { name: "炼气一层", maxExp: 100, secExp: 1 }; }
          calculatePower() { return 10; }
          canBreakthrough() { return this.player.exp >= 100; }
          getEquippedStats() { return {atk:1, def:1, spd:1, wis:1, hp:10, mp:10}; }
          addExp(v) { this.player.exp += v; }
          addLog(text, type) {
              const d = new Date();
              this.logs.push({text, type, timestamp: `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`});
          }
      };
      XiuXian.Config = {
          MATERIALS: {}, EQUIPMENT_SLOTS: [], RECIPES: [], GATHERING: {locations:[]}, QUALITY_TIERS: []
      };
      XiuXian.Cultivation = { cultivate: () => ({expGained: 5, isCrit: false, message: "打坐吐纳"}) };
      XiuXian.Forge = { getAvailableRecipes: () => [] };
  },

  bindEvents() {
    // 导航
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => XiuXian.UI.switchPanel(tab.dataset.panel));
    });
    
    // 修炼
    const btnCultivate = document.getElementById('btn-cultivate');
    if(btnCultivate) btnCultivate.addEventListener('click', () => this.onCultivate());
    
    const btnBreakthrough = document.getElementById('btn-breakthrough');
    if(btnBreakthrough) btnBreakthrough.addEventListener('click', () => this.onBreakthrough());
    
    // 采集 (事件委托)
    document.getElementById('gather-locations')?.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-gather')) {
            this.onGather(parseInt(e.target.dataset.index));
        }
    });

    // 装备面板 - 穿戴/设定百炼目标
    document.getElementById('inventory-list')?.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-equip')) {
            // this.onEquip(e.target.dataset.index);
            this.logMessage("穿戴装备逻辑待接入", "info");
        } else if (e.target.classList.contains('btn-forge-target')) {
            const idx = e.target.dataset.index;
            XiuXian.UI.setUpgradeTarget(this.state.inventory[idx], idx);
            XiuXian.UI.switchPanel('forge');
        }
    });

    // 锻造 - 打造
    document.getElementById('recipe-list')?.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-craft')) {
            this.logMessage("锻造逻辑待接入", "info");
        }
    });

    // 锻造 - 百炼
    document.getElementById('btn-upgrade')?.addEventListener('click', () => {
        this.logMessage("挥锤百炼逻辑待接入", "info");
    });
    
    // 论道
    document.getElementById('btn-start-duel')?.addEventListener('click', () => {
        this.logMessage("寻找对手逻辑待接入", "info");
    });
    
    // 秘境
    document.getElementById('btn-enter-expedition')?.addEventListener('click', () => {
        if (!XiuXian.Combat) {
            this.logMessage("战斗引擎尚未加载", "danger");
            return;
        }
        this.expeditionState = XiuXian.Combat.startExpedition(this.state);
        XiuXian.UI.updateExpedition(this.expeditionState);
        XiuXian.UI.showExpeditionEvent("你踏入了太虚古墟...");
    });
    document.getElementById('btn-expedition-retreat')?.addEventListener('click', () => {
        this.expeditionState = null;
        XiuXian.UI.updateExpedition(null);
        this.logMessage("安全撤离秘境", "success");
    });
  },
  
  startAutoTick() {
    this.autoTickInterval = setInterval(() => {
      if(!this.state) return;
      const realm = this.state.getRealmData();
      if (this.state.player.exp < realm.maxExp) {
          this.state.addExp(realm.secExp);
          this.state.save();
          XiuXian.UI.updateCultivation(this.state);
          XiuXian.UI.updateHeader(this.state);
      }
    }, 1000);
  },
  
  onCultivate() {
    if(!XiuXian.Cultivation) return;
    const result = XiuXian.Cultivation.cultivate(this.state);
    this.state.save();
    
    XiuXian.UI.updateCultivation(this.state);
    XiuXian.UI.updateHeader(this.state);
    XiuXian.UI.showCultivateResult(result);
    
    if (result.isCrit) {
      this.particles.burst(150, 200, 'rgba(212,163,75,0.8)', 15);
    }
    this.logMessage(result.message, result.isCrit ? 'blessing' : 'info');
  },

  onBreakthrough() {
      if(!XiuXian.Cultivation || !XiuXian.Cultivation.breakthrough) return;
      const result = XiuXian.Cultivation.breakthrough(this.state);
      this.state.save();
      
      XiuXian.UI.updateCultivation(this.state);
      XiuXian.UI.updateHeader(this.state);
      XiuXian.UI.showBreakthroughResult(result);
      this.logMessage(result.message, result.success ? 'success' : 'danger');
  },

  onGather(index) {
      if(!XiuXian.Cultivation || !XiuXian.Cultivation.gather) {
          this.logMessage("采集模块未加载", "danger");
          return;
      }
      const result = XiuXian.Cultivation.gather(this.state, index);
      this.state.save();
      XiuXian.UI.updateGather(this.state);
      XiuXian.UI.showGatherResult(result);
      this.logMessage(result.message, 'info');
  },
  
  logMessage(text, type) {
      this.state.addLog(text, type);
      XiuXian.UI.addLog(text, type);
  }
};

document.addEventListener('DOMContentLoaded', () => XiuXian.App.init());
