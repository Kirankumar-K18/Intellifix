import cv2
import numpy as np


def check_image_quality(image_path):
    """
    Returns:
    {
        "valid": True/False,
        "reason": "...",
        "brightness": value,
        "blur": value
    }
    """

    image = cv2.imread(image_path)

    if image is None:
        return {
            "valid": False,
            "reason": "Invalid image file."
        }

    height, width = image.shape[:2]

    # Reject very small images
    if width < 100 or height < 100:
        return {
            "valid": False,
            "reason": "Image resolution is too low."
        }

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # -------------------------
    # Brightness
    # -------------------------
    brightness = np.mean(gray)

    if brightness < 25:
        return {
            "valid": False,
            "reason": "Image is too dark.",
            "brightness": round(brightness, 2)
        }

    # -------------------------
    # Blur Detection
    # -------------------------
    blur = cv2.Laplacian(gray, cv2.CV_64F).var()

    if blur < 50:
        return {
            "valid": False,
            "reason": "Image is too blurry.",
            "blur": round(blur, 2)
        }

    return {
        "valid": True,
        "reason": "Image quality is acceptable.",
        "brightness": round(brightness, 2),
        "blur": round(blur, 2)
    }