"""
=============================================================================
修仙像素工坊 · AI 伪像素转真像素全自动资产工作流 (True Pixel Art Pipeline)
=============================================================================
功能全流程：
1. 智能语义去底 (基于 rembg / U2-Net 深度学习，告别粗糙色差抠图与黑边杂毛)
2. 真实像素网格吸附与消除抗锯齿 (采用 proper-pixel-art / mesh 算法)
3. Alpha 阈值二值化 (清理所有次像素半透明羽化杂边)
4. 色板自适应量化 (限制 16/32/64 色，彻底去除 AI 渐变噪点)
5. 最近邻无损放大 (导出引擎就绪的标准真像素资产 PNG)
=============================================================================
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image
import numpy as np
import rembg
from proper_pixel_art import pixelate, PixelateConfig


def process_image_to_true_pixel(
    input_path: str,
    output_path: str,
    target_pixel_size: int = 64,
    upscale_factor: int = 4,
    remove_background: bool = True,
    alpha_threshold: int = 120,
    color_palette_limit: int = 32
):
    print(f"\n========================================================")
    print(f"[流水线启动] 正在处理: {input_path}")
    print(f"========================================================")
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"找不到输入文件: {input_path}")

    raw_img = Image.open(input_path).convert("RGBA")
    w, h = raw_img.size
    print(f"[1/5 读取图像] 原始尺寸: {w}x{h}")

    # 第一步：rembg 深度学习智能去底 (如有需要)
    if remove_background:
        print("[2/5 智能去底] 正在执行 rembg U2-Net 语义剥离...")
        clean_bg_img = rembg.remove(raw_img)
    else:
        print("[2/5 智能去底] 跳过去底，保持原图通道...")
        clean_bg_img = raw_img

    # 第二步：proper-pixel-art 算法网格识别与真像素重构
    print(f"[3/5 像素化重构] 正在执行 proper-pixel-art 算法网格重对齐...")
    try:
        config = PixelateConfig(
            transparent_background=True,
            scale_result=1  # 保持 1:1 原生网格
        )
        result = pixelate(clean_bg_img, config=config)
        pixel_img = result.image
        print(f"   -> 自动检测完成，识别原生像素尺寸: {pixel_img.size}")
    except Exception as e:
        print(f"   -> proper-pixel-art 自适应失败 ({e})，启用备用智能下采样网格重构...")
        # 备用方案：高质量 downscale 到目标网格
        aspect = h / w
        target_w = target_pixel_size
        target_h = int(target_pixel_size * aspect)
        pixel_img = clean_bg_img.resize((target_w, target_h), Image.Resampling.BILINEAR)

    # 第三步：Alpha 二值化与黑边杂毛净化
    print(f"[4/5 边缘净化] 执行 Alpha 二值化 (阈值: {alpha_threshold}) 与色板约束...")
    pixel_img = pixel_img.convert("RGBA")
    np_arr = np.array(pixel_img)
    
    alpha = np_arr[:, :, 3]
    # 清理低于阈值的半透明噪点，将高于阈值的设为纯不透明，根除半透明黑轮廓
    mask = alpha >= alpha_threshold
    np_arr[:, :, 3] = np.where(mask, 255, 0)
    
    # 对纯透明区域的 RGB 归零，防止压缩时溢出暗色边缘
    np_arr[~mask, 0] = 0
    np_arr[~mask, 1] = 0
    np_arr[~mask, 2] = 0
    
    cleaned_img = Image.fromarray(np_arr, mode="RGBA")

    # 第四步：自适应色板量化 (约束色调数，呈现正统像素质感)
    if color_palette_limit > 0:
        r, g, b, a = cleaned_img.split()
        rgb = Image.merge("RGB", (r, g, b))
        quantized_rgb = rgb.quantize(colors=color_palette_limit, method=Image.Quantize.MEDIANCUT).convert("RGB")
        cleaned_img = Image.merge("RGBA", (*quantized_rgb.split(), a))

    # 第五步：最近邻插值放大为游戏就绪尺寸
    print(f"[5/5 资产输出] 以 Nearest-Neighbor 最近邻插值放大 {upscale_factor}x...")
    cur_w, cur_h = cleaned_img.size
    final_output = cleaned_img.resize(
        (cur_w * upscale_factor, cur_h * upscale_factor),
        Image.Resampling.NEAREST
    )

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    final_output.save(output_path, "PNG")
    print(f"[SUCCESS] 纯净真像素资产已生成: {output_path} (尺寸: {final_output.size[0]}x{final_output.size[1]})")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="AI 伪像素转真像素资产全自动流水线")
    parser.add_argument("--input", "-i", required=True, help="输入图片路径")
    parser.add_argument("--output", "-o", required=True, help="输出真像素 PNG 路径")
    parser.add_argument("--size", "-s", type=int, default=64, help="目标原生像素基准大小 (默认 64)")
    parser.add_argument("--scale", type=int, default=4, help="最终导出最近邻放大倍数 (默认 4)")
    parser.add_argument("--no-rembg", action="store_true", help="不执行背景剥离")
    parser.add_argument("--colors", "-c", type=int, default=32, help="色板量化数量 (默认 32 色)")
    
    args = parser.parse_args()
    process_image_to_true_pixel(
        input_path=args.input,
        output_path=args.output,
        target_pixel_size=args.size,
        upscale_factor=args.scale,
        remove_background=not args.no_rembg,
        color_palette_limit=args.colors
    )


if __name__ == "__main__":
    main()
