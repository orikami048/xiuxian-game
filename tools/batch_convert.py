"""
修仙像素工坊 · 批量自动化处理工具
一键将指定目录下的所有 AI 伪像素图片转化为标准的透明真像素资产 PNG。
"""

import os
import glob
from true_pixel_pipeline import process_image_to_true_pixel


def batch_convert(input_dir, output_dir, scale=4, colors=32):
    os.makedirs(output_dir, exist_ok=True)
    extensions = ["*.png", "*.jpg", "*.jpeg", "*.webp"]
    files = []
    for ext in extensions:
        files.extend(glob.glob(os.path.join(input_dir, ext)))
        
    print(f"找到 {len(files)} 个待处理图像文件...")
    for idx, f in enumerate(files, 1):
        filename = os.path.splitext(os.path.basename(f))[0] + ".png"
        out_path = os.path.join(output_dir, filename)
        print(f"\n[{idx}/{len(files)}] 批量转换: {f} -> {out_path}")
        try:
            process_image_to_true_pixel(
                input_path=f,
                output_path=out_path,
                upscale_factor=scale,
                color_palette_limit=colors
            )
        except Exception as e:
            print(f"处理失败 {f}: {e}")

    print("\n所有批量转换任务已完成！")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="批量 AI 伪像素转真像素资产")
    parser.add_argument("--input-dir", "-i", required=True, help="输入图片目录")
    parser.add_argument("--output-dir", "-o", required=True, help="输出目标目录")
    parser.add_argument("--scale", "-s", type=int, default=4, help="最近邻放大倍数 (默认 4)")
    parser.add_argument("--colors", "-c", type=int, default=32, help="量化颜色数 (默认 32)")
    args = parser.parse_args()
    
    batch_convert(args.input_dir, args.output_dir, scale=args.scale, colors=args.colors)
