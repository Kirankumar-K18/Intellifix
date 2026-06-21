# 🔧 IntelliFix — Intelligent Complaint Management & Resolution System

> AI-powered civic complaint management with ML department classification, priority prediction, live camera capture, and role-based dashboards.

---

## 🏗️ Tech Stack

| Layer       | Technology                                           |
|-------------|------------------------------------------------------|
| Frontend    | React 18 + Vite + React Router v6 + Recharts         |
| Backend     | Django 4.2 + Django REST Framework                   |
| Database    | **MySQL 8.0**                                        |
| Auth        | JWT (djangorestframework-simplejwt)                  |
| ML Model 1  | TF-IDF + Logistic Regression (Department Classifier) |
| ML Model 2  | Random Forest (Priority Predictor)                   |
| Deployment  | Docker + Docker Compose + Nginx                      |

---

## 📁 Project Structure

```
INTELLIFIX/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── intellifix_project/
│   │   ├── settings.py          ← MySQL + JWT + CORS config
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/               ← Custom User model (citizen/department/admin)
│   │   ├── complaints/          ← Complaint + Feedback + Timeline
│   │   ├── departments/         ← Department model + stats
│   │   ├── analytics/           ← Role-scoped analytics API
│   │   ├── notifications/       ← In-app + email notifications
│   │   └── chatbot/             ← ML department suggestion + priority prediction
│   ├── ml/
│   │   ├── train.py             ← Train both ML models (run once)
│   │   ├── predictor.py         ← Inference: department + priority
│   │   └── saved_models/        ← .pkl files (created after training)
│   └── media/                   ← Uploaded complaint images
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              ← Router + Auth guard
│   │   ├── main.jsx             ← Entry point
│   │   ├── index.css            ← Global styles
│   │   ├── components/
│   │   │   └── common/UI.jsx    ← Shared UI: Layout, Table, Modal, Badge, etc.
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── user/            ← Dashboard, Submit, My Complaints, Detail
│   │   │   ├── department/      ← Dashboard, Complaints, Detail, Analytics
│   │   │   └── admin/           ← Dashboard, Users, Departments, Complaints, Analytics
│   │   ├── services/api.js      ← Axios client with JWT auto-refresh
│   │   └── context/AuthContext.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Option A — Docker (Recommended, zero setup)

```bash
# 1. Clone the project
git clone <repo-url>
cd INTELLIFIX

# 2. Start everything (MySQL + Django + React + Nginx)
docker compose up --build

# 3. Open browser
#    Frontend:  http://localhost:3000
#    API:       http://localhost:8000/api
#    Django Admin: http://localhost:8000/admin
```

Docker automatically:
- Starts MySQL and waits until healthy
- Runs migrations
- Seeds departments and demo users
- Trains ML models
- Builds and serves the React app via Nginx

---

### Option B — Manual Local Setup

#### Prerequisites
- Python 3.11+
- Node.js 20+
- MySQL 8.0 running locally

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create MySQL database
mysql -u root -p
> CREATE DATABASE intellifix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> CREATE USER 'intellifix_user'@'localhost' IDENTIFIED BY 'intellifix_pass';
> GRANT ALL PRIVILEGES ON intellifix_db.* TO 'intellifix_user'@'localhost';
> FLUSH PRIVILEGES;
> EXIT;

# Set environment variables (or create .env file)
export DB_NAME=intellifix_db
export DB_USER=intellifix_user
export DB_PASSWORD=intellifix_pass
export DB_HOST=localhost

# Run migrations
python manage.py migrate

# Seed initial data
python manage.py seed_data

# Train ML models
python ml/train.py

# Start development server
python manage.py runserver
```

#### Frontend

```bash
cd frontend
npm install
npm run dev          # Starts on http://localhost:3000
```

---

## 🔑 Test Credentials

| Role              | Email                     | Password       |
|-------------------|---------------------------|----------------|
| Admin             | admin@intellifix.com      | Admin@1234     |
| Department Official | ramesh@intellifix.com   | Official@1234  |
| Citizen           | ravi@example.com          | User@1234      |

---

## 🤖 ML Models

### Model 1 — Department Classifier

- **Algorithm:** TF-IDF Vectorizer + Logistic Regression
- **Training data:** 100 labeled complaint samples across 9 departments
- **Endpoint:** `POST /api/chatbot/suggest/`
- **Input:** `{ "description": "There is a pothole on MG Road..." }`
- **Output:** Top-3 department suggestions with confidence scores

### Model 2 — Priority Predictor

- **Algorithm:** Random Forest Classifier (150 trees)
- **Training data:** 3000 synthetic samples
- **Input features:**
  - `severity` (1–5)
  - `population_affected` (integer)
  - `frequency` (count of similar complaints)
  - `has_image` (boolean)
- **Priority formula:**
  - 40% Severity (keyword boost + user rating)
  - 30% Population Impact (log-scale)
  - 20% Complaint Frequency
  - 10% Image Verification
- **Output:** `low` | `medium` | `high` | `critical`
- **Endpoint:** `POST /api/chatbot/predict-priority/`

---

## 📡 API Reference

### Auth
```
POST /api/auth/login/            → { access, refresh, user }
POST /api/auth/register/         → Register citizen
GET  /api/auth/profile/          → Current user profile
PATCH /api/auth/profile/         → Update profile
GET  /api/auth/users/            → List all users (admin)
POST /api/auth/logout/           → Blacklist refresh token
```

### Complaints
```
GET    /api/complaints/                → List (role-filtered, sorted by priority_score)
POST   /api/complaints/               → Submit complaint (multipart/form-data)
GET    /api/complaints/mine/           → Citizen's own complaints
GET    /api/complaints/{id}/           → Complaint detail
PATCH  /api/complaints/{id}/           → Update status (department/admin)
GET    /api/complaints/feedback/       → List feedback
POST   /api/complaints/feedback/add/   → Submit rating (resolved only)
```

### Analytics
```
GET /api/analytics/                → Role-scoped overview stats
GET /api/analytics/department/     → Department-specific analytics
```

### Chatbot / ML
```
POST /api/chatbot/suggest/         → Department suggestion from description
POST /api/chatbot/predict-priority/ → Priority prediction
```

### Notifications
```
GET  /api/notifications/           → All user notifications
GET  /api/notifications/unread-count/
POST /api/notifications/mark-all-read/
POST /api/notifications/{id}/read/
```

---

## 👥 Role Permissions

| Feature                    | Citizen | Department | Admin |
|----------------------------|:-------:|:----------:|:-----:|
| Submit complaint            | ✅      | ❌         | ❌    |
| View own complaints         | ✅      | ❌         | ✅    |
| View dept complaints        | ❌      | ✅         | ✅    |
| Update complaint status     | ❌      | ✅         | ✅    |
| Rate resolved complaint     | ✅      | ❌         | ❌    |
| View dept analytics         | ❌      | ✅         | ✅    |
| View all analytics          | ❌      | ❌         | ✅    |
| Manage users                | ❌      | ❌         | ✅    |
| Manage departments          | ❌      | ❌         | ✅    |
| Use AI chatbot              | ✅      | ✅         | ✅    |

---

## 📸 Live Camera Capture

- Opens device camera via `MediaDevices.getUserMedia()`
- **Camera always mounted** (CSS visibility, not conditional rendering — fixes capture bug)
- Stable `useRef()` hooks ensure video/canvas refs never become null
- Draws timestamp watermark on captured frame
- Fetches GPS via `Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })`
- Saves file as `username_YYYYMMDD_HHmmss.jpg` (e.g. `ravi_20260610_143522.jpg`)
- Stores `latitude`, `longitude`, `photo_timestamp` in Complaint model
- Shows GPS coordinates with Google Maps link in complaint detail

---

## 🗄️ Database Schema (MySQL)

```sql
-- Core tables
users           (id, email, name, phone, role, department_id, avatar, is_active)
departments     (id, name, description, email, phone, icon, is_active)
complaints      (id, title, description, location, address, image,
                 severity, population_affected, priority, priority_score,
                 ai_department_suggestion, status, user_id, department_id,
                 assigned_to_id, latitude, longitude, photo_timestamp,
                 photo_captured, created_at, updated_at, resolved_at)
complaint_updates (id, complaint_id, updated_by_id, old_status, new_status, note, created_at)
feedback        (id, complaint_id, user_id, rating, comment, created_at)
notifications   (id, user_id, complaint_id, type, title, message, is_read, created_at)
```

---

## 🔧 Environment Variables

| Variable         | Default               | Description              |
|------------------|-----------------------|--------------------------|
| `SECRET_KEY`     | (insecure default)    | Django secret key        |
| `DEBUG`          | `True`                | Debug mode               |
| `DB_NAME`        | `intellifix_db`       | MySQL database name      |
| `DB_USER`        | `intellifix_user`     | MySQL username           |
| `DB_PASSWORD`    | `intellifix_pass`     | MySQL password           |
| `DB_HOST`        | `localhost`           | MySQL host               |
| `DB_PORT`        | `3306`                | MySQL port               |
| `EMAIL_HOST`     | `smtp.gmail.com`      | SMTP server              |
| `EMAIL_HOST_USER`| ``                    | Email address            |
| `EMAIL_HOST_PASSWORD` | ``               | Email app password       |
| `VITE_API_URL`   | `http://localhost:8000/api` | Frontend API URL   |
