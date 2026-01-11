import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import WorkflowSection from '../components/WorkflowSection';

const LandingPage: React.FC = () => {
    return (
        <div className="bg-black min-h-screen text-white/90 font-sans selection:bg-blue-500/30">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <WorkflowSection />

            {/* Simple Footer */}
            <footer className="py-8 border-t border-gray-900 text-center text-gray-600 text-sm">
                <p>&copy; 2026 AetherX Disaster Management System. ISRO / NRSC Data Integration.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
