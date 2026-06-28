from apps.complaints.ai.image_classifier import verify_image

# Change this path to your image
image_path = r"C:\Users\kk777\Downloads\edupulse_logo.png"

result = verify_image(image_path)

print(result)