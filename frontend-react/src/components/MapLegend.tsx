import React from 'react';
import { Layers, MapPin, Navigation, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { getSeverityColor, getResourceIcon, getDisasterIcon } from '../utils/mapUtils';

interface MapLegendProps {
    showSafeAreas: boolean;
    showHeatmap: boolean;
    showClusters: boolean;
    showRoutes: boolean;
    onToggleSafeAreas: () => void;
    onToggleHeatmap: () => void;
    onToggleClusters: () => void;
    onToggleRoutes: () => void;
    stats?: {
        totalResources: number;
        availableResources: number;
        activeZones: number;
        criticalZones: number;
    };
}

const MapLegend: React.FC<MapLegendProps> = ({
    showSafeAreas,
    showHeatmap,
    showClusters,
    showRoutes,
    onToggleSafeAreas,
    onToggleHeatmap,
    onToggleClusters,
    onToggleRoutes,
    stats
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div className="absolute bottom-6 left-6 z-[1000] bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden max-w-xs">
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-white/10 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">Map Legend</span>
                </div>
                {isExpanded ? (
                    <Eye className="w-4 h-4 text-gray-400" />
                ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                )}
            </div>

            {isExpanded && (
                <div className="p-3 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Stats */}
                    {stats && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Statistics</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/5 p-2 rounded">
                                    <div className="text-gray-400">Resources</div>
                                    <div className="text-white font-bold">{stats.availableResources}/{stats.totalResources}</div>
                                </div>
                                <div className="bg-white/5 p-2 rounded">
                                    <div className="text-gray-400">Active Zones</div>
                                    <div className="text-white font-bold">{stats.activeZones}</div>
                                </div>
                                <div className="bg-white/5 p-2 rounded col-span-2">
                                    <div className="text-gray-400">Critical Zones</div>
                                    <div className="text-red-400 font-bold">{stats.criticalZones}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Zone Severity */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Zone Severity
                        </h4>
                        <div className="space-y-1.5">
                            {[
                                { label: 'Critical', severity: 9, range: '8-10' },
                                { label: 'High', severity: 6, range: '5-7' },
                                { label: 'Medium', severity: 4, range: '3-4' },
                                { label: 'Low', severity: 2, range: '1-2' }
                            ].map(({ label, severity, range }) => (
                                <div key={label} className="flex items-center gap-2 text-xs">
                                    <div
                                        className="w-4 h-4 rounded-full border-2 border-white/30"
                                        style={{ backgroundColor: getSeverityColor(severity) }}
                                    />
                                    <span className="text-gray-300">{label}</span>
                                    <span className="text-gray-500 text-[10px]">({range})</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resource Status */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Resource Status
                        </h4>
                        <div className="space-y-1.5">
                            {[
                                { label: 'Available', color: '#22c55e' },
                                { label: 'Deployed', color: '#ef4444' },
                                { label: 'En Route', color: '#3b82f6' },
                                { label: 'Returning', color: '#eab308' }
                            ].map(({ label, color }) => (
                                <div key={label} className="flex items-center gap-2 text-xs">
                                    <div
                                        className="w-3 h-3 rounded-sm border border-white/30"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-gray-300">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resource Types */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            Resource Types
                        </h4>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {['Ambulance', 'Helicopter', 'Fire Truck', 'Police', 'NDRF Team', 'Rescue Team'].map(type => (
                                <div key={type} className="flex items-center gap-1.5 text-gray-300">
                                    <span>{getResourceIcon(type)}</span>
                                    <span className="truncate">{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disaster Types */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Disaster Types</h4>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {['Flood', 'Earthquake', 'Wildfire', 'Cyclone', 'Heat Wave'].map(type => (
                                <div key={type} className="flex items-center gap-1.5 text-gray-300">
                                    <span>{getDisasterIcon(type)}</span>
                                    <span className="truncate">{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Layer Controls */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Layer Controls
                        </h4>
                        <div className="space-y-1.5">
                            <LayerToggle
                                label="Safe Areas"
                                enabled={showSafeAreas}
                                onToggle={onToggleSafeAreas}
                                icon="🏥"
                            />
                            <LayerToggle
                                label="Heat Map"
                                enabled={showHeatmap}
                                onToggle={onToggleHeatmap}
                                icon="🔥"
                            />
                            <LayerToggle
                                label="Clustering"
                                enabled={showClusters}
                                onToggle={onToggleClusters}
                                icon="📍"
                            />
                            <LayerToggle
                                label="Routes"
                                enabled={showRoutes}
                                onToggle={onToggleRoutes}
                                icon="🛣️"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface LayerToggleProps {
    label: string;
    enabled: boolean;
    onToggle: () => void;
    icon: string;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ label, enabled, onToggle, icon }) => (
    <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-all ${enabled
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
            }`}
    >
        <div className="flex items-center gap-2">
            <span>{icon}</span>
            <span className="font-medium">{label}</span>
        </div>
        <div className={`w-8 h-4 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-600'} relative`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
    </button>
);

export default MapLegend;
