import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import GlobalAveragePooling2D
from tensorflow.keras.layers import Dense
from tensorflow.keras.layers import Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.callbacks import ModelCheckpoint
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ReduceLROnPlateau

IMAGE_SIZE = (224,224)
BATCH_SIZE = 32

AUTOTUNE = tf.data.AUTOTUNE

TRAIN_DIR = "dataset/train"
VAL_DIR   = "dataset/validation"
TEST_DIR  = "dataset/test"

from tensorflow.keras.utils import image_dataset_from_directory

train_ds = image_dataset_from_directory(
    "dataset/train",
    image_size=(224, 224),
    batch_size=32,
    label_mode="binary",
    shuffle=True
)

val_ds = image_dataset_from_directory(
    "dataset/validation",
    image_size=(224, 224),
    batch_size=32,
    label_mode="binary",
    shuffle=False
)

test_ds = image_dataset_from_directory(
    "dataset/test",
    image_size=(224, 224),
    batch_size=32,
    label_mode="binary",
    shuffle=False
)
AUTOTUNE = tf.data.AUTOTUNE
class_names = train_ds.class_names

print("Class Names:", class_names)
train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
val_ds = val_ds.prefetch(tf.data.AUTOTUNE)
test_ds = test_ds.prefetch(tf.data.AUTOTUNE)
from tensorflow.keras import Sequential
from tensorflow.keras.layers import RandomFlip
from tensorflow.keras.layers import RandomRotation
from tensorflow.keras.layers import RandomZoom
from tensorflow.keras.layers import RandomContrast

data_augmentation = Sequential([
    RandomFlip("horizontal"),
    RandomRotation(0.1),
    RandomZoom(0.1),
    RandomContrast(0.1)
])
print("\nBuilding MobileNetV2 Model...")

base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(224, 224, 3)
)

base_model.trainable = False

inputs = tf.keras.Input(shape=(224,224,3))

x = data_augmentation(inputs)

x = preprocess_input(x)

x = base_model(x, training=False)

x = GlobalAveragePooling2D()(x)

x = Dropout(0.3)(x)

x = Dense(128, activation="relu")(x)

outputs = Dense(1, activation="sigmoid")(x)

model = Model(inputs, outputs)

model.compile(
    optimizer=Adam(1e-4),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

model.summary()

early_stop = EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True
)

checkpoint = ModelCheckpoint(
    "models/complaint_verifier.keras",
    monitor="val_loss",
    save_best_only=True
)
reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.2,
    patience=2,
    verbose=1,
    min_lr=1e-6
)

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=20,
    callbacks=[
        early_stop,
        checkpoint,
        reduce_lr
    ]
)
print("\nStarting Fine-Tuning...")
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False
model.compile(
    optimizer=Adam(1e-5),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)
fine_early_stop = EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True
)
history_fine = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=5,
    callbacks=[
        fine_early_stop,
        checkpoint,
        reduce_lr
    ]
)

model.save("models/complaint_verifier_final.keras")

loss, accuracy = model.evaluate(test_ds)

print(f"\nTest Accuracy : {accuracy:.4f}")
print(f"Test Loss     : {loss:.4f}")