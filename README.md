# Sports Odds Intelligence Platform

A full-stack, microservice-based web application that provides real-time, AI-generated sports odds and predictions using a feature-based logic engine, PostgreSQL, React, and Google's Gemini Tool-Calling ecosystem.

## 🏗️ Architecture Overview

This project is built using a modern startup-grade microservice architecture:
1. **Frontend:** React (Vite) - Port 5174
2. **Backend Engine:** Node.js / Express / Prisma - Port 5000
3. **AI Odds Service:** Python Flask - Port 8000
4. **Database:** PostgreSQL 17

---

## 🚀 Quick Start (Docker - Recommended)

The entire application has been fully containerized. You do not need to install Node, Python, or PostgreSQL on your host machine to run this project.

### 1. Set up Environment Variables
In the `backend` folder, create a `.env` file (or rename `.env.example` if available) and add your Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Launch the Stack
From the root directory of the project, run:
```bash
docker-compose up --build -d
```

*Note: On its very first boot, the backend container will automatically run the Prisma migrations (`db push`) and safely seed the database with sample matches if it is empty.*

### 3. Open the App
Visit **http://localhost:5174** in your web browser.

*(To shut down the platform entirely, run `docker-compose down`)*

---

## 🛠️ Manual Setup (Without Docker)

If you prefer to run the services individually on bare-metal, follow these steps:

**1. Database**
Ensure you have a PostgreSQL instance running locally. Create a database named `sports_odds_db` and a user `postgres` with password `postgres123`.

**2. Python Odds Service (Port 8000)**
```bash
cd python-odds-service
python -m venv venv
source venv/Scripts/activate  # (or venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
python app.py
```

**3. Node.js Backend (Port 5000)**
```bash
cd backend
npm install
# Set your DATABASE_URL and GEMINI_API_KEY in backend/.env
npx prisma db push
node prisma/seed.js
node src/index.js
```

**4. React Frontend (Port 5173)**
```bash
cd frontend
npm install
npm run dev
```

---
