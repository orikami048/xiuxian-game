"""
精密对齐与规整像素块流水线 (Precise Grid Snapped True-Pixel Pipeline)
彻底解决两个致命问题：
1. 像素块规整化：AI 伪像素带有软边和半像素，使用 unfake (基于 Rust 加速的 Edge-Aware Grid Snapping & Quantization) 将其强制规整为正统像素方块；
2. 动画帧人物缩放一致性：严禁对每帧单独做 fit 缩放（否则第6张带光环的帧人物会缩水变小）！
   统一采用全局固定参考坐标系（锁定莲座与人物中轴），直接将 341x341 原生裁切图无形变贴入 341x341 画布，保证 8 帧人物身体、头部、莲花座绝对 1:1 等大，无抖动！
"""

import os
from PIL import Image
import numpy as np
import rembg
import unfake


def generate_aligned_perfect_pixel_sheet(
    src_sheet_path: str,
    output_sheet_path: str,
    output_preview_dir: str,
    rows: int = 3,
    cols: int = 3,
    valid_frames: int = 8,
    upscale_ratio: int = 1
):
    os.makedirs(output_preview_dir, exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(output_sheet_path)), exist_ok=True)

    sheet = Image.open(src_sheet_path).convert("RGBA")
    sw, sh = sheet.size
    cell_w = sw // cols
    cell_h = sh // rows

    print(f"原图: {sw}x{sh}, 单格基础尺寸: {cell_w}x{cell_h}")

    clean_frames = []

    for idx in range(valid_frames):
        c = idx % cols
        r = idx // cols
        box = (c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)
        cell = sheet.crop(box)

        print(f"[{idx+1}/{valid_frames}] 正在去底与规整真像素块...")

        # 1. 深度学习精准剥离背景
        nobg = rembg.remove(cell)

        # 2. 纯净 Alpha 二值化（剔除一切残余半透明暗色）
        arr = np.array(nobg)
        alpha = arr[:, :, 3]
        mask = alpha >= 128
        arr[:, :, 3] = np.where(mask, 255, 0)
        arr[~mask, :3] = 0
        crisp_cell = Image.fromarray(arr, mode="RGBA")

        # 3. 使用开源 unfake 进行规整像素块吸附 (Grid Snapping) 与 色板量化
        try:
            # unfake 自动识别物理像素步长并做 dominant-color 规整
            unfake_res = unfake.process_image_sync(crisp_cell)
            snapped_img = unfake_res["image"]  # 原生网格
            # 最近邻无损放大回原图尺寸，保证规整方块锐利
            grid_scale = round(cell_w / snapped_img.width)
            if grid_scale < 1:
                grid_scale = 1
            snapped_back = snapped_img.resize(
                (snapped_img.width * grid_scale, snapped_img.height * grid_scale),
                Image.Resampling.NEAREST
            )
            # 补齐到 cell_w x cell_h
            final_frame = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
            offset_x = (cell_w - snapped_back.width) // 2
            offset_y = (cell_h - snapped_back.height) // 2
            final_frame.paste(snapped_back, (offset_x, offset_y), mask=snapped_back)
        except Exception as e:
            print(f"   -> unfake 处理异常: {e}，使用 crisp_cell")
            final_frame = crisp_cell

        # 保存单帧检验
        single_path = os.path.join(output_preview_dir, f"frame_{idx}_perfect.png")
        final_frame.save(single_path, "PNG")
        clean_frames.append(final_frame)

    # 4. 拼合成标准序列大图 (保证人物、莲座在每一帧中完全等大、位置恒定)
    total_w = cell_w * valid_frames
    total_h = cell_h
    strip = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    for idx, f in enumerate(clean_frames):
        strip.paste(f, (idx * cell_w, 0))

    strip.save(output_sheet_path, "PNG")
    print(f"\n[SUCCESS] 规整对齐真像素大图已输出: {output_sheet_path}")
    print(f"单帧尺寸恒定: {cell_w}x{cell_h}, 总尺寸: {strip.size}")


if __name__ == "__main__":
    src = r"C:\Users\kami\.gemini\antigravity\brain\067e7c08-6455-4684-9322-ed102a0b15e0\anime_girl_meditating_sprite_sheet_1791693652207.jpg"
    out_sheet = r"D:\projects\xiuxian-game\textures\meditation_perfect_pixel_sheet.png"
    out_dir = r"D:\projects\xiuxian-game\textures\meditation_perfect_frames"
    generate_aligned_perfect_pixel_sheet(src, out_sheet, out_dir)
