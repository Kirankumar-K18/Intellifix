from apps.complaints.ai.image_quality import check_image_quality

image_path = r"C:\Users\kk777\Downloads\edupulse_logo.png"

result = check_image_quality(image_path)

print(result)