"""
专门针对 AI 生成的多帧精灵图（Sprite Sheet）全自动真像素切割与透明化处理工作流：
1. 切割 3x3 九宫格各子图帧
2. 每帧独立执行 rembg 深度学习去底
3. 消除次像素抗锯齿与色阶量化（Alpha 纯净二值化 + Palette 约束）
4. 合并导出 1xN 规范水平精灵大图 (Sprite Sheet PNG)
"""

import os
import sys
from PIL import Image
import numpy as np
import rembg


def process_spritesheet_to_true_pixel(
    sheet_path: str,
    output_dir: str,
    output_sheet_name: str = "meditation_spritesheet_clean.png",
    rows: int = 3,
    cols: int = 3,
    valid_frames_count: int = 8,
    target_frame_size: int = 128,
    upscale_factor: int = 2
):
    os.makedirs(output_dir, exist_ok=True)
    sheet = Image.open(sheet_path).convert("RGBA")
    sw, sh = sheet.size
    cell_w = sw // cols
    cell_h = sh // rows

    print(f"原图尺寸: {sw}x{sh}, 宫格: {cols}列 x {rows}行, 单格尺寸: {cell_w}x{cell_h}")

    processed_frames = []

    for idx in range(valid_frames_count):
        r = idx // cols
        c = idx % cols
        box = (c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)
        cell_img = sheet.crop(box)

        print(f"正在处理第 {idx + 1}/{valid_frames_count} 帧...")

        # 1. rembg 深度去底
        nobg_cell = rembg.remove(cell_img)

        # 2. 找到人物有效边界紧凑裁剪（Trim）
        bbox = nobg_cell.getbbox()
        if bbox:
            cropped = nobg_cell.crop(bbox)
        else:
            cropped = nobg_cell

        # 3. 规范化到统一的标准大小画布（例如 100x110 居中底部对齐）
        cw, ch = cropped.size
        # 保持比例缩放，使得最大边 fit 进 100
        scale = min(100 / cw, 105 / ch)
        nw, nh = int(cw * scale), int(ch * scale)
        resized_char = cropped.resize((nw, nh), Image.Resampling.BILINEAR)

        # 4. Alpha 二值化（彻底干掉半透明黑色杂边）
        arr = np.array(resized_char)
        alpha = arr[:, :, 3]
        mask = alpha >= 110
        arr[:, :, 3] = np.where(mask, 255, 0)
        arr[~mask, :3] = 0
        pure_char = Image.fromarray(arr, mode="RGBA")

        # 5. 色板约束（量化为 32 色真像素）
        r_c, g_c, b_c, a_c = pure_char.split()
        rgb = Image.merge("RGB", (r_c, g_c, b_c))
        q_rgb = rgb.quantize(colors=32, method=Image.Quantize.MEDIANCUT).convert("RGB")
        pixel_char = Image.merge("RGBA", (*q_rgb.split(), a_c))

        # 6. 贴合到标准的正方形画布 (target_frame_size) 底部对齐
        frame_canvas = Image.new("RGBA", (target_frame_size, target_frame_size), (0, 0, 0, 0))
        paste_x = (target_frame_size - nw) // 2
        paste_y = target_frame_size - nh - 10
        frame_canvas.paste(pixel_char, (paste_x, paste_y), mask=pixel_char)

        # 保存单帧透明 PNG
        frame_file = os.path.join(output_dir, f"frame_{idx}.png")
        frame_canvas.save(frame_file, "PNG")
        processed_frames.append(frame_canvas)

    # 7. 合并为标准 1 x N 序列大图
    total_w = target_frame_size * valid_frames_count
    total_h = target_frame_size
    strip_sheet = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))

    for idx, f_img in enumerate(processed_frames):
        strip_sheet.paste(f_img, (idx * target_frame_size, 0))

    # 按需无损放大
    if upscale_factor > 1:
        strip_sheet = strip_sheet.resize(
            (total_w * upscale_factor, total_h * upscale_factor),
            Image.Resampling.NEAREST
        )

    out_sheet_path = os.path.join(output_dir, output_sheet_name)
    strip_sheet.save(out_sheet_path, "PNG")
    print(f"\n[DONE] 成功生成真像素透明序列图: {out_sheet_path}")
    print(f"单帧尺寸: {target_frame_size * upscale_factor}x{target_frame_size * upscale_factor}, 序列图总尺寸: {strip_sheet.size}")


if __name__ == "__main__":
    src = r"C:\Users\kami\.gemini\antigravity\brain\067e7c08-6455-4684-9322-ed102a0b15e0\anime_girl_meditating_sprite_sheet_1791693652207.jpg"
    out_dir = r"D:\projects\xiuxian-game\textures\true_pixel_meditation_frames"
    process_spritesheet_to_true_pixel(src, out_dir, rows=3, cols=3, valid_frames_count=8)
