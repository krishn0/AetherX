import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import ResourceSidebar from '../components/ResourceSidebar';
import DisasterMap from '../components/DisasterMap';
import { fetchSimulationData, fetchSafeAreas, allocateResources, dispatchResources, type Resource, type DisasterZone, type AllocationPlan, type SafeArea, deleteDisaster, deleteResourcesBulk } from '../lib/api';

const OperationOffice: React.FC = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessCode, setAccessCode] = useState('');

    // State
    const [resources, setResources] = useState<Resource[]>([]);
    const [zones, setZones] = useState<DisasterZone[]>([]);
    const [safeAreas, setSafeAreas] = useState<SafeArea[]>([]);
    const [allocationPlan, setAllocationPlan] = useState<AllocationPlan | null>(null);
    const [showSafeAreas, setShowSafeAreas] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Auth Check
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessCode === 'admin123') {
            setIsAuthenticated(true);
        } else {
            alert('Invalid Access Code');
        }
    };

    // Data Loading
    const loadSimulationData = async () => {
        setLoading(true);
        try {
            const data = await fetchSimulationData();
            setResources(data.resources);
            setZones(data.zones);
            const safe = await fetchSafeAreas();
            setSafeAreas(safe);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Failed to load data", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadSimulationData();
            const interval = setInterval(loadSimulationData, 5000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    // Actions
    const handleAllocate = async () => {
        setLoading(true);
        const filteredZones = selectedZoneId
            ? zones.filter(z => z.id === selectedZoneId)
            : zones;

        try {
            const plan = await allocateResources(resources, filteredZones);
            setAllocationPlan(plan);
        } catch (error) {
            console.error(error);
            alert("Allocation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDispatch = async () => {
        if (!allocationPlan) return;
        setLoading(true);
        try {
            const res = await dispatchResources(allocationPlan);
            setDispatchStatus(res.message);

            // Track active missions persistently


            setTimeout(() => setDispatchStatus(null), 5000);
            setAllocationPlan(null);
            loadSimulationData(); // Refresh to show status changes
        } catch (error) {
            alert("Dispatch failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteZone = async (zoneId: string) => {
        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return;

        if (!window.confirm(`⚠️ DELETE ALERT?\n\nType: ${zone.type}\nSeverity: ${zone.severity}\n\nThis will remove:\n✓ The disaster alert\n✓ ALL resources (cleanup)\n\nContinue?`)) return;

        setLoading(true);
        try {
            // Bulk delete all resources
            const allResourceIds = resources.map(r => r.id);
            if (allResourceIds.length > 0) {
                await deleteResourcesBulk(allResourceIds);
            }

            // Delete zone
            await deleteDisaster(zoneId);

            // UI Cleanup
            if (allocationPlan) {
                setAllocationPlan(null);
            }
            loadSimulationData();
        } catch (err) {
            console.error(err);
            alert("Failed to remove data.");
        } finally {
            setLoading(false);
        }
    };

    // If not authenticated, show login
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-900/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-white mb-2">Restricted Access</h2>
                    <p className="text-gray-400 text-center text-sm mb-8">Enter authorized credentials to access NDEM Ops Center.</p>

                    <input
                        type="password"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="Access Code"
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none mb-4 transition-colors"
                    />
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">
                        Access Dashboard
                    </button>
                    <button type="button" onClick={() => navigate('/')} className="w-full mt-3 text-gray-500 py-2 text-sm hover:text-white transition">
                        Cancel
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#020617] text-white overflow-hidden">
            <ResourceSidebar
                resources={resources}
                zones={zones}
                allocationPlan={allocationPlan}
                loading={loading}
                dispatchStatus={dispatchStatus}
                showSafeAreas={showSafeAreas}
                onToggleSafeAreas={() => setShowSafeAreas(!showSafeAreas)}
                onAllocate={handleAllocate}
                onDispatch={handleDispatch}
                onLogout={() => setIsAuthenticated(false)}
                onAlertClick={(_, __, id) => setSelectedZoneId(id || null)}
                onClearSelection={() => setSelectedZoneId(null)}
                selectedZoneId={selectedZoneId}
                onDeleteZone={handleDeleteZone}
            />

            <div className="flex-1 flex flex-col h-full relative">
                {/* Map Layer */}
                <div className="absolute inset-0 z-0">
                    <DisasterMap
                        resources={resources}
                        zones={zones}
                        allocationPlan={allocationPlan}
                        safeAreas={showSafeAreas ? safeAreas : []}
                        showSafeAreas={showSafeAreas}
                        mapView={selectedZoneId
                            ? (() => {
                                const z = zones.find(z => z.id === selectedZoneId);
                                return z ? { lat: z.location.lat, lng: z.location.lng, zoom: 10 } : null;
                            })()
                            : { lat: 20.5937, lng: 78.9629, zoom: 5 }
                        }
                        // User request: Don't show visual paths for plan
                        showRoutes={false}
                    />
                </div>

                {/* Overlay Header */}
                <div className="absolute top-0 left-0 w-full z-10 pointer-events-none p-6">
                    <div className="flex justify-between items-start pointer-events-auto">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow-sm">
                                OPERATION OFFICE <span className="text-xs font-mono text-gray-500 ml-2 tracking-widest">LIVE</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] text-emerald-400 font-mono tracking-wide">
                                    DATA SYNC: {lastUpdate.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationOffice;
