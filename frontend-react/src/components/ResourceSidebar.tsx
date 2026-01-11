import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Navigation, CheckCircle, Map as MapIcon, LogIn, LayoutDashboard, Newspaper, ExternalLink, BrainCircuit, RefreshCw, Trash2 } from 'lucide-react';
import { type Resource, type DisasterZone, type AllocationPlan, fetchDisasterNews, type NewsItem, sendChatMessage, requestReinforcements } from '../lib/api';
import { getResourceIcon } from '../utils/mapUtils';

interface ResourceSidebarProps {
    resources: Resource[];
    zones: DisasterZone[];
    allocationPlan: AllocationPlan | null;
    loading: boolean;
    dispatchStatus: string | null;
    showSafeAreas: boolean;
    onToggleSafeAreas: () => void;
    onAllocate: () => void;
    onDispatch: () => void;
    onLogout: () => void;
    onAlertClick: (lat: number, lng: number, zoneId?: string) => void;
    onClearSelection: () => void;
    selectedZoneId?: string | null;
    onDeleteZone?: (id: string) => void;
}

const ResourceSidebar: React.FC<ResourceSidebarProps> = ({
    resources,
    zones,
    allocationPlan,
    loading,
    dispatchStatus,
    showSafeAreas,
    onToggleSafeAreas,
    onAllocate,
    onDispatch,
    onLogout,
    onAlertClick,
    onClearSelection,
    selectedZoneId,
    onDeleteZone
}) => {
    // ... [rest of state code omitted for brevity while applying logic in return] ...

    const [activeTab, setActiveTab] = useState<'dashboard' | 'news'>('dashboard');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const navigate = useNavigate();

    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (activeTab === 'news' && news.length === 0) {
            setLoadingNews(true);
            fetchDisasterNews()
                .then(items => setNews(items))
                .catch(err => console.error("News fetch failed", err))
                .finally(() => setLoadingNews(false));
        }
    }, [activeTab, news.length]);

    // ... rest of effect hooks ...

    useEffect(() => {
        setAiAnalysis(null);
    }, [selectedZoneId]);

    // Auto-save to localStorage for Help Desk persistence
    useEffect(() => {
        if (allocationPlan) {
            const data = {
                allocationPlan,
                resources,
                zones,
                selectedZoneId,
                dispatchStatus
            };
            localStorage.setItem('helpDeskData', JSON.stringify(data));
        }
    }, [allocationPlan, resources, zones, selectedZoneId, dispatchStatus]);

    const handleAnalyzeSituation = async () => {
        setAnalyzing(true);
        setAiAnalysis(null);
        try {
            // Construct Detailed Context
            let contextMsg = "";
            let nearbyResourcesContext = "";

            if (selectedZoneId) {
                const zone = zones.find(z => z.id === selectedZoneId);
                if (zone) {
                    contextMsg = `URGENT FOCUS: ${zone.type} (Severity ${zone.severity}) at [${zone.location.lat.toFixed(2)}, ${zone.location.lng.toFixed(2)}].`;

                    // Specific Proximity Check
                    const nearby = resources
                        .map(r => ({ ...r, dist: Math.sqrt(Math.pow(r.location.lat - zone.location.lat, 2) + Math.pow(r.location.lng - zone.location.lng, 2)) * 111 }))
                        .filter(r => r.dist < 200) // 200km radius
                        .sort((a, b) => a.dist - b.dist);

                    if (nearby.length > 0) {
                        const nearbySummary = nearby.map(r => `- ${r.type} (${r.status}) at ${r.dist.toFixed(0)}km`).join('\n');
                        nearbyResourcesContext = `\nAVAILABLE ASSETS WITHIN 200KM:\n${nearbySummary}`;
                    } else {
                        nearbyResourcesContext = "\nWARNING: NO ASSETS WITHIN 200KM RANGE.";
                    }
                }
            } else {
                const zoneSummary = zones.map(z => `- ${z.type} (Sev ${z.severity})`).join('\n');
                contextMsg = `OVERVIEW OF ACTIVE INCIDENTS:\n${zoneSummary}`;
                nearbyResourcesContext = `\nFleet Status: ${resources.filter(r => r.status === 'Available').length} units available out of ${resources.length}.`;
            }

            const prompt = `COMMANDER BRIEFING REQUEST\n${contextMsg}\n${nearbyResourcesContext}\n\nTask: Provide a concise, tactical response plan. If assets are nearby, mandate their specific deployment. If no assets are close, request reinforcements. Be direct.`;

            const response = await sendChatMessage(prompt, "commander-1");
            setAiAnalysis(response.reply);
        } catch (error) {
            console.error(error);
            setAiAnalysis("Communication link with AI Command failed.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="w-96 bg-gray-900 border-r border-gray-700 flex flex-col z-20 shadow-2xl h-full font-sans">
            <div className="p-4 bg-blue-900/20 border-b border-blue-900/30">
                <h1 className="text-lg font-bold flex items-center gap-2 tracking-wide text-blue-100">
                    <MapIcon className="text-blue-400" size={20} />
                    NDEM Ops Center
                </h1>
                <p className="text-[10px] text-blue-300 uppercase tracking-widest ml-7">ISRO / NRSC Powered</p>
            </div>

            {/* Same tabs ... */}
            <div className="flex border-b border-gray-700 bg-gray-800">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition ${activeTab === 'dashboard' ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-800' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}
                >
                    <LayoutDashboard size={16} /> Dashboard
                </button>

                <button
                    onClick={() => setActiveTab('news')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition ${activeTab === 'news' ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-800' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}
                >
                    <Newspaper size={16} /> News
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-900 custom-scrollbar">

                {/* 1. DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div className="p-4 space-y-6">
                        {/* Stats Panel */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-center">
                                <div className="text-red-400 font-bold text-2xl">{zones.length}</div>
                                <div className="text-[10px] uppercase text-gray-500 tracking-wider">Active Zones</div>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-center">
                                <div className="text-blue-400 font-bold text-2xl">{resources.length}</div>
                                <div className="text-[10px] uppercase text-gray-500 tracking-wider">Resources</div>
                            </div>
                        </div>

                        {/* Allocation Plan / Help Desk */}
                        {allocationPlan && (
                            <div className="p-3">
                                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-3 shadow-lg">
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
                                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                            <span className="text-blue-400">🤖</span> AI Response Logistics
                                        </h3>
                                        <button
                                            onClick={() => {
                                                const data = {
                                                    allocationPlan,
                                                    resources,
                                                    zones,
                                                    selectedZoneId
                                                };
                                                localStorage.setItem('helpDeskData', JSON.stringify(data));
                                                navigate('/help-desk', { state: data });
                                            }}
                                            title="Open Full Screen Help Desk"
                                            className="text-gray-400 hover:text-blue-400 transition"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>

                                    {/* Help Desk Table */}
                                    <div className="overflow-hidden rounded border border-gray-700">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-700 text-gray-300 uppercase font-bold text-[10px]">
                                                <tr>
                                                    <th className="px-2 py-1">Resource</th>
                                                    <th className="px-2 py-1 text-right">Dist</th>
                                                    <th className="px-2 py-1 text-right">ETA</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                                                {allocationPlan.allocations.map((alloc, idx) => {
                                                    const res = resources.find(r => r.id === alloc.resource_id);
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-800 transition-colors">
                                                            <td className="px-2 py-1.5 flex items-center gap-2">
                                                                <span className="text-sm">{res ? getResourceIcon(res.type) : '📦'}</span>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-gray-200">{res?.type}</span>
                                                                    <span className="text-[9px] text-gray-500 font-mono">{alloc.resource_id.slice(0, 6)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-1.5 text-right font-mono text-blue-400">
                                                                {alloc.distance_km ? alloc.distance_km.toFixed(1) : '?'}km
                                                            </td>
                                                            <td className="px-2 py-1.5 text-right font-mono text-emerald-400">
                                                                {alloc.eta_minutes}m
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={onDispatch}
                                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <span>🚀</span> Confirm & Dispatch
                                        </button>
                                        <button
                                            onClick={onClearSelection}
                                            className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition text-xs font-bold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>

                                {/* AI Rationale Box */}
                                <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded text-xs text-gray-300 italic mb-4">
                                    <span className="font-bold text-blue-400 not-italic">Strategy: </span>
                                    {allocationPlan.ai_rationale || "Resources optimized for proximity and severity coverage."}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Response Tools</h3>

                            {/* Dispatch Summary Report */}
                            {dispatchStatus && (
                                <div className="p-3 bg-green-900/40 border border-green-500/50 rounded animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-2 text-green-400 font-bold text-xs mb-2 border-b border-green-500/30 pb-1">
                                        <CheckCircle size={14} /> Mission Authorized
                                    </div>
                                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-thin">
                                        {allocationPlan?.allocations.map((alloc, idx) => {
                                            const res = resources.find(r => r.id === alloc.resource_id);
                                            return (
                                                <div key={idx} className="flex justify-between items-center text-[10px] text-gray-300">
                                                    <span>{res?.type || alloc.resource_id}</span>
                                                    <span className="text-green-500">➜ Deployed</span>
                                                </div>
                                            );
                                        }) || <div className="text-[10px] text-gray-400">Status Updated</div>}
                                    </div>
                                    <div className="mt-2 text-[10px] text-green-300/60 text-center font-mono">
                                        All systems updated. Live tracking enabled.
                                    </div>
                                </div>
                            )}

                            {/* AI Analysis Button */}
                            <button
                                onClick={handleAnalyzeSituation}
                                disabled={analyzing}
                                className={`w-full py-3 px-4 rounded font-bold flex items-center justify-center gap-2 transition text-sm ${analyzing ? 'bg-purple-900/50 text-purple-300 animate-pulse' : 'bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-900/20'}`}
                            >
                                <BrainCircuit size={16} />
                                {analyzing ? 'Consulting AI...' : 'AI Strategic Analysis'}
                            </button>

                            {/* AI Result Card */}
                            {aiAnalysis && (
                                <div className="bg-purple-900/10 border border-purple-500/30 p-3 rounded animate-in fade-in zoom-in duration-300">
                                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <BrainCircuit size={12} /> Commander's Brief
                                    </h4>
                                    <div className="text-xs text-purple-100 leading-relaxed font-mono space-y-2">
                                        {aiAnalysis.split('\n').map((line, i) => {
                                            const parts = line.split(/(\*\*.*?\*\*)/g);
                                            return (
                                                <p key={i} className={line.trim().startsWith('1.') || line.trim().startsWith('2.') ? 'pl-2' : ''}>
                                                    {parts.map((part, j) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return <span key={j} className="font-bold text-white bg-purple-500/20 px-1 rounded">{part.slice(2, -2)}</span>;
                                                        }
                                                        return part;
                                                    })}
                                                </p>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={onAllocate}
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded font-bold flex items-center justify-center gap-2 transition text-sm ${loading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/20'}`}
                            >
                                <Navigation size={16} />
                                {allocationPlan ? 'Re-Calculate Plan' : (selectedZoneId ? 'Plan for Selected Zone' : 'Generate Allocation Plan')}
                            </button>

                            {/* Allocation Plan Details */}
                            {allocationPlan && (
                                <div className="bg-gray-800/80 p-4 rounded border border-gray-600 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <h3 className="text-xs font-bold text-green-400 mb-3 flex items-center justify-between uppercase tracking-wider">
                                        <span>Plan Generated</span>
                                        <span className="bg-green-900/30 px-2 py-0.5 rounded text-[10px]">{allocationPlan.allocations.length} Routes</span>
                                    </h3>

                                    {/* AI Rationale Display */}
                                    {allocationPlan.ai_rationale && (
                                        <div className="bg-blue-900/20 p-2 mb-3 rounded border-l-2 border-blue-500">
                                            <p className="text-[10px] text-blue-200 italic font-mono leading-tight">
                                                "{allocationPlan.ai_rationale}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Reinforcement Workflow */}
                                    {allocationPlan.unserved_zones.length > 0 && (
                                        <div className="mb-3 animate-in fade-in slide-in-from-left-4">
                                            <button
                                                onClick={async () => {
                                                    // Request reinforcements for unserved zones
                                                    if (allocationPlan.unserved_zones.length > 0) {
                                                        const btn = document.getElementById('reinforce-btn');
                                                        if (btn) btn.innerText = "Deploying National Assets...";

                                                        await requestReinforcements(allocationPlan.unserved_zones);

                                                        // Brief delay to simulate deployment then re-plan
                                                        setTimeout(() => {
                                                            onAllocate(); // Re-trigger allocation to incorporate new units
                                                        }, 1500);
                                                    }
                                                }}
                                                id="reinforce-btn"
                                                className="w-full py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 border border-red-500/50"
                                            >
                                                <RefreshCw size={14} className="animate-spin-slow" />
                                                Request National Reinforcements
                                            </button>
                                            <p className="text-[9px] text-orange-300/60 text-center mt-1">
                                                *Authorizes deployment of NDRF reserve units
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-400">
                                        <div>Score: <span className="text-white">{allocationPlan.total_score.toFixed(1)}</span></div>
                                        <div>Pending: <span className="text-red-400">{allocationPlan.unserved_zones.length}</span></div>
                                    </div>
                                    <button
                                        onClick={onDispatch}
                                        disabled={loading}
                                        className="w-full bg-green-600 hover:bg-green-700 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wide transition"
                                    >
                                        <CheckCircle size={14} />
                                        Confirm & Dispatch
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={onToggleSafeAreas}
                                className={`w-full py-2 px-4 rounded border font-semibold flex items-center justify-center gap-2 transition text-xs uppercase tracking-wide ${showSafeAreas ? 'bg-green-900/20 border-green-600/50 text-green-400' : 'bg-transparent border-gray-700 hover:bg-gray-800 text-gray-400'}`}
                            >
                                <Shield size={14} />
                                {showSafeAreas ? 'Hide Safe Areas' : 'Show Safe Areas'}
                            </button>
                        </div>

                        {/* Live Alerts */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest pl-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                Current Incidents
                            </h3>
                            <div className="space-y-2">
                                {zones.map(zone => (
                                    <div
                                        key={zone.id}
                                        onClick={() => onAlertClick(zone.location.lat, zone.location.lng, zone.id)}
                                        className={`bg-gray-800/40 p-3 rounded border-l-2 hover:bg-gray-800 cursor-pointer transition relative group ${selectedZoneId === zone.id ? 'border-yellow-400 ring-1 ring-yellow-400/30' : 'border-red-500'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-bold text-gray-200">{zone.type}</span>
                                            <div className="flex items-center gap-2">
                                                {(allocationPlan?.allocations.some(a => a.zone_id === zone.id) || zone.status === 'Processing') && (
                                                    <span className="text-[9px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse border border-green-500/30">
                                                        Processing
                                                    </span>
                                                )}
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${zone.severity >= 8 ? 'bg-red-900/50 text-red-500' :
                                                    zone.severity >= 5 ? 'bg-orange-900/50 text-orange-500' :
                                                        'bg-blue-900/50 text-blue-500'
                                                    }`}>
                                                    Lv {zone.severity}
                                                </span>
                                                {onDeleteZone && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteZone(zone.id);
                                                        }}
                                                        className="text-gray-600 hover:text-red-400 p-1 rounded hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete Incident"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="text-[10px] text-gray-500">
                                                Pop: <span className="text-gray-300">{zone.affected_population}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-600 font-mono">
                                                {zone.location.lat.toFixed(2)}, {zone.location.lng.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Last Updated Timestamp */}
                        <div className="text-center pt-2">
                            <div className="text-[9px] uppercase text-gray-600 tracking-wider flex items-center justify-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                Last Updated: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SERVICES TAB (Static/Mock for Visuals) */}


                {/* 3. NEWS TAB (Static/Mock) */}
                {activeTab === 'news' && (
                    <div className="p-4 space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest pl-1">Latest Updates</h3>
                        {loadingNews ? (
                            <div className="text-center text-gray-500 text-xs py-4">Fetching live updates...</div>
                        ) : (
                            news.map((item, i) => (
                                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block bg-gray-800/40 p-3 rounded border border-gray-700 hover:bg-gray-800 cursor-pointer transition group">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-[10px] text-blue-400">{item.source}</div>
                                        <ExternalLink size={10} className="text-gray-600 group-hover:text-gray-400" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-300 leading-snug mb-1">
                                        {item.title}
                                    </p>
                                    <div className="text-[9px] text-gray-500">{new Date(item.published).toLocaleString()}</div>
                                </a>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900">
                <button onClick={onLogout} className="w-full py-2 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition text-xs font-bold uppercase tracking-wider">
                    <LogIn size={14} /> System Logout
                </button>
            </div>
        </div >
    );
};

export default ResourceSidebar;
