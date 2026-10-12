from PIL import Image
import os

src_path = r"D:\projects\xiuxian-game\textures\blacksmith_girl.png"
web_dir = r"D:\projects\xiuxian-game\textures\blacksmith_girl_parts"
coco_dir = r"D:\xiuxian\assets\textures\blacksmith_girl_parts"
os.makedirs(web_dir, exist_ok=True)
os.makedirs(coco_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
W, H = img.size

# 1. 提取发光神锤与右小臂 (Hammer & Striking Right Arm)
# 对应原始图左上角举起的锤头和手套部位: x: 230..450, y: 90..370
hammer_crop = img.crop((230, 85, 455, 375))

# 2. 提取银发高马尾发梢 (Ponytail Sway)
# 对应马尾右侧飘散发尾: x: 570..890, y: 100..430
ponytail_crop = img.crop((570, 100, 890, 430))

# 3. 提取铁砧与炽热剑胚 (Anvil & Hot Ingot Core)
# x: 100..630, y: 640..960
anvil_crop = img.crop((100, 640, 630, 960))

# 保存切片
parts = {
    "hammer_arm.png": hammer_crop,
    "ponytail.png": ponytail_crop,
    "anvil_ingot.png": anvil_crop,
    "full_body.png": img
}

for name, part in parts.items():
    part.save(os.path.join(web_dir, name), "PNG")
    part.save(os.path.join(coco_dir, name), "PNG")
    print(f"Saved {name}: {part.size}")
