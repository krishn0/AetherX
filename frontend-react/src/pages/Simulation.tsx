import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { createDisaster, createResource, fetchSimulationData, fetchSafeAreas, allocateResources, dispatchResources, deleteResource, deleteDisaster, startSimulation, type DisasterCreate, type ResourceCreate, type Resource, type DisasterZone, type SafeArea, type AllocationPlan } from '../lib/api';
import { Activity, Flame, Truck, AlertTriangle, Map as MapIcon, Info, BrainCircuit, Send, Layers, Radio, Crosshair, Trash2, PlayCircle } from 'lucide-react';

// Fix for Leaflet default icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons same as Operation Office for consistency
const createIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}80;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const resourceIcon = createIcon('#3b82f6'); // Blue
const disasterIcon = createIcon('#ef4444'); // Red
const safeAreaIcon = createIcon('#22c55e'); // Green

// --- Map Helper Components (Defined outside to prevent re-renders) ---

const MapNavigator = ({ view }: { view: { lat: number, lng: number, zoom: number } | null }) => {
    const map = useMap();
    useEffect(() => {
        if (view) {
            map.flyTo([view.lat, view.lng], view.zoom);
        }
    }, [view, map]);
    return null;
};

const MapEvents = ({
    activeTab,
    setDisasterForm,
    setResourceForm
}: {
    activeTab: string,
    setDisasterForm: React.Dispatch<React.SetStateAction<DisasterCreate>>,
    setResourceForm: React.Dispatch<React.SetStateAction<ResourceCreate>>
}) => {
    const map = useMap();
    useEffect(() => {
        const handleClick = (e: any) => {
            const { lat, lng } = e.latlng;
            const roundedLat = parseFloat(lat.toFixed(4));
            const roundedLng = parseFloat(lng.toFixed(4));

            // Update whichever form is active
            if (activeTab === 'disaster') {
                setDisasterForm(prev => ({ ...prev, location: { lat: roundedLat, lng: roundedLng } }));
            } else if (activeTab === 'resource') {
                setResourceForm(prev => ({ ...prev, location: { lat: roundedLat, lng: roundedLng } }));
            }
        };

        map.on('click', handleClick);
        return () => {
            map.off('click', handleClick);
        };
    }, [map, activeTab, setDisasterForm, setResourceForm]);
    return null;
};

const SimulationPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'disaster' | 'resource' | 'allocation'>('disaster');
    const [mapView, setMapView] = useState<{ lat: number, lng: number, zoom: number } | null>(null);

    // Forms Data
    const [disasterForm, setDisasterForm] = useState<DisasterCreate>({
        type: 'Flood',
        location: { lat: 20.59, lng: 78.96 }, // Default India Center
        severity: 'Medium',
    });

    const [resourceForm, setResourceForm] = useState<ResourceCreate>({
        type: 'Ambulance',
        location: { lat: 19.0760, lng: 72.8777 }, // Mumbai
        capacity: 10,
        specialization: [],
    });

    // Simulation State
    const [resources, setResources] = useState<Resource[]>([]);
    const [zones, setZones] = useState<DisasterZone[]>([]);
    const [safeAreas, setSafeAreas] = useState<SafeArea[]>([]);
    const [allocationPlan, setAllocationPlan] = useState<AllocationPlan | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();

        // Auto-refresh every 5 seconds to stay in sync with Operation Office
        const interval = setInterval(loadData, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const simData = await fetchSimulationData();
            setResources(simData.resources);
            setZones(simData.zones);
            const safeData = await fetchSafeAreas();
            setSafeAreas(safeData);
            setLastUpdate(new Date());
        } catch (e) {
            console.error("Failed to load simulation data", e);
        }
    };

    const handleDisasterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'lat' || name === 'lng') {
            setDisasterForm(prev => ({
                ...prev,
                location: { ...prev.location, [name]: parseFloat(value) }
            }));
        } else {
            setDisasterForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleResourceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'lat' || name === 'lng') {
            setResourceForm(prev => ({
                ...prev,
                location: { ...prev.location, [name]: parseFloat(value) }
            }));
        } else if (name === 'capacity') {
            setResourceForm(prev => ({ ...prev, capacity: parseInt(value) }));
        } else {
            setResourceForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDisasterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const result = await createDisaster(disasterForm);
            setMessage(`Disaster "${result.zone.type}" injected at [${result.zone.location.lat}, ${result.zone.location.lng}]!`);
            loadData();
        } catch (err) {
            console.error(err);
            setError('Failed to create disaster.');
        } finally {
            setLoading(false);
        }
    };

    const handleResourceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            await createResource(resourceForm);
            setMessage(`Resource "${resourceForm.type}" deployed successfully!`);
            loadData();
        } catch (err) {
            setError('Failed to create resource.');
        } finally {
            setLoading(false);
        }
    };

    const handleAllocate = async () => {
        setLoading(true);
        try {
            const plan = await allocateResources(resources, zones);
            setAllocationPlan(plan);
            setMessage(`Allocation Plan Generated! Score: ${plan.total_score.toFixed(2)}`);
        } catch (e) {
            setError("Failed to generate allocation plan.");
        } finally {
            setLoading(false);
        }
    };

    const handleDispatch = async () => {
        if (!allocationPlan) return;
        setLoading(true);
        try {
            await dispatchResources(allocationPlan);
            setMessage("Resources Dispatched Successfully (Simulation)!");
            setAllocationPlan(null);
        } catch (e) {
            setError("Failed to dispatch resources.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteZone = async (e: React.MouseEvent, zoneId: string) => {
        e.stopPropagation(); // Prevent map flyTo

        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return;

        setLoading(true);
        try {
            // 1. Delete ALL resources (not just allocated ones)
            const deletePromises = resources.map(res => deleteResource(res.id));
            await Promise.all(deletePromises);

            // 2. Delete Zone
            await deleteDisaster(zoneId);

            // 3. Update UI
            if (allocationPlan) {
                // Remove allocations for this zone from local plan to avoid ghost lines
                setAllocationPlan(prev => prev ? ({
                    ...prev,
                    allocations: prev.allocations.filter(a => a.zone_id !== zoneId)
                }) : null);
            }

            setMessage(`✅ Disaster zone and ${resources.length} resources removed.`);
            loadData();

        } catch (err) {
            console.error(err);
            setError("Failed to remove disaster data.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartSimulation = async () => {
        if (!window.confirm("This will clear all current simulation data and generate a new scenario. Continue?")) return;
        setLoading(true);
        setMessage(null);
        setError(null);
        try {
            const res = await startSimulation();
            setMessage(res.message);
            setAllocationPlan(null); // Clear old plan
            await loadData(); // Reload new data
        } catch (e) {
            console.error(e);
            setError("Failed to start new simulation.");
        } finally {
            setLoading(false);
        }
    };

    const handleAlertClick = (lat: number, lng: number) => {
        setMapView({ lat, lng, zoom: 12 });
    };

    return (
        <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="px-6 h-16 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-md z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                            AETHER<span className="text-blue-500">X</span>
                        </h1>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            DISASTER SIMULATION ENVIRONMENT
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleStartSimulation}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        <PlayCircle size={14} />
                        New Simulation
                    </button>
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900/50 border border-slate-800 rounded-full">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                            <span className="text-xs font-semibold text-slate-300">{zones.length} Active Zones</span>
                        </div>
                        <div className="w-px h-3 bg-slate-800"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-xs font-semibold text-slate-300">{resources.length} Resources</span>
                        </div>
                        <div className="w-px h-3 bg-slate-800"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs text-slate-500">{lastUpdate.toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Panel: Controls */}
                <div className="w-[400px] flex flex-col bg-[#0b0f19]/95 backdrop-blur-xl border-r border-white/5 z-20 shadow-2xl relative">

                    {/* Navigation Tabs */}
                    <div className="p-4 pb-0">
                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/80 rounded-lg border border-slate-800/50">
                            <button
                                onClick={() => setActiveTab('disaster')}
                                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${activeTab === 'disaster'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Flame size={14} /> Inject
                            </button>
                            <button
                                onClick={() => setActiveTab('resource')}
                                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${activeTab === 'resource'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Truck size={14} /> Deploy
                            </button>
                            <button
                                onClick={() => setActiveTab('allocation')}
                                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${activeTab === 'allocation'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <BrainCircuit size={14} /> AI Plan
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

                        {/* Feedback Messages */}
                        {message && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-sm flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                <p className="leading-snug">{message}</p>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p className="leading-snug">{error}</p>
                            </div>
                        )}

                        {/* Forms */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5 shadow-inner">
                            {activeTab === 'disaster' && (
                                <form onSubmit={handleDisasterSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Disaster Type</label>
                                            <div className="relative">
                                                <select name="type" value={disasterForm.type} onChange={handleDisasterChange} className="w-full bg-[#020617] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all appearance-none">
                                                    <option value="Flood">Flood</option>
                                                    <option value="Cyclone">Cyclone</option>
                                                    <option value="Earthquake">Earthquake</option>
                                                    <option value="Landslide">Landslide</option>
                                                    <option value="Heat Wave">Heat Wave</option>
                                                    <option value="Drought">Drought</option>
                                                </select>
                                                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                                                    <Layers size={14} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Latitude</label>
                                                <div className="relative">
                                                    <input type="number" step="0.0001" name="lat" value={disasterForm.location.lat} onChange={handleDisasterChange} className="w-full bg-[#020617] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono pl-3" />
                                                    <span className="absolute right-3 top-3.5 text-slate-600 text-xs">N</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Longitude</label>
                                                <div className="relative">
                                                    <input type="number" step="0.0001" name="lng" value={disasterForm.location.lng} onChange={handleDisasterChange} className="w-full bg-[#020617] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono pl-3" />
                                                    <span className="absolute right-3 top-3.5 text-slate-600 text-xs">E</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                                            <Crosshair size={12} />
                                            <span>Click map to set coordinates</span>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Intensity Level</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => setDisasterForm(prev => ({ ...prev, severity: level }))}
                                                        className={`py-2 px-1 text-[10px] font-bold uppercase rounded border transition-all ${disasterForm.severity === level
                                                            ? 'bg-red-500/20 border-red-500 text-red-400'
                                                            : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-600'
                                                            }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg font-bold text-sm tracking-wide shadow-lg shadow-red-900/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group">
                                        <div className={`p-1 bg-white/10 rounded-full ${loading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                                            <Radio size={14} />
                                        </div>
                                        {loading ? 'INITIATING...' : 'INJECT SCENARIO'}
                                    </button>
                                </form>
                            )}

                            {activeTab === 'resource' && (
                                <form onSubmit={handleResourceSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Resource Type</label>
                                            <select name="type" value={resourceForm.type} onChange={handleResourceChange} className="w-full bg-[#020617] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                                                <option value="Ambulance">Ambulance</option>
                                                <option value="Fire Truck">Fire Truck</option>
                                                <option value="Police">Police</option>
                                                <option value="Rescue Team">Rescue Team</option>
                                                <option value="NDRF Team">NDRF Team</option>
                                                <option value="Helicopter">Helicopter</option>
                                                <option value="Supply Truck">Supply Truck</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Latitude</label>
                                                <input type="number" step="0.01" name="lat" value={resourceForm.location.lat} onChange={handleResourceChange} className="w-full bg-[#020617] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Longitude</label>
                                                <input type="number" step="0.01" name="lng" value={resourceForm.location.lng} onChange={handleResourceChange} className="w-full bg-[#020617] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Unit Capacity</label>
                                            <input type="number" name="capacity" value={resourceForm.capacity} onChange={handleResourceChange} className="w-full bg-[#020617] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-bold text-sm tracking-wide shadow-lg shadow-blue-900/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group">
                                        <div className={`p-1 bg-white/10 rounded-full ${loading ? 'animate-pulse' : 'group-hover:translate-x-1 transition-transform'}`}>
                                            <Truck size={14} />
                                        </div>
                                        {loading ? 'DEPLOYING...' : 'DEPLOY RESOURCE'}
                                    </button>
                                </form>
                            )}

                            {activeTab === 'allocation' && (
                                <div className="space-y-6">
                                    <div className="text-sm text-slate-400 leading-relaxed border-l-2 border-purple-500 pl-3">
                                        <strong className="text-purple-400 block mb-1">AI Allocation Engine</strong>
                                        Optimizes resource distribution using geospatial analysis and severity weighting to maximize coverage score.
                                    </div>

                                    {!allocationPlan ? (
                                        <button
                                            onClick={handleAllocate}
                                            disabled={loading}
                                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-purple-900/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                            <BrainCircuit size={18} />
                                            <span className="relative">{loading ? 'CALCULATING STRATEGY...' : 'GENERATE AI PLAN'}</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                            <div className="bg-[#020617] border border-purple-500/30 p-4 rounded-xl shadow-inner">
                                                <div className="flex justify-between items-end mb-4 pb-4 border-b border-white/5">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Optimization Score</span>
                                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">{allocationPlan.total_score.toFixed(1)}</span>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Resources Allocated</span>
                                                        <span className="font-bold text-white">{allocationPlan.allocations.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Critical Zones Pending</span>
                                                        <span className="font-bold text-red-400">{allocationPlan.unserved_zones.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Compute Time</span>
                                                        <span className="font-mono text-xs text-slate-500">{allocationPlan.computation_time_ms}ms</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setAllocationPlan(null)}
                                                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition"
                                                >
                                                    Discard
                                                </button>
                                                <button
                                                    onClick={handleDispatch}
                                                    disabled={loading}
                                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                                                >
                                                    <Send size={16} />
                                                    Dispatch
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mini List / Live Feed */}
                        <div className="pt-2">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Activity size={10} /> Live Feed
                            </h3>
                            <div className="space-y-2">
                                {zones.length === 0 && resources.length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-xs italic">
                                        No active events in simulation
                                    </div>
                                )}
                                {zones.slice(0, 5).map(zone => (
                                    <div
                                        key={zone.id}
                                        onClick={() => handleAlertClick(zone.location.lat, zone.location.lng)}
                                        className="group flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-red-500/10 hover:border-red-500/40 cursor-pointer transition-all hover:bg-slate-800"
                                    >
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div className="text-xs font-bold text-slate-200 group-hover:text-red-400 transition-colors">{zone.type} Alert</div>
                                                <button
                                                    onClick={(e) => handleDeleteZone(e, zone.id)}
                                                    className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/30"
                                                    title="Delete Zone & All Resources"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{zone.location.lat.toFixed(2)}, {zone.location.lng.toFixed(2)}</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 self-center">
                                            {zone.severity}
                                        </div>
                                    </div>
                                ))}
                                {resources.slice(0, 5).map(res => (
                                    <div
                                        key={res.id}
                                        onClick={() => handleAlertClick(res.location.lat, res.location.lng)}
                                        className="group flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-blue-500/10 hover:border-blue-500/40 cursor-pointer transition-all hover:bg-slate-800"
                                    >
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{res.type} Deployed</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">ID: {res.id.slice(0, 8)}...</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Map */}
                <div className="flex-1 relative bg-slate-950">
                    <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} className="z-0 bg-slate-950">
                        <MapNavigator view={mapView} />
                        <MapEvents activeTab={activeTab} setDisasterForm={setDisasterForm} setResourceForm={setResourceForm} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />

                        {/* Resources */}
                        {resources.map(res => (
                            <Marker
                                key={res.id}
                                position={[res.location.lat, res.location.lng]}
                                icon={resourceIcon}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1">
                                        <div className="text-xs font-bold text-blue-600 uppercase mb-1">{res.type}</div>
                                        <div className="text-xs text-slate-700 font-medium">Status: {res.status}</div>
                                        <div className="text-xs text-slate-500">Capacity: {res.capacity}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Disaster Zones */}
                        {zones.map(zone => (
                            <Marker key={zone.id} position={[zone.location.lat, zone.location.lng]} icon={disasterIcon}>
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[120px]">
                                        <div className="text-sm font-black text-red-600 uppercase mb-1">{zone.type}</div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Severity</span>
                                            <span className="font-bold text-slate-800">{zone.severity}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Affected</span>
                                            <span className="font-bold text-slate-800">{zone.affected_population.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </Popup>
                                <Circle center={[zone.location.lat, zone.location.lng]} radius={zone.severity * 2000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 1, dashArray: '5,5' }} />
                            </Marker>
                        ))}

                        {/* Safe Areas */}
                        {safeAreas.map(safe => (
                            <Marker key={safe.id} position={[safe.location.lat, safe.location.lng]} icon={safeAreaIcon}>
                                <Popup>
                                    <div className="text-slate-800 text-xs">
                                        <strong className="text-green-600 block mb-1">{safe.type}</strong>
                                        Capacity: {safe.capacity}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Allocations Lines */}
                        {allocationPlan && allocationPlan.allocations.map((alloc, i) => {
                            const res = resources.find(r => r.id === alloc.resource_id);
                            const zone = zones.find(z => z.id === alloc.zone_id);
                            if (!res || !zone) return null;
                            return (
                                <Polyline
                                    key={i}
                                    positions={[[res.location.lat, res.location.lng], [zone.location.lat, zone.location.lng]]}
                                    pathOptions={{ color: '#a855f7', weight: 2, dashArray: '8, 8', opacity: 0.8 }}
                                />
                            );
                        })}
                    </MapContainer>

                    {/* Legend Overlay */}
                    <div className="absolute bottom-8 right-8 bg-[#0b0f19]/90 p-5 rounded-2xl shadow-2xl border border-white/5 backdrop-blur-md z-[1000] min-w-[180px]">
                        <h4 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <MapIcon size={12} /> Live Legend
                        </h4>
                        <div className="space-y-3.5">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                <span className="text-xs font-medium text-slate-300">Active Units</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                <span className="text-xs font-medium text-slate-300">High Risk Zones</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                <span className="text-xs font-medium text-slate-300">Safe Shelters</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-0.5 w-4 bg-purple-500 border border-purple-500 border-dashed"></div>
                                <span className="text-xs font-medium text-slate-300">Allocation Path</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SimulationPage;
