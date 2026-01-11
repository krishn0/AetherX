
import React from 'react';
import { CheckCircle2, Truck, Activity, Navigation } from 'lucide-react';
import type { AllocationPlan } from '../lib/api';

interface DispatchSummaryProps {
    plan: AllocationPlan;
    onClose: () => void;
}

const DispatchSummary: React.FC<DispatchSummaryProps> = ({ plan, onClose }) => {
    // Calculate stats
    console.log("DispatchSummary Plan:", plan); // Debug Log
    const totalUnits = plan.allocations.length;
    const distinctZones = new Set(plan.allocations.map(a => a.zone_id)).size;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-black/90 border border-blue-500/30 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative group">
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-[80px]" />

                <div className="p-8 text-center relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-900/30 border border-blue-500/50 mb-6 group-hover:scale-110 transition-transform duration-500">
                        <CheckCircle2 className="w-10 h-10 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Mission Active</h2>
                    <p className="text-blue-200/60 mb-8 font-mono text-sm uppercase tracking-widest">Resources Deployed & En Route</p>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <Truck className="text-blue-400 mb-2 mx-auto" size={24} />
                            <div className="text-2xl font-bold text-white mb-1">{totalUnits}</div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-400">Units</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <Navigation className="text-purple-400 mb-2 mx-auto" size={24} />
                            <div className="text-2xl font-bold text-white mb-1">{distinctZones}</div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-400">Zones</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <Activity className="text-green-400 mb-2 mx-auto" size={24} />
                            <div className="text-2xl font-bold text-white mb-1">

                                {plan.allocations.length > 0 ? Math.max(...plan.allocations.map(a => a.eta_minutes)) : 0}m
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-400">Max ETA</div>
                        </div>
                    </div>

                    {/* Detailed Allocation List */}
                    <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar border-t border-white/10 pt-4">
                        <h3 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2 sticky top-0 bg-black/95 py-1 z-10">
                            Allocation Details
                        </h3>
                        {plan.allocations.map((a, i) => {
                            // Extract distance from explanation if available (format: "Proximity: 4.2km")
                            const distMatch = a.explanation.match(/Proximity:\s*([\d.]+)km/);
                            const distance = distMatch ? `${distMatch[1]}km` : 'N/A';

                            return (
                                <div key={`${a.resource_id}-${i}`} className="bg-white/5 p-3 rounded flex justify-between items-center text-xs border border-white/5 hover:bg-white/10 transition group">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-200 font-bold font-mono">{a.resource_id}</span>
                                            <span className="text-gray-500">→</span>
                                            <span className="text-red-300 font-bold font-mono">{a.zone_id}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1 truncate max-w-[200px] group-hover:max-w-none transition-all">
                                            {a.explanation}
                                        </div>
                                    </div>
                                    <div className="text-right pl-3 border-l border-white/10 ml-3">
                                        <div className="text-white font-bold font-mono text-sm">{a.eta_minutes}m</div>
                                        <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider">{distance}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
                        </div>
                        <p className="text-[10px] text-gray-500 animate-pulse">Establishing secure comms link...</p>
                    </div>
                </div>

                <div className="bg-white/5 p-4 border-t border-white/10 flex justify-center">
                    <button
                        onClick={onClose}
                        className="text-sm font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        Dismiss Confirmation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DispatchSummary;
