
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';
import type { Resource, DisasterZone, SafeArea, AllocationPlan, SOSSignal } from '../lib/api';
import { getDistance } from '../lib/utils';
import { getSeverityColor, getResourceStatusColor, getResourceIcon, getDisasterIcon } from '../utils/mapUtils';
import { Layers, Wind, Activity, Map as MapIcon, Globe, Siren } from 'lucide-react';

// ... (keep existing icon code) ...
// Fix for Leaflet default icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons with dynamic colors
const createIcon = (color: string, label?: string) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.8);">${label || ''}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

// Create resource icon with status badge
const createResourceIcon = (status: string, type: string) => {
    const color = getResourceStatusColor(status);
    const icon = getResourceIcon(type);
    return L.divIcon({
        className: 'resource-marker',
        html: `
            <div class="relative">
                <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.8); display: flex; align-items: center; justify-center; font-size: 12px;">
                    ${icon}
                </div>
                <div style="position: absolute; bottom: -4px; right: -4px; background: ${status === 'Available' ? '#22c55e' : status === 'Deployed' ? '#ef4444' : '#eab308'}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
};

// Create disaster zone icon with severity color
const createDisasterIcon = (severity: number, type: string) => {
    const color = getSeverityColor(severity);
    const icon = getDisasterIcon(type);
    return L.divIcon({
        className: 'disaster-marker',
        html: `
            <div class="relative">
                <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.9); display: flex; align-items: center; justify-center; font-size: 14px; animation: pulse 2s infinite;">
                    ${icon}
                </div>
                <div style="position: absolute; top: -6px; right: -6px; background: white; color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid ${color}; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-center;">
                    ${severity}
                </div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};



const sosIcon = L.divIcon({
    className: 'sos-icon',
    html: `<div class="relative w-full h-full">
             <div class="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-75"></div>
             <div class="relative bg-red-600 rounded-full border-2 border-white shadow-lg w-full h-full flex items-center justify-center text-white font-bold text-[10px]">SOS</div>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

interface DisasterMapProps {
    resources: Resource[];
    zones: DisasterZone[];
    safeAreas: SafeArea[];
    allocationPlan: AllocationPlan | null;
    sosSignals?: SOSSignal[];
    showSafeAreas: boolean;
    mapView: { lat: number; lng: number; zoom: number } | null;
    showClusters?: boolean;
    showRoutes?: boolean;
}

// ... (keep MapController and WindOverlay) ...
const MapController = ({ view }: { view: { lat: number; lng: number; zoom: number } | null }) => {
    const map = useMap();
    useEffect(() => {
        if (view) {
            map.flyTo([view.lat, view.lng], view.zoom);
        }
    }, [view, map]);
    return null;
};

// Simulated Wind Grid
const WindOverlay = ({ bounds }: { bounds: number[] }) => {
    const arrows = useMemo(() => {
        const grid = [];
        const [minLat, minLng, maxLat, maxLng] = bounds;
        const step = 2.5; // Grid density
        for (let lat = minLat; lat <= maxLat; lat += step) {
            for (let lng = minLng; lng <= maxLng; lng += step) {
                // Randomize wind direction slightly (Monsoon flow: SW to NE mostly)
                const rotation = 45 + Math.random() * 20;
                grid.push({ lat, lng, rotation });
            }
        }
        return grid;
    }, [bounds]);

    return (
        <>
            {arrows.map((arrow, i) => (
                <Marker
                    key={i}
                    position={[arrow.lat, arrow.lng]}
                    icon={L.divIcon({
                        className: 'wind-arrow',
                        html: `<div style="transform: rotate(${arrow.rotation}deg); font-size: 16px; color: rgba(255,255,255,0.4);">➤</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })}
                    interactive={false}
                />
            ))}
        </>
    );
};

const DisasterMap: React.FC<DisasterMapProps> = ({
    resources,
    zones,
    safeAreas,
    allocationPlan,
    sosSignals = [],
    showSafeAreas,
    mapView,
    showClusters = true,
    showRoutes = true
}) => {
    const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
    const [showWind, setShowWind] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);

    const safeAreaIcon = createIcon('#22c55e'); // Green

    return (
        <div className="flex-1 relative z-10 h-full">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} className="bg-gray-900">
                <MapController view={mapView} />

                {mapStyle === 'dark' ? (
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                ) : (
                    <TileLayer
                        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                )}

                {/* Heatmap Overlay */}
                {showHeatmap && zones.map(zone => (
                    <Circle
                        key={`heat-${zone.id}`}
                        center={[zone.location.lat, zone.location.lng]}
                        radius={50000}
                        pathOptions={{
                            color: 'transparent',
                            fillColor: zone.severity >= 8 ? '#ef4444' : zone.severity >= 5 ? '#f97316' : '#eab308',
                            fillOpacity: 0.4
                        }}
                    />
                ))}

                {/* Wind Vectors */}
                {showWind && (
                    <WindOverlay bounds={[5, 68, 35, 97]} />
                )}

                {/* SOS Signals - High Priority */}
                {sosSignals.map(sos => (
                    <Marker key={sos.id} position={[sos.lat, sos.lng]} icon={sosIcon} zIndexOffset={1000}>
                        <Popup>
                            <div className="text-gray-900 text-sm font-bold min-w-[200px]">
                                <div className="flex items-center gap-2 text-red-600 mb-2 border-b border-red-200 pb-1">
                                    <Siren className="w-4 h-4" />
                                    <span>ACTIVE SOS SIGNAL</span>
                                </div>
                                <div className="space-y-1">
                                    <p>Type: <span className="uppercase">{sos.type}</span></p>
                                    <p className="text-xs text-gray-500">{new Date(sos.timestamp).toLocaleTimeString()}</p>
                                    <p className="text-xs font-mono text-gray-400 mt-1">ID: {sos.id.slice(0, 8)}</p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}


                {/* Resources with Clustering */}
                {showClusters ? (
                    <MarkerClusterGroup
                        chunkedLoading
                        maxClusterRadius={80}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick={true}
                        iconCreateFunction={(cluster: any) => {
                            const count = cluster.getChildCount();
                            let sizeClass = 'w-10 h-10 text-sm';
                            if (count > 10) {
                                sizeClass = 'w-12 h-12 text-base';
                            }
                            if (count > 50) {
                                sizeClass = 'w-14 h-14 text-lg';
                            }
                            return L.divIcon({
                                html: `<div class="${sizeClass} bg-blue-500 border-4 border-white rounded-full flex items-center justify-center text-white font-bold shadow-lg">${count}</div>`,
                                className: 'custom-cluster-icon',
                                iconSize: L.point(40, 40, true)
                            });
                        }}
                    >
                        {resources
                            .filter(res => {
                                if (allocationPlan?.allocations.some(a => a.resource_id === res.id)) return true;
                                return zones.some(z => getDistance(res.location.lat, res.location.lng, z.location.lat, z.location.lng) <= 200);
                            })
                            .map(res => (
                                <Marker
                                    key={res.id}
                                    position={[res.location.lat, res.location.lng]}
                                    icon={createResourceIcon(res.status, res.type)}
                                >
                                    <Popup>
                                        <div className="text-gray-900 text-xs min-w-[180px]">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                                                <span className="text-lg">{getResourceIcon(res.type)}</span>
                                                <strong className="text-blue-600 font-bold">{res.type}</strong>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Status:</span>
                                                    <span className="font-bold" style={{ color: getResourceStatusColor(res.status) }}>
                                                        {res.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Capacity:</span>
                                                    <span className="font-bold">{res.capacity}</span>
                                                </div>
                                                {res.specialization.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Specialization</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {res.specialization.map(spec => (
                                                                <span key={spec} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                                    {spec}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                    </MarkerClusterGroup>
                ) : (
                    resources
                        .filter(res => {
                            if (allocationPlan?.allocations.some(a => a.resource_id === res.id)) return true;
                            return zones.some(z => getDistance(res.location.lat, res.location.lng, z.location.lat, z.location.lng) <= 200);
                        })
                        .map(res => (
                            <Marker
                                key={res.id}
                                position={[res.location.lat, res.location.lng]}
                                icon={createResourceIcon(res.status, res.type)}
                            >
                                <Popup>
                                    <div className="text-gray-900 text-xs min-w-[180px]">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                                            <span className="text-lg">{getResourceIcon(res.type)}</span>
                                            <strong className="text-blue-600 font-bold">{res.type}</strong>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Status:</span>
                                                <span className="font-bold" style={{ color: getResourceStatusColor(res.status) }}>
                                                    {res.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Capacity:</span>
                                                <span className="font-bold">{res.capacity}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))
                )}

                {/* Disaster Zones with Color Coding */}
                {zones.map(zone => (
                    <Marker
                        key={zone.id}
                        position={[zone.location.lat, zone.location.lng]}
                        icon={createDisasterIcon(zone.severity, zone.type)}
                        zIndexOffset={500}
                    >
                        <Popup>
                            <div className="text-gray-900 text-xs min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b-2" style={{ borderColor: getSeverityColor(zone.severity) }}>
                                    <span className="text-xl">{getDisasterIcon(zone.type)}</span>
                                    <strong className="font-bold" style={{ color: getSeverityColor(zone.severity) }}>
                                        {zone.type}
                                    </strong>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Severity:</span>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getSeverityColor(zone.severity) }}
                                            />
                                            <strong style={{ color: getSeverityColor(zone.severity) }}>
                                                {zone.severity}/10
                                            </strong>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Population:</span>
                                        <strong>{zone.affected_population.toLocaleString()}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Vulnerability:</span>
                                        <strong>{(zone.vulnerability_score * 100).toFixed(0)}%</strong>
                                    </div>
                                </div>
                                <hr className="my-2 border-gray-300" />
                                <div className="text-[10px] uppercase font-bold text-gray-500 mb-1.5">Nearby Resources</div>
                                <div className="space-y-1">
                                    {resources
                                        .map(r => ({ ...r, dist: getDistance(zone.location.lat, zone.location.lng, r.location.lat, r.location.lng) }))
                                        .sort((a, b) => a.dist - b.dist)
                                        .slice(0, 3)
                                        .map(r => (
                                            <div key={r.id} className="flex justify-between items-center text-xs bg-gray-50 px-2 py-1 rounded">
                                                <span className="flex items-center gap-1">
                                                    <span>{getResourceIcon(r.type)}</span>
                                                    <span>{r.type}</span>
                                                </span>
                                                <span className="font-mono font-bold text-blue-600">{r.dist.toFixed(1)}km</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Safe Areas */}
                {showSafeAreas && safeAreas.map(safe => (
                    <Marker key={safe.id} position={[safe.location.lat, safe.location.lng]} icon={safeAreaIcon}>
                        <Popup>
                            <div className="text-gray-900 text-xs text-center">
                                <strong className="text-green-600 font-bold">{safe.type}</strong><br />
                                <span className="text-[10px] text-gray-500">Cap: {safe.capacity}</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Animated Allocation Routes */}
                {showRoutes && allocationPlan && allocationPlan.allocations.map((alloc, idx) => {
                    const res = resources.find(r => r.id === alloc.resource_id);
                    const zone = zones.find(z => z.id === alloc.zone_id);
                    if (!res || !zone) return null;

                    const d = getDistance(res.location.lat, res.location.lng, zone.location.lat, zone.location.lng);
                    // if (d > 250) return null; // Removed check to show all routes

                    return (
                        <Polyline
                            key={idx}
                            positions={[
                                [res.location.lat, res.location.lng],
                                [zone.location.lat, zone.location.lng]
                            ]}
                            pathOptions={{
                                color: '#a855f7',
                                weight: 3,
                                dashArray: '10, 10',
                                opacity: 0.7,
                                className: 'animated-route'
                            }}
                        >
                            <Popup>
                                <div className="text-gray-900 text-xs">
                                    <div className="font-bold text-purple-600 mb-1">Active Dispatch</div>
                                    <div className="text-[10px] space-y-0.5">
                                        <div><strong>Resource:</strong> {res.type}</div>
                                        <div><strong>Target:</strong> {zone.type}</div>
                                        <div><strong>Distance:</strong> {d.toFixed(1)}km</div>
                                        <div><strong>ETA:</strong> {alloc.eta_minutes}min</div>
                                    </div>
                                </div>
                            </Popup>
                        </Polyline>
                    );
                })}
            </MapContainer>

            {/* NDEM-Style Top Right Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <div className="bg-gray-800/90 backdrop-blur-md border border-gray-600 rounded-lg p-1 shadow-xl flex flex-col">
                    <button
                        onClick={() => setMapStyle('dark')}
                        className={`p-2 rounded hover:bg-gray-700 transition flex items-center gap-2 text-xs font-bold ${mapStyle === 'dark' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                        title="Dark Mode"
                    >
                        <MapIcon size={16} /> Dark
                    </button>
                    <button
                        onClick={() => setMapStyle('satellite')}
                        className={`p-2 rounded hover:bg-gray-700 transition flex items-center gap-2 text-xs font-bold ${mapStyle === 'satellite' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                        title="Satellite View"
                    >
                        <Globe size={16} /> Satellite
                    </button>
                </div>

                <div className="bg-gray-800/90 backdrop-blur-md border border-gray-600 rounded-lg p-2 shadow-xl">
                    <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">Overlays</h4>
                    <button
                        onClick={() => setShowWind(!showWind)}
                        className={`w-full text-left p-1.5 rounded transition flex items-center gap-2 text-xs mb-1 ${showWind ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-700'}`}
                    >
                        <Wind size={14} /> Wind Vector
                    </button>
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`w-full text-left p-1.5 rounded transition flex items-center gap-2 text-xs ${showHeatmap ? 'bg-red-900/40 text-red-300 border border-red-500/30' : 'text-gray-400 hover:bg-gray-700'}`}
                    >
                        <Activity size={14} /> Heatmap
                    </button>
                </div>
            </div>

            {/* Bottom Right Legend */}
            <div className="absolute bottom-6 right-6 bg-gray-900/90 p-4 rounded-lg shadow-2xl border border-gray-700 backdrop-blur-md z-[1000] min-w-[150px]">
                <h4 className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={12} /> Legend
                </h4>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-black shadow-sm shadow-blue-500/50"></span>
                        <span className="text-gray-300">Resources</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-black shadow-sm shadow-red-500/50"></span>
                        <span className="text-gray-300">Disasters</span>
                    </div>
                    {showSafeAreas && (
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black shadow-sm shadow-green-500/50"></span>
                            <span className="text-gray-300">Safe Areas</span>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default DisasterMap;
