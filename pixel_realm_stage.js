/* 
  Mushreb 式仙池夜境光影引擎 (Moonlit Sacred Lake Stage Engine)
  针对“背景与角色糊在一起”的终极解法：
  1. 【皓月当空 (Luminous Moon Disc)】：角色头部与白发背后升起通透明月，纯黑像素描边在皓月前形成极致锐利剪影！
  2. 【碧波极光倒影 (Aurora Water Reflection)】：完全对标 Mushreb 视频，湖水不再是死黑，而是泛着青碧灵光与月影。
  3. 【白玉灵台与仙石灯 (Mushreb 同款受光地台)】：脚下拥有受光青石岛屿与灵灯光圈，使暗色道袍与黑描边彻底浮出水面！
  4. 【纯像素级渲染】：拒绝现代平滑高斯模糊，全部使用像素级点阵与硬阶梯色阶。
*/

window.initPixelRealmStage = function() {
  const canvas = document.getElementById("pixel-realm-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const W = 250;
  const H = 215;
  canvas.width = W;
  canvas.height = H;

  let frameTick = 0;
  let burstLife = 0;

  window.triggerPixelDitherBurst = function(isCrit) {
    burstLife = isCrit ? 45 : 25;
  };

  // 仙境萤火灵尘
  const motes = [];
  for (let i = 0; i < 35; i++) {
    motes.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.2 - Math.random() * 0.35,
      size: Math.random() > 0.75 ? 2 : 1,
      color: Math.random() > 0.5 ? "#5cdbd3" : (Math.random() > 0.5 ? "#ffe58f" : "#b7eb8f"),
      phase: Math.random() * Math.PI * 2
    });
  }

  function render() {
    frameTick++;

    // 1. 深邃清澈夜空 (明暗分明的幽蓝渐变)
    drawNightSky(ctx, W, H);

    // 2. 核心明度支撑：角色背后的【一轮浩瀚皎洁仙月】
    // 将角色头顶与白发完全托出，黑描边与皓月产生 100% 锐利对比
    drawSacredMoon(ctx, W / 2, 82, frameTick);

    // 3. 远方群山月光剪影 (山巅带月白高光亮线)
    drawMountains(ctx, W, H);

    // 4. 灵泉湖水与极光月影 (对标 Mushreb 的发光湖面，彻底打破死黑)
    drawAuroraLake(ctx, W, H, frameTick);

    // 5. 角色立足的【受光白玉石岛台】(Mushreb 同款灯下高亮小岛)
    drawStoneIsland(ctx, W / 2, 175, frameTick);

    // 6. 左右两侧【引魂仙石灯】(投射温暖金光光圈)
    drawLantern(ctx, 28, 125, frameTick, "#ffc53d");
    drawLantern(ctx, W - 28, 125, frameTick + 20, "#ffc53d");

    // 7. 点击时的像素放射神光
    if (burstLife > 0) {
      drawDitherRays(ctx, W / 2, 135, frameTick, burstLife);
      burstLife--;
    }

    // 8. 漂浮灵尘萤火
    motes.forEach(m => {
      m.x += m.vx;
      m.y += m.vy;
      if (m.y < 15) { m.y = H - 15; m.x = Math.random() * W; }
      if (m.x < 0) m.x = W;
      if (m.x > W) m.x = 0;

      const alpha = (Math.sin(frameTick * 0.06 + m.phase) + 1) / 2;
      if (alpha > 0.25) {
        ctx.fillStyle = m.color;
        ctx.fillRect(Math.floor(m.x), Math.floor(m.y), m.size, m.size);
      }
    });

    requestAnimationFrame(render);
  }

  // 1. 夜空背景 (纯正像素色带)
  function drawNightSky(ctx, W, H) {
    const skyBands = [
      { y: 0, h: 25, color: "#060913" },
      { y: 25, h: 30, color: "#0b1122" },
      { y: 55, h: 35, color: "#111c35" },
      { y: 90, h: 30, color: "#182a4d" }
    ];
    skyBands.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(0, b.y, W, b.h);
    });

    // 细碎微光繁星
    ctx.fillStyle = "#bae7ff";
    ctx.fillRect(35, 18, 1, 1);
    ctx.fillRect(80, 28, 1, 1);
    ctx.fillRect(195, 14, 2, 1);
    ctx.fillRect(225, 32, 1, 1);
    ctx.fillRect(160, 22, 1, 1);
  }

  // 2. 皓月当空 (高明度圆形月轮 + 像素同心光晕)
  function drawSacredMoon(ctx, cx, cy, tick) {
    // 外层像素微光光环 (Dithered outer halo)
    const breathe = Math.sin(tick * 0.04) * 2;
    const rOuter = 58 + breathe;
    
    // 柔和外光圈
    ctx.fillStyle = "rgba(105, 192, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter + 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(145, 213, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter + 6, 0, Math.PI * 2);
    ctx.fill();

    // 月轮外边缘层 (青白微蓝)
    ctx.fillStyle = "#91d5ff";
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();

    // 月轮核心亮层 (高亮奶白，为发簪与黑发提供极强反差)
    ctx.fillStyle = "#e6f7ff";
    ctx.beginPath();
    ctx.arc(cx, cy, 43, 0, Math.PI * 2);
    ctx.fill();

    // 月心皎洁纯白
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();

    // 仙月表面微弱环形山/仙宫暗纹 (像素质感)
    ctx.fillStyle = "#d3eeff";
    ctx.fillRect(cx - 18, cy - 12, 10, 4);
    ctx.fillRect(cx - 12, cy - 8, 14, 5);
    ctx.fillRect(cx + 8, cy + 6, 8, 3);
  }

  // 3. 远方群山月光剪影 (山脊被月光镀银)
  function drawMountains(ctx, W, H) {
    // 远山 1 (左)
    ctx.fillStyle = "#162846";
    ctx.beginPath();
    ctx.moveTo(0, 115);
    ctx.lineTo(45, 65);
    ctx.lineTo(95, 115);
    ctx.closePath();
    ctx.fill();
    // 镀银峰尖
    ctx.fillStyle = "#69c0ff";
    ctx.fillRect(44, 65, 3, 2);
    ctx.fillRect(42, 67, 7, 2);

    // 远山 2 (右)
    ctx.fillStyle = "#1b3154";
    ctx.beginPath();
    ctx.moveTo(155, 115);
    ctx.lineTo(210, 58);
    ctx.lineTo(250, 115);
    ctx.closePath();
    ctx.fill();
    // 镀银峰尖
    ctx.fillStyle = "#69c0ff";
    ctx.fillRect(209, 58, 3, 2);
    ctx.fillRect(207, 60, 7, 2);

    // 远景墨绿松针剪影
    ctx.fillStyle = "#0d2625";
    for (let x = 0; x < W; x += 14) {
      if (x > 90 && x < 160) continue; // 留出中央视线给明月与角色
      const th = 16 + ((x * 7) % 8);
      ctx.fillRect(x + 2, 118 - th, 7, th);
      ctx.fillRect(x + 3, 118 - th - 3, 5, 3);
      ctx.fillRect(x + 5, 118 - th - 5, 1, 2);
    }
  }

  // 4. 碧波灵泉与极光月影 (Mushreb 式发光水面)
  function drawAuroraLake(ctx, W, H, tick) {
    // 水体基础深青蓝
    ctx.fillStyle = "#0c2836";
    ctx.fillRect(0, 115, W, H - 115);

    // 极光碧波光带 (Mushreb 截图中的翡翠绿/青蓝水面倒影)
    const waveShift = Math.floor(tick / 6) % 16;
    
    // 极光渐层横条 (由浅入深，明度高，衬托前景石岛)
    ctx.fillStyle = "#134e5e";
    ctx.fillRect(0, 122, W, 22);

    ctx.fillStyle = "#16687a";
    ctx.fillRect(15, 128, W - 30, 12);

    // 中央月影水面倒影柱 (垂直垂落的金蓝反光柱)
    const moonReflectW = 60;
    const moonReflectX = (W - moonReflectW) / 2;
    ctx.fillStyle = "rgba(82, 196, 26, 0.15)";
    ctx.fillRect(moonReflectX - 10, 118, moonReflectW + 20, 60);

    ctx.fillStyle = "rgba(54, 207, 201, 0.35)";
    ctx.fillRect(moonReflectX, 118, moonReflectW, 55);

    // 灵动的水光波纹 (像素小横线，向两侧荡漾)
    ctx.fillStyle = "#87e8de";
    for (let y = 120; y < 170; y += 8) {
      const offset = (Math.sin(tick * 0.05 + y) * 8);
      const px = (W / 2) + offset;
      ctx.fillRect(Math.floor(px - 22), y, 14, 1);
      ctx.fillRect(Math.floor(px + 8), y, 18, 1);
      ctx.fillRect(Math.floor(px - 8), y + 3, 16, 1);
    }

    // 碧蓝高亮水波
    ctx.fillStyle = "#5cdbd3";
    for (let i = 0; i < 6; i++) {
      const rx = 30 + (i * 35) + ((waveShift * 2) % 20);
      const ry = 135 + ((i * 5) % 15);
      ctx.fillRect(rx, ry, 6, 1);
    }
  }

  // 5. 白玉石岛与打坐仙台 (让角色下半身与底座坐在明亮石台上，彻底与水面分离)
  function drawStoneIsland(ctx, cx, cy, tick) {
    // 仙岛基石轮廓 (青灰白玉微光)
    const iw = 160;
    const ih = 44;

    // 石台外圈受光高亮顶面 (高明度白玉灰，强烈衬托深色道袍与黑描边！)
    ctx.fillStyle = "#263545"; // 侧边阴影深色
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, iw / 2, ih / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 顶面受光区 (明亮的青玉灰石砖)
    ctx.fillStyle = "#3e526a";
    ctx.beginPath();
    ctx.ellipse(cx, cy, (iw - 12) / 2, (ih - 10) / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 仙台中央聚光灵圈 (暖碧/月白高亮，正是让角色青莲底座“爆亮出圈”的根本！)
    ctx.fillStyle = "#69c0ff";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 54, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#b5f5ec";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 3, 44, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 纯白阵眼微光
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 台阶砖石接缝 (1px 深蓝像素刻线，带来扎实筑台质感)
    ctx.fillStyle = "#1a2533";
    ctx.fillRect(cx - 50, cy + 8, 100, 1);
    ctx.fillRect(cx - 30, cy + 14, 60, 1);
  }

  // 6. 仙门石灯 (左右立柱 + 温暖金光灯火，Mushreb 路灯同款)
  function drawLantern(ctx, x, y, tick, flameColor) {
    // 石灯柱身 (青灰石材质)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x - 3, y, 6, 24);
    ctx.fillRect(x - 5, y + 22, 10, 4); // 基座
    ctx.fillRect(x - 6, y - 4, 12, 4);  // 托盘

    // 灯室 (镂空透金光)
    ctx.fillStyle = "#334155";
    ctx.fillRect(x - 4, y - 14, 8, 10);

    // 石灯顶盖 (挑角飞檐)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x - 6, y - 16, 12, 3);
    ctx.fillRect(x - 3, y - 18, 6, 2);
    ctx.fillRect(x - 1, y - 20, 2, 2); // 宝顶

    // 核心灵火 (随时间微弱跳跃)
    const flicker = Math.sin(tick * 0.15) > 0 ? 0 : 1;
    ctx.fillStyle = flameColor;
    ctx.fillRect(x - 2, y - 12 + flicker, 4, 6 - flicker);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 1, y - 10 + flicker, 2, 3);

    // 暖金光晕辐射圈 (投射在附近水面和树叶上)
    const glowR = 26 + (Math.sin(tick * 0.08) * 3);
    const grad = ctx.createRadialGradient(x, y - 9, 2, x, y - 9, glowR);
    grad.addColorStop(0, "rgba(255, 214, 102, 0.45)");
    grad.addColorStop(0.5, "rgba(250, 173, 20, 0.18)");
    grad.addColorStop(1, "rgba(250, 173, 20, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 9, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Bayer 像素放射抖动神光
  function drawDitherRays(ctx, cx, cy, tick, life) {
    const progress = 1 - (life / 45);
    const maxR = 150 * progress;

    for (let r = 25; r < maxR; r += 6) {
      for (let deg = -80; deg <= 80; deg += 10) {
        const rad = (deg - 90) * (Math.PI / 180);
        const px = Math.floor(cx + Math.cos(rad) * r);
        const py = Math.floor(cy + Math.sin(rad) * r);

        if (px >= 0 && px < W && py >= 0 && py < H) {
          if ((px + py + Math.floor(tick / 2)) % 2 === 0) {
            ctx.fillStyle = deg % 20 === 0 ? "#fff566" : "#40a9ff";
            ctx.fillRect(px, py, 2, 2);
          }
        }
      }
    }
  }

  render();
};

/* 
  ==============================================================
  Mushreb 式【角色主面板·本命法身真像素灵境神台】
  (Character Page True-Pixel Realm Stage Engine)
  与修仙主页 100% 统一视觉语言：
  1. 浩瀚高明度皓月 (The Sacred Moon) 衬托白发与黑描边
  2. 左右引魂仙石灯 (Stone Lanterns) 投射温暖金光
  3. 白玉仙台阶基座 (White Jade Altar Pedestal) 支撑青莲法座
  4. 极光碧波微澜 (Aurora Lake) 打破暗部吞噬
  5. 飞掠仙鹤剪影与漫天灵尘萤火
  ==============================================================
*/
window.initCharPixelStage = function() {
  const canvas = document.getElementById("char-pixel-stage-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const W = 180;
  const H = 280;
  canvas.width = W;
  canvas.height = H;

  let frameTick = 0;
  let burstLife = 0;

  window.triggerCharPixelDitherBurst = function() {
    burstLife = 35;
  };

  // 灵境萤火灵尘
  const motes = [];
  for (let i = 0; i < 24; i++) {
    motes.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.2 - Math.random() * 0.35,
      size: Math.random() > 0.7 ? 2 : 1,
      color: Math.random() > 0.5 ? "#5cdbd3" : (Math.random() > 0.4 ? "#ffd666" : "#b7eb8f"),
      phase: Math.random() * Math.PI * 2
    });
  }

  // 点击法身舞台交互
  const stageBox = document.getElementById("char-portrait-frame");
  if (stageBox) {
    stageBox.addEventListener("click", () => {
      window.triggerCharPixelDitherBurst();

      const sprite = document.getElementById("char-pixel-avatar-sprite");
      if (sprite) {
        sprite.classList.add("pulse-hit");
        const frames = [1, 2, 3, 4, 5, 6, 7];
        let step = 0;
        const runStep = () => {
          if (step < frames.length) {
            sprite.className = `char-pixel-avatar-sprite frame-${frames[step]}`;
            step++;
            setTimeout(runStep, 75);
          } else {
            sprite.className = "char-pixel-avatar-sprite frame-0";
            sprite.classList.remove("pulse-hit");
          }
        };
        runStep();
      }

      // 飘动道心箴言
      const quotes = ["✦ 道法自然", "☯ 神游太虚", "✦ 剑气通玄", "☯ 天人合一", "✦ 虚室生白"];
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      const floater = document.createElement("div");
      floater.className = "float-text";
      floater.style.left = "50%";
      floater.style.top = "40%";
      floater.style.transform = "translate(-50%, 0)";
      floater.style.color = "#ffd700";
      floater.style.fontSize = "13px";
      floater.style.textShadow = "0 1px 4px rgba(0,0,0,0.8)";
      floater.innerText = q;
      stageBox.appendChild(floater);
      setTimeout(() => floater.remove(), 900);
    });
  }

  function render() {
    frameTick++;

    // 1. 清幽夜空渐变
    drawCharNightSky(ctx, W, H);

    // 2. 关键背光：角色上半身背后的【浩瀚皎洁仙月】(完全托出白发与黑描边)
    drawCharSacredMoon(ctx, W / 2, 108, frameTick);

    // 3. 远方仙山剪影与横渡灵鹤
    drawCharMountains(ctx, W, H, frameTick);

    // 4. 极光碧波灵池与垂落月影
    drawCharAuroraLake(ctx, W, H, frameTick);

    // 5. 白玉仙台与青石阶基座 (让莲座稳居受光台面)
    drawCharStoneIsland(ctx, W / 2, 212, frameTick);

    // 6. 左右仙门引魂石灯 (投射温暖暖金灵火光晕)
    drawCharLanterns(ctx, W, frameTick);

    // 7. Bayer 像素放射神光
    if (burstLife > 0) {
      drawCharDitherRays(ctx, W / 2, 130, frameTick, burstLife);
      burstLife--;
    }

    // 8. 仙境灵尘萤火
    motes.forEach(m => {
      m.x += m.vx;
      m.y += m.vy;
      if (m.y < 10) { m.y = H - 15; m.x = Math.random() * W; }
      if (m.x < 0) m.x = W;
      if (m.x > W) m.x = 0;

      const alpha = (Math.sin(frameTick * 0.05 + m.phase) + 1) / 2;
      if (alpha > 0.2) {
        ctx.fillStyle = m.color;
        ctx.fillRect(Math.floor(m.x), Math.floor(m.y), m.size, m.size);
      }
    });

    requestAnimationFrame(render);
  }

  // 1. 夜空 (像素色阶)
  function drawCharNightSky(ctx, W, H) {
    const sky = [
      { y: 0, h: 35, c: "#050811" },
      { y: 35, h: 40, c: "#09101f" },
      { y: 75, h: 45, c: "#101b33" },
      { y: 120, h: 45, c: "#172949" }
    ];
    sky.forEach(s => {
      ctx.fillStyle = s.c;
      ctx.fillRect(0, s.y, W, s.h);
    });

    // 闪烁微星
    ctx.fillStyle = "#bae7ff";
    ctx.fillRect(25, 20, 1, 1);
    ctx.fillRect(150, 15, 1, 1);
    ctx.fillRect(35, 65, 2, 1);
    ctx.fillRect(145, 45, 1, 1);
    ctx.fillRect(75, 25, 1, 1);
  }

  // 2. 皓月当空 (超高明度，彻底拉开黑描边与背景的反差)
  function drawCharSacredMoon(ctx, cx, cy, tick) {
    const breathe = Math.sin(tick * 0.04) * 2;
    const rOuter = 52 + breathe;

    // 柔和外光晕
    ctx.fillStyle = "rgba(105, 192, 255, 0.16)";
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(145, 213, 255, 0.28)";
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter + 4, 0, Math.PI * 2);
    ctx.fill();

    // 月轮外环 (冰青浅蓝)
    ctx.fillStyle = "#91d5ff";
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.fill();

    // 亮白月轮
    ctx.fillStyle = "#e6f7ff";
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fill();

    // 月心皎洁高亮纯白
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill();

    // 仙宫桂影微弱像素暗纹
    ctx.fillStyle = "#d3eeff";
    ctx.fillRect(cx - 15, cy - 10, 8, 3);
    ctx.fillRect(cx - 8, cy - 6, 12, 4);
    ctx.fillRect(cx + 6, cy + 5, 7, 3);
  }

  // 3. 远方仙山与灵鹤
  function drawCharMountains(ctx, W, H, tick) {
    // 仙山 1 (左侧)
    ctx.fillStyle = "#15243c";
    ctx.beginPath();
    ctx.moveTo(0, 170);
    ctx.lineTo(35, 120);
    ctx.lineTo(75, 170);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#69c0ff";
    ctx.fillRect(34, 120, 3, 2);

    // 仙山 2 (右侧)
    ctx.fillStyle = "#1a2c48";
    ctx.beginPath();
    ctx.moveTo(110, 170);
    ctx.lineTo(150, 115);
    ctx.lineTo(180, 170);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#69c0ff";
    ctx.fillRect(149, 115, 3, 2);

    // 仙鹤横渡夜空剪影 (从右向左优雅飞掠)
    const craneX = W - ((Math.floor(tick * 0.45)) % (W + 50));
    const craneY = 42 + Math.sin(tick * 0.08) * 3;
    if (craneX > -10 && craneX < W + 10) {
      ctx.fillStyle = "#ffffff";
      // 鹤身与翅膀 (极小像素点阵)
      ctx.fillRect(craneX, craneY, 3, 1);
      ctx.fillRect(craneX - 2, craneY - 1, 2, 1);
      ctx.fillRect(craneX + 1, craneY - 2, 1, 3);
      ctx.fillStyle = "#ff4d4f"; // 丹顶微红
      ctx.fillRect(craneX + 3, craneY, 1, 1);
    }
  }

  // 4. 极光碧波灵池与月影垂落 (Mushreb 式发光水体)
  function drawCharAuroraLake(ctx, W, H, tick) {
    ctx.fillStyle = "#0c2836";
    ctx.fillRect(0, 168, W, H - 168);

    // 极光碧绿水色横带
    ctx.fillStyle = "#134e5e";
    ctx.fillRect(0, 174, W, 25);
    ctx.fillStyle = "#16687a";
    ctx.fillRect(10, 182, W - 20, 14);

    // 垂直月影反光波柱
    const mw = 46;
    const mx = (W - mw) / 2;
    ctx.fillStyle = "rgba(54, 207, 201, 0.35)";
    ctx.fillRect(mx, 170, mw, 65);

    // 粼粼波光
    ctx.fillStyle = "#87e8de";
    for (let y = 175; y < 225; y += 7) {
      const offset = Math.sin(tick * 0.06 + y) * 6;
      ctx.fillRect(Math.floor(W / 2 + offset - 14), y, 10, 1);
      ctx.fillRect(Math.floor(W / 2 + offset + 6), y, 12, 1);
    }
  }

  // 5. 白玉仙台阶基座 (高明度白玉灰，强烈托住深色法座与黑描边)
  function drawCharStoneIsland(ctx, cx, cy, tick) {
    const iw = 135;
    const ih = 38;

    // 石台暗面
    ctx.fillStyle = "#223142";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, iw / 2, ih / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 顶面受光区 (青玉石砖)
    ctx.fillStyle = "#384e68";
    ctx.beginPath();
    ctx.ellipse(cx, cy, (iw - 10) / 2, (ih - 8) / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 中央聚灵神光圈 (亮碧/白玉高光，使莲座彻底剥离)
    ctx.fillStyle = "#69c0ff";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 46, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#b5f5ec";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 3, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 台阶接缝刻线
    ctx.fillStyle = "#182330";
    ctx.fillRect(cx - 40, cy + 7, 80, 1);
    ctx.fillRect(cx - 24, cy + 12, 48, 1);
  }

  // 6. 左右仙门石灯 (暖金灵火)
  function drawCharLanterns(ctx, W, tick) {
    const drawSingleLantern = (x, y) => {
      // 柱身
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(x - 2, y, 5, 20);
      ctx.fillRect(x - 4, y + 18, 9, 3);
      ctx.fillRect(x - 5, y - 3, 11, 3);

      // 灯室
      ctx.fillStyle = "#334155";
      ctx.fillRect(x - 3, y - 11, 7, 8);

      // 飞檐顶
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(x - 5, y - 13, 11, 2);
      ctx.fillRect(x - 2, y - 15, 5, 2);

      // 灵火
      const flicker = Math.sin(tick * 0.16) > 0 ? 0 : 1;
      ctx.fillStyle = "#ffc53d";
      ctx.fillRect(x - 1, y - 9 + flicker, 3, 5 - flicker);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y - 8 + flicker, 1, 2);

      // 暖金光晕
      const glowR = 22 + (Math.sin(tick * 0.09) * 2);
      const grad = ctx.createRadialGradient(x, y - 7, 2, x, y - 7, glowR);
      grad.addColorStop(0, "rgba(255, 214, 102, 0.45)");
      grad.addColorStop(0.5, "rgba(250, 173, 20, 0.18)");
      grad.addColorStop(1, "rgba(250, 173, 20, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y - 7, glowR, 0, Math.PI * 2);
      ctx.fill();
    };

    drawSingleLantern(16, 175);
    drawSingleLantern(W - 16, 175);
  }

  // 7. Bayer 像素放射抖动神光
  function drawCharDitherRays(ctx, cx, cy, tick, life) {
    const progress = 1 - (life / 35);
    const maxR = 120 * progress;

    for (let r = 20; r < maxR; r += 5) {
      for (let deg = -80; deg <= 80; deg += 12) {
        const rad = (deg - 90) * (Math.PI / 180);
        const px = Math.floor(cx + Math.cos(rad) * r);
        const py = Math.floor(cy + Math.sin(rad) * r);

        if (px >= 0 && px < W && py >= 0 && py < H) {
          if ((px + py + Math.floor(tick / 2)) % 2 === 0) {
            ctx.fillStyle = deg % 24 === 0 ? "#fff566" : "#40a9ff";
            ctx.fillRect(px, py, 2, 2);
          }
        }
      }
    }
  }

  render();
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (window.initPixelRealmStage) window.initPixelRealmStage();
    if (window.initCharPixelStage) window.initCharPixelStage();
  }, 100);
});


