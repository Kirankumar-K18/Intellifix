import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.utils import image_dataset_from_directory

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32

test_ds = image_dataset_from_directory(
    "dataset/test",
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="binary",
    shuffle=False
)

model = load_model("models/complaint_verifier.keras")

print("✅ Model loaded successfully!")

loss, accuracy = model.evaluate(test_ds)

print(f"\nTest Accuracy : {accuracy:.4f}")
print(f"Test Loss     : {loss:.4f}")