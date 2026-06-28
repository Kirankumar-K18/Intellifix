import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from .image_quality import check_image_quality
from tensorflow.keras.models import load_model

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "complaint_verifier.keras"
)

# Load the model once when Django starts
model = load_model(MODEL_PATH)


def verify_image(image_path):
    """
    Returns whether an uploaded image is relevant to a civic complaint.
    """
    # -----------------------------
    # Image Quality Validation
    # -----------------------------
    quality = check_image_quality(image_path)

    if not quality["valid"]:
        return {
            "prediction": None,
            "label": "invalid_image",
            "action": "reject",
            "reason": quality["reason"]
        }
    image = tf.keras.utils.load_img(
        image_path,
        target_size=(224, 224)
    )

    image = tf.keras.utils.img_to_array(image)

    image = np.expand_dims(image, axis=0)
    image = preprocess_input(image)
    prediction = float(model.predict(image, verbose=0)[0][0])

    if prediction >= 0.90:

        return {
            "prediction": round(prediction, 4),
            "label": "relevant",
            "action": "accept"
        }

    elif prediction <= 0.30:

        return {
            "prediction": round(prediction, 4),
            "label": "irrelevant",
            "action": "ai_verification_failed"
        }

    else:

        return {
            "prediction": round(prediction, 4),
            "label": "uncertain",
            "action": "manual_review"
        }   