# AetherX: AI-Powered Disaster Management System

A production-ready AI platform for disaster prediction, real-time monitoring, and intelligent resource allocation. AetherX leverages advanced machine learning and real-time data to coordinate emergency responses effectively.

## 🚀 Key Features

### 1. **Mission Control Dashboard**
- **Central Hub**: Unified view of ongoing operations and key metrics.
- **Real-time Analytics**: Visualizations of disaster impact and response efficiency.

### 2. **Operation Office (Ops Center)**
- **Advanced Mapping**: Interactive Leaflet maps showing disaster zones, resources, and safe areas.
- **Resource Management**: Track and deploy rescue teams (NDRF, Fire, Medical) and assets (Drones, Ambulances).
- **Radius Filtering**: Smart filtering to show resources within actionable range of disasters.
- **Scenario Simulation**: Test response strategies in a safe, simulated environment.

### 3. **AI & Machine Learning**
- **Risk Prediction**: Random Forest models to assess disaster severity and potential impact.
- **Smart Allocation**: AI-driven engine (Rule-based + ML) to recommend the optimal mix of resources for specific disaster types.
- **Flood Detection**: Computer Vision models (U-Net) for analyzing satellite imagery (Integration ready).

### 4. **Emergency Services**
- **Help Desk**: Dedicated portal for citizens to request help and report incidents.
- **Live News Feed**: Integrated Google News RSS feed for real-time disaster updates across India.
- **Global Chatbot**: Floating AI assistant powered by Groq/Gemini to answer queries and guide users.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Maps**: React Leaflet
- **State Management**: React Hooks

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [MongoDB](https://www.mongodb.com/) (Motor Async Driver)
- **AI/ML**: Scikit-learn, TensorFlow/Keras (for models), Groq API (for LLM)
- **Runtime**: Uvicorn

## 📦 Deployment

### Backend (Render)
- Configured via `render.yaml`.
- Deploys as a Python Web Service.

### Frontend (Vercel)
- Configured via `vercel.json` for SPA routing.
- Deploys as a static site.

## ⚡ Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB Connection String

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
*Port: 8000*

### 2. Frontend Setup
```bash
cd frontend-react
npm install
npm run dev
```
*Port: 5173*

## 📂 Project Structure
```
├── backend/
│   ├── app/            # FastAPI Application
│   │   ├── api/        # Routes (prediction, monitoring, resources)
│   │   ├── ml/         # ML Models & Logic
│   │   └── core/       # Config & Settings
│   └── ml_models/      # Trained Pickle Models
├── frontend-react/
│   ├── src/
│   │   ├── components/ # Reusable UI Components
│   │   ├── pages/      # Application Pages (Dashboard, Ops Office)
│   │   └── ui/         # Shadcn UI primitives
```

## 🔐 Environment Variables
Create `.env` files in respective directories:
- **Backend**: `MONGODB_URL`, `GROQ_API_KEY`, `GEMINI_API_KEY`
- **Frontend**: `VITE_API_URL` (if deployed)
