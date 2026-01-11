import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, Activity, MapPin, Truck, AlertTriangle } from 'lucide-react';
import { type AllocationPlan, type Resource, type DisasterZone } from '../lib/api';

interface HelpDeskState {
    allocationPlan: AllocationPlan;
    resources: Resource[];
    zones: DisasterZone[];
    selectedZoneId: string;
    dispatchStatus?: string | null;
}

const HelpDesk: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Try to get state from location, or fallback to localStorage
    const [state, setHelpDeskState] = React.useState<HelpDeskState | null>(() => {
        if (location.state) return location.state as HelpDeskState;

        const saved = localStorage.getItem('helpDeskData');
        return saved ? JSON.parse(saved) : null;
    });

    // Listen for storage events to update in real-time across tabs
    React.useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'helpDeskData' && e.newValue) {
                const newData = JSON.parse(e.newValue);
                setHelpDeskState(newData);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (!state || !state.allocationPlan) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center flex-col gap-4">
                <AlertTriangle size={48} className="text-yellow-500" />
                <h1 className="text-2xl font-bold">No Active Plan Data</h1>
                <p className="text-gray-400">Please generate a plan in the Operation Office first.</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/operation-office')}
                        className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold"
                    >
                        Return to Ops Center
                    </button>
                    {/* Debug/Demo Button if needed, but sticking to flow */}
                </div>
            </div>
        );
    }

    const { allocationPlan, resources, zones, selectedZoneId, dispatchStatus } = state;
    const selectedZone = zones.find(z => z.id === selectedZoneId);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-400 hover:text-white transition p-2 rounded hover:bg-gray-800"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                            <Activity className="text-blue-500" />
                            Emergency Response Help Desk
                        </h1>
                        <p className="text-xs text-blue-400 font-mono uppercase tracking-widest">
                            Official Logistics Dashboard
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                        <div className="text-gray-400 text-xs uppercase">Incident</div>
                        <div className="font-bold text-red-500 flex items-center gap-1 justify-end">
                            <AlertTriangle size={14} /> {selectedZone?.type || 'Unknown'} (Lv {selectedZone?.severity})
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-gray-400 text-xs uppercase">Authorized Resources</div>
                        <div className="font-bold text-green-400">{allocationPlan.allocations.length} Units</div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">

                {/* Left: Detailed Logistics Table */}
                <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-200 flex items-center gap-2">
                            <Truck className="text-emerald-500" /> Deployment Schedule
                        </h2>
                        {dispatchStatus ? (
                            <span className="text-xs bg-green-900/40 text-green-400 px-3 py-1.5 rounded border border-green-500/30 font-bold animate-pulse uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Mission Authorized
                            </span>
                        ) : (
                            <span className="text-xs bg-yellow-900/30 text-yellow-400 px-3 py-1.5 rounded border border-yellow-500/20 font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                LIVE STATUS: PLANNING
                            </span>
                        )}
                    </div>

                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-800 text-gray-400 text-xs uppercase font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Resource Unit</th>
                                    <th className="p-4">Origin Status</th>
                                    <th className="p-4 text-right">Distance</th>
                                    <th className="p-4 text-right">ETA (Est)</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm">
                                {allocationPlan.allocations.map((alloc, idx) => {
                                    const res = resources.find(r => r.id === alloc.resource_id);
                                    return (
                                        <tr key={idx} className="hover:bg-gray-800/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl shadow-inner">
                                                        {/* Simple icon mapping based on type */}
                                                        {res?.type.includes('Ambulance') ? '🚑' :
                                                            res?.type.includes('Fire') ? '🚒' :
                                                                res?.type.includes('Police') ? '🚓' : '🚛'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{res?.type}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{alloc.resource_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-900/30 text-blue-400 border border-blue-500/20">
                                                    {res?.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-mono text-gray-300">
                                                {alloc.distance_km?.toFixed(1) || '?'} km
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-emerald-400 font-bold font-mono">{alloc.eta_minutes} min</span>
                                            </td>
                                            <td className="p-4 text-center text-gray-500 group-hover:text-white transition cursor-pointer">
                                                Details &gt;
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: AI Analysis & Map Placeholder */}
                <div className="flex flex-col gap-6">
                    {/* Map Stub (Could be a real mini-map) */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 h-64 relative overflow-hidden group shadow-lg">
                        <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center">
                            <MapPin className="text-gray-600 opacity-20" size={64} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-4">
                            <div className="text-xs font-bold text-gray-400 uppercase">Target Zone</div>
                            <div className="text-sm text-white truncate">{selectedZoneId}</div>
                        </div>
                    </div>

                    {/* AI Rationale */}
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl border border-indigo-500/30 p-6 flex-1 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BrainCircuit size={120} />
                        </div>
                        <h3 className="font-bold text-indigo-300 mb-4 flex items-center gap-2">
                            <BrainCircuit size={20} /> Commander's Strategy
                        </h3>
                        <div className="prose prose-invert prose-sm">
                            <p className="text-gray-300 leading-relaxed italic">
                                "{allocationPlan.ai_rationale || 'Optimization based on proximity and severity algorithms.'}"
                            </p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-gray-400 uppercase">Efficiency Score</div>
                                <div className="text-2xl font-bold text-white">{allocationPlan.total_score}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase">Pending Targets</div>
                                <div className="text-2xl font-bold text-red-400">{allocationPlan.unserved_zones.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HelpDesk;
