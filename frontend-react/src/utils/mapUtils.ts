import type { DisasterZone } from '../lib/api';
import type { LatLngExpression } from 'leaflet';

/**
 * Get color based on disaster severity
 */
export function getSeverityColor(severity: number): string {
    if (severity >= 8) return '#ef4444'; // Critical - Red
    if (severity >= 5) return '#f97316'; // High - Orange
    if (severity >= 3) return '#eab308'; // Medium - Yellow
    return '#22c55e'; // Low - Green
}

/**
 * Get severity label
 */
export function getSeverityLabel(severity: number): string {
    if (severity >= 8) return 'Critical';
    if (severity >= 5) return 'High';
    if (severity >= 3) return 'Medium';
    return 'Low';
}

/**
 * Get resource status color
 */
export function getResourceStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'available':
            return '#22c55e'; // Green
        case 'deployed':
            return '#ef4444'; // Red
        case 'returning':
            return '#eab308'; // Yellow
        case 'en route':
            return '#3b82f6'; // Blue
        default:
            return '#6b7280'; // Gray
    }
}

/**
 * Generate heatmap data from disaster zones
 */
export function generateHeatmapData(zones: DisasterZone[]): [number, number, number][] {
    return zones.map(zone => {
        const intensity = (zone.severity / 10) * (zone.affected_population / 10000);
        return [zone.location.lat, zone.location.lng, Math.min(intensity, 1)];
    });
}

/**
 * Calculate simple route points between two locations
 * For production, use a routing API like Mapbox or Google Maps
 */
export function calculateRoutePoints(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
): LatLngExpression[] {
    // Simple straight line with slight curve for visual appeal
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;

    // Add slight offset to create curved line
    const offset = 0.05;
    const curveLat = midLat + offset;
    const curveLng = midLng + offset;

    return [
        [from.lat, from.lng],
        [curveLat, curveLng],
        [to.lat, to.lng]
    ];
}

/**
 * Group nearby resources for clustering
 */
export function shouldClusterResources(zoomLevel: number): boolean {
    return zoomLevel < 12;
}

/**
 * Get marker size based on zoom level
 */
export function getMarkerSize(zoomLevel: number): number {
    if (zoomLevel >= 13) return 40;
    if (zoomLevel >= 10) return 32;
    return 24;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
}

/**
 * Format ETA for display
 */
export function formatETA(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
}

/**
 * Get resource type icon emoji
 */
export function getResourceIcon(type: string): string {
    const icons: Record<string, string> = {
        'Ambulance': '🚑',
        'Helicopter': '🚁',
        'Fire Truck': '🚒',
        'Police': '🚓',
        'Rescue Team': '⛑️',
        'NDRF Team': '🦺',
        'Supply Truck': '🚚',
        'Medical Team': '⚕️'
    };
    return icons[type] || '📍';
}

/**
 * Get disaster type icon emoji
 */
export function getDisasterIcon(type: string): string {
    const icons: Record<string, string> = {
        'Flood': '🌊',
        'Earthquake': '🏚️',
        'Wildfire': '🔥',
        'Cyclone': '🌀',
        'Heat Wave': '🌡️',
        'Landslide': '⛰️'
    };
    return icons[type] || '⚠️';
}
