"""
生产级 96x96 标准真像素 8 帧动画精灵图全自动生成器
---------------------------------------------------
核心技术点：
1. 8 帧绝对全局锚点锁定（Fixed Anchor）：
   以人物莲花座底部中轴为全局对齐基准，第 6 帧带光环帧不缩水，人物躯干等大；
2. rembg U2-Net 深度去底 + post_process_mask；
3. OpenCV 1px 形态学椭圆核侵蚀（彻底削去 AI 深色底导致的 1px 暗色过渡黑边）；
4. 32 色经典像素色板规整（MEDIANCUT Quantization）；
5. 导出标准的 1x8 序列大图（Native: 768x96，并提供 Nearest-Neighbor 3x 放大版 2304x288 用于高清视网膜屏渲染）。
"""

import os
from PIL import Image
import numpy as np
import cv2
import rembg


def generate_true_96x96_spritesheet(
    src_sheet_path: str,
    output_dir: str
):
    os.makedirs(output_dir, exist_ok=True)
    sheet = Image.open(src_sheet_path).convert("RGBA")
    sw, sh = sheet.size
    cell_w = sw // 3
    cell_h = sh // 3

    print(f"[96x96 Pipeline] 原图尺寸: {sw}x{sh}, 单格尺寸: {cell_w}x{cell_h}")

    # 第一阶段：提取全部 8 帧并进行去底与形态学剥离黑边
    cleaned_cells = []
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))

    for idx in range(8):
        c = idx % 3
        r = idx // 3
        cell = sheet.crop((c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h))
        print(f"[{idx+1}/8] 正在处理第 {idx+1} 帧去底与去除黑边...")

        # 1. AI 语义去底
        nobg = rembg.remove(cell, post_process_mask=True)

        # 2. Alpha 二值化与边缘侵蚀去黑
        arr = np.array(nobg)
        alpha = arr[:, :, 3]
        mask = alpha >= 120
        alpha_clean = np.where(mask, 255, 0).astype(np.uint8)
        alpha_eroded = cv2.erode(alpha_clean, kernel, iterations=1)

        arr[:, :, 3] = alpha_eroded
        arr[alpha_eroded == 0, :3] = 0
        pure_cell = Image.fromarray(arr, mode="RGBA")
        cleaned_cells.append(pure_cell)

    # 第二阶段：以第 0 帧作为人物身体和莲花座的基准锚点（Global Anchor）
    # 第 0 帧有效区域：
    f0_bbox = cleaned_cells[0].getbbox()  # (left, top, right, bottom)
    f0_w = f0_bbox[2] - f0_bbox[0]
    f0_h = f0_bbox[3] - f0_bbox[1]
    
    # 设定 96x96 画布中，基准人物占用目标尺寸（如 84x84，四周留 6px 呼吸与光环空间）
    target_char_size = 80
    scale = target_char_size / max(f0_w, f0_h)
    
    # 基准莲座底部在 96 画布上的固定 y 坐标，以及中轴 x 坐标
    # 莲座底留 3px 边距
    fixed_base_y = 93
    fixed_center_x = 48
    
    f0_center_x = (f0_bbox[0] + f0_bbox[2]) / 2.0
    f0_bottom_y = f0_bbox[3]

    print(f"全局锁定缩放比: {scale:.4f}, 中轴对齐: ({fixed_center_x}, {fixed_base_y})")

    standard_96_frames = []

    for idx, c_img in enumerate(cleaned_cells):
        print(f"[{idx+1}/8] 映射至标准 96x96 绝对网格...")
        # 1. 统一按全局 scale 缩放整帧，保证所有动作/特效帧中的人物 100% 等大
        cur_w = int(c_img.width * scale)
        cur_h = int(c_img.height * scale)
        scaled_img = c_img.resize((cur_w, cur_h), Image.Resampling.BILINEAR)

        # 2. 将全局原点对齐至固定坐标
        paste_x = int(fixed_center_x - (f0_center_x * scale))
        paste_y = int(fixed_base_y - (f0_bottom_y * scale))

        # 3. 贴入标准 96x96 画布
        frame_96 = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        frame_96.paste(scaled_img, (paste_x, paste_y), mask=scaled_img)

        # 4. 二次硬性 Alpha 二值化（保证 0 半透明次像素噪点）
        arr_96 = np.array(frame_96)
        a_96 = arr_96[:, :, 3]
        m_96 = a_96 >= 128
        arr_96[:, :, 3] = np.where(m_96, 255, 0)
        arr_96[~m_96, :3] = 0
        clean_96 = Image.fromarray(arr_96, mode="RGBA")

        # 5. 32 色经典真像素色板量化
        r, g, b, a = clean_96.split()
        rgb = Image.merge("RGB", (r, g, b))
        q_rgb = rgb.quantize(colors=32, method=Image.Quantize.MEDIANCUT).convert("RGB")
        final_frame = Image.merge("RGBA", (*q_rgb.split(), a))

        # 保存单帧
        single_path = os.path.join(output_dir, f"frame_{idx}_96.png")
        final_frame.save(single_path, "PNG")
        standard_96_frames.append(final_frame)

    # 第三阶段：拼接为标准 1x8 序列大图 (Sprite Sheet)
    # 1. 原生 96 规格大图: 768 x 96
    native_sheet = Image.new("RGBA", (96 * 8, 96), (0, 0, 0, 0))
    for i, f in enumerate(standard_96_frames):
        native_sheet.paste(f, (i * 96, 0))
    
    native_sheet_path = os.path.join(output_dir, "meditation_sheet_96x96.png")
    native_sheet.save(native_sheet_path, "PNG")

    # 2. 无损 3x 放大版 (288 x 288 单格，总长 2304 x 288)，用于高分屏无缝适配
    hd_3x_sheet = native_sheet.resize((96 * 8 * 3, 96 * 3), Image.Resampling.NEAREST)
    hd_3x_sheet_path = os.path.join(output_dir, "meditation_sheet_96x96_3x.png")
    hd_3x_sheet.save(hd_3x_sheet_path, "PNG")

    print(f"\n[DONE] 96x96 纯真像素动画全套资产已输出:")
    print(f" -> 原生大图: {native_sheet_path} ({native_sheet.size})")
    print(f" -> 3x 高清大图: {hd_3x_sheet_path} ({hd_3x_sheet.size})")


if __name__ == "__main__":
    src = r"C:\Users\kami\.gemini\antigravity\brain\067e7c08-6455-4684-9322-ed102a0b15e0\anime_girl_meditating_sprite_sheet_1791693652207.jpg"
    out = r"D:\projects\xiuxian-game\textures\true_pixel_96"
    generate_true_96x96_spritesheet(src, out)
