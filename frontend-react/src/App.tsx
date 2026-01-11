import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import PredictionPage from "./pages/Prediction"
import ResourcesPage from "./pages/Resources"
import CitizenPage from "./pages/Citizen"
import OperationOffice from './pages/OperationOffice';
import SimulationPage from './pages/Simulation';
import HelpDesk from './pages/HelpDesk';
import LandingPage from './pages/LandingPage';
import FloatingChatbot from './components/FloatingChatbot';

function App() {
  return (
    <Router>
      <FloatingChatbot />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prediction" element={<PredictionPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/citizen" element={<CitizenPage />} />
        <Route path="/operation-office" element={<OperationOffice />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/help-desk" element={<HelpDesk />} />
      </Routes>
    </Router>
  )
}

export default App

