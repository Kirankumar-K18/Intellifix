FROM python:3.11-slim

WORKDIR /app

# System deps for mysqlclient + Pillow
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

# Create dirs
RUN mkdir -p media/complaints media/avatars staticfiles ml/saved_models

EXPOSE 8000
