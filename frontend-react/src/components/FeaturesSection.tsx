import React from 'react';
import { BrainCircuit, Globe, Zap, Users } from 'lucide-react';

const features = [
    {
        icon: <BrainCircuit className="w-8 h-8 text-purple-400" />,
        title: "AI-Driven Strategy",
        desc: "Llama-3 powered strategic analysis and resource allocation justification."
    },
    {
        icon: <Globe className="w-8 h-8 text-blue-400" />,
        title: "Real-Time Mapping",
        desc: "Live geospatial visualization of disaster zones and assets across India."
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-400" />,
        title: "Instant Deployment",
        desc: "One-click activation of NDRF units with automated route optimization."
    },
    {
        icon: <Users className="w-8 h-8 text-green-400" />,
        title: "Citizen Safety",
        desc: "Integrated chatbot and alert system for mass civilian communication."
    }
];

const FeaturesSection: React.FC = () => {
    return (
        <div id="features" className="py-24 bg-gray-950 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-white mb-4">Core Capabilities</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Advanced modules integrated into a unified operational dashboard.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="group p-8 bg-gray-900/50 border border-gray-800 hover:border-blue-500/50 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:-translate-y-2">
                            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl w-fit group-hover:bg-blue-500/10 transition-colors">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">{f.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturesSection;
