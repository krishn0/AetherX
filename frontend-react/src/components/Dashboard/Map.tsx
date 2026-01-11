import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useState } from "react"

import { fetchDisasterFeeds, fetchSimulationData, type DisasterFeedItem, type Resource, type DisasterZone } from "@/lib/api"

// Fix Leaflet Icon issue in React/Vite
// (Icon unused, using default imports if specific needs arise)

// Custom icons for different disaster types
const createCustomIcon = (color: string) => L.divIcon({
    className: 'custom-disaster-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Helper for Indian state/city coordinates
const getLocationCoords = (loc: string): [number, number] => {
    // Indian states and cities
    const coords: Record<string, [number, number]> = {
        // States
        "Kerala": [10.8505, 76.2711],
        "Maharashtra": [19.7515, 75.7139],
        "Uttarakhand": [30.0668, 79.0193],
        "Gujarat": [22.2587, 71.1924],
        "West Bengal": [22.9868, 87.8550],
        "Odisha": [20.9517, 85.0985],
        "Tamil Nadu": [11.1271, 78.6569],
        "Assam": [26.2006, 92.9376],

        // Cities
        "Mumbai": [19.0760, 72.8777],
        "Delhi": [28.7041, 77.1025],
        "Kolkata": [22.5726, 88.3639],
        "Chennai": [13.0827, 80.2707],
        "Bangalore": [12.9716, 77.5946],
        "Hyderabad": [17.3850, 78.4867],
        "Pune": [18.5204, 73.8567],
        "Ahmedabad": [23.0225, 72.5714],

        // Generic India region (for USGS data with "India Region" location)
        "India Region": [20.5937, 78.9629],
        "India": [20.5937, 78.9629],
    };

    // Check if location contains coordinates (e.g., "India (28.12, 77.45)")
    const coordMatch = loc.match(/\(([0-9.-]+),\s*([0-9.-]+)\)/);
    if (coordMatch) {
        return [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
    }

    // Check for partial matches (e.g., "50 km NE of Mumbai")
    for (const [key, value] of Object.entries(coords)) {
        if (loc.includes(key)) {
            return value;
        }
    }

    // Default to center of India
    return [20.5937, 78.9629];
}

// Get icon color based on disaster type
const getDisasterIcon = (_type: string, severity: string) => {
    const severityColors: Record<string, string> = {
        "Critical": "#dc2626",
        "High": "#ea580c",
        "Medium": "#f59e0b",
        "Low": "#3b82f6"
    };
    return createCustomIcon(severityColors[severity] || "#3b82f6");
};

export default function DisasterMap() {
    const [feeds, setFeeds] = useState<DisasterFeedItem[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [zones, setZones] = useState<DisasterZone[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                // Load Feeds
                const feedData = await fetchDisasterFeeds();
                setFeeds(feedData);

                // Load Resources & Zones for Proximity Display
                const simData = await fetchSimulationData();
                setResources(simData.resources);
                setZones(simData.zones);
            } catch (error) {
                console.error("Failed to load map data", error);
            }
        }

        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Center on India
    const position: [number, number] = [20.5937, 78.9629];

    // Resource Icon Helper
    const getResourceIcon = (_type: string) => createCustomIcon('#3b82f6');

    return (
        <div className="h-full w-full min-h-[400px] rounded-md overflow-hidden border z-0 relative">
            <MapContainer center={position} zoom={5} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Resources (Filtered: Show if within 100km of ANY active disaster feed OR injected zone) */}
                {resources.map(res => (
                    <Marker
                        key={res.id}
                        position={[res.location.lat, res.location.lng]}
                        icon={getResourceIcon(res.type)}
                    >
                        <Popup>
                            <div className="p-2">
                                <h3 className="font-bold">{res.type}</h3>
                                <p>Status: {res.status}</p>
                                <p>Capacity: {res.capacity}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Dashboard Feeds (External) */}
                {feeds.map((feed) => {
                    const coords = getLocationCoords(feed.location);
                    const severityRadius = {
                        "Critical": 100000,
                        "High": 75000,
                        "Medium": 50000,
                        "Low": 25000
                    }[feed.severity] || 25000;

                    return (
                        <div key={feed.id}>
                            <Marker position={coords} icon={getDisasterIcon(feed.type, feed.severity)}>
                                <Popup>
                                    <div className="text-gray-900">
                                        <strong className="text-lg">{feed.type}</strong> <br />
                                        <span className="text-sm">{feed.location}</span> <br />
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${feed.severity === 'Critical' ? 'bg-red-500 text-white' :
                                            feed.severity === 'High' ? 'bg-orange-500 text-white' :
                                                feed.severity === 'Medium' ? 'bg-yellow-500 text-white' :
                                                    'bg-blue-500 text-white'
                                            }`}>
                                            {feed.severity}
                                        </span> <br />
                                        <span className="text-xs text-gray-600 mt-1 block">{new Date(feed.timestamp).toLocaleString()}</span>
                                    </div>
                                </Popup>
                            </Marker>
                            <Circle
                                center={coords}
                                radius={severityRadius}
                                pathOptions={{ color: 'transparent', fillColor: 'transparent' }} // Simplified loop for circle, styling handled in next loop or merged if needed but keeping structure simple to minimize heavy diff
                            />
                            <Circle
                                center={coords}
                                radius={severityRadius}
                                pathOptions={{
                                    color: feed.severity === 'Critical' ? '#dc2626' :
                                        feed.severity === 'High' ? '#ea580c' :
                                            feed.severity === 'Medium' ? '#f59e0b' : '#3b82f6',
                                    fillColor: feed.severity === 'Critical' ? '#dc2626' :
                                        feed.severity === 'High' ? '#ea580c' :
                                            feed.severity === 'Medium' ? '#f59e0b' : '#3b82f6',
                                    fillOpacity: 0.1,
                                    weight: 2,
                                    opacity: 0.5
                                }}
                            />
                        </div>
                    );
                })}

                {/* Simulation Zones (Injected) */}
                {zones.map((zone) => (
                    <div key={zone.id}>
                        <Marker position={[zone.location.lat, zone.location.lng]} icon={getDisasterIcon(zone.type, 'Critical')}>
                            <Popup>
                                <div className="text-gray-900">
                                    <strong className="text-lg">{zone.type}</strong> (Simulation)<br />
                                    <span className="text-sm">Pop: {zone.affected_population?.toLocaleString()}</span> <br />
                                    <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold mt-1 inline-block">
                                        Severity: {zone.severity}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                        <Circle
                            center={[zone.location.lat, zone.location.lng]}
                            radius={zone.severity * 10000} // e.g. 5 * 10km = 50km
                            pathOptions={{
                                color: '#dc2626',
                                fillColor: '#dc2626',
                                fillOpacity: 0.2,
                                weight: 2
                            }}
                        />
                    </div>
                ))}
            </MapContainer>
        </div>
    )
}
