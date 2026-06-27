import os
from PIL import Image

DATASET = "dataset"

bad_files = []

for root, dirs, files in os.walk(DATASET):
    for file in files:
        path = os.path.join(root, file)

        try:
            with Image.open(path) as img:
                img.verify()
        except Exception:
            bad_files.append(path)

print("=" * 60)
print(f"Bad Files Found: {len(bad_files)}")
print("=" * 60)

for file in bad_files:
    print(file)