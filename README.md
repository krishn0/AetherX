# AetherX: AI-Powered Disaster Management System

A production-ready AI platform for disaster prediction, real-time monitoring, and resource allocation.

## Key Features

- **AI Risk Prediction**: Random Forest model to classify disaster risk based on severity, economic loss, and casualty estimates.
- **Trend Forecasting**: Time-series analysis to predict disaster frequency.
- **Real-time Monitoring**: Live simulated feeds of global disaster events.
- **Resource Allocation**: Rule-based engine to recommend personnel and equipment deployment.
- **Citizen Support**: AI Chatbot assistance for emergency guidance.
- **Interactive Dashboard**: Next.js frontend with Leaflet maps and Recharts analytics.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy (Async), PostgreSQL, Scikit-learn
- **Frontend**: TypeScript, Next.js 14, Tailwind CSS, Shadcn UI (Custom), React Leaflet
- **Infrastructure**: Docker, Docker Compose

## Quick Start (Docker)

1. Ensure Docker and Docker Compose are installed.
2. Run the application:
   ```bash
   docker-compose up --build
   ```
3. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Local Setup

### Backend
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create venv and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
3. Process data and train models:
   ```bash
   python data/process_data.py
   python app/ml/train_models.py
   ```
4. Run server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```

## Dataset
The system uses `global_disaster_response_2018_2024.csv` for training its risk models. Ensure this file is present in the root `data` folder or updated in the script paths.
