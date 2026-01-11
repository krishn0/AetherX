import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface WeatherData {
    temperature: number;
    humidity: number;
    wind_speed: number;
    condition: string;
}

export interface DisasterFeedItem {
    id: string;
    type: string;
    location: string;
    severity: string;
    timestamp: string;
    affected_population?: number;
}

export interface Alert {
    id: string;
    level: string;
    message: string;
    timestamp: string;
    active: boolean;
}

export interface PredictionRequest {
    severity_index: number;
    economic_loss_usd: number;
    casualties: number;
    response_time_hours: number;
    disaster_type: string;
}

export interface PredictionResponse {
    risk_level: number;
    confidence_score: number;
}

export interface ChatResponse {
    reply: string;
    context: string;
    detected_language?: string;
}

export interface ContextualSuggestion {
    suggestion: string;
    action: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    icon: string;
}

export interface SuggestionsRequest {
    zones_count: number;
    critical_zones_count: number;
    available_resources: number;
    total_resources: number;
    language?: string;
}

export interface QuickCommandRequest {
    command: string;
    args?: string[];
    language?: string;
}

export interface QuickCommandResponse {
    success: boolean;
    message: string;
    action?: string;
}

export const fetchWeather = async (location: string = "Global"): Promise<WeatherData> => {
    const response = await api.get<WeatherData>(`/monitor/weather?location=${location}`);
    return response.data;
};

export interface NewsItem {
    title: string;
    link: string;
    source: string;
    published: string;
}

export const fetchDisasterNews = async (): Promise<NewsItem[]> => {
    const response = await api.get<NewsItem[]>('/monitor/news');
    return response.data;
};

export const fetchDisasterFeeds = async (): Promise<DisasterFeedItem[]> => {
    const response = await api.get<DisasterFeedItem[]>('/monitor/feeds');
    return response.data;
};

export const fetchActiveAlerts = async (): Promise<Alert[]> => {
    const response = await api.get<Alert[]>('/monitor/alerts');
    return response.data;
};

export interface DisasterCreate {
    type: string;
    location: Location;
    severity: string;
}

export const createDisaster = async (data: DisasterCreate): Promise<{ message: string; zone: DisasterZone }> => {
    const response = await api.post<{ message: string; zone: DisasterZone }>('/resources/disaster', data);
    return response.data;
};

export const fetchRiskPrediction = async (data: PredictionRequest): Promise<PredictionResponse> => {
    const response = await api.post<PredictionResponse>('/predict_risk', data);
    return response.data;
};

export interface ForecastResponse {
    predicted_count: number;
}

export const fetchForecast = async (year: number, month: number): Promise<ForecastResponse> => {
    const response = await api.post<ForecastResponse>('/forecast', { year, month });
    return response.data;
};

export const sendChatMessage = async (
    message: string,
    userId: string = "user-1",
    language?: string,
    mapContext?: {
        zones_count: number;
        critical_zones: number;
        available_resources: number;
        total_resources: number;
    }
): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chatbot/message', {
        message,
        user_id: userId,
        language,
        map_context: mapContext
    });
    return response.data;
};

export const fetchContextualSuggestions = async (request: SuggestionsRequest): Promise<ContextualSuggestion[]> => {
    const response = await api.post<{ suggestions: ContextualSuggestion[] }>('/chatbot/suggestions', request);
    return response.data.suggestions;
};

export const processQuickCommand = async (request: QuickCommandRequest): Promise<QuickCommandResponse> => {
    const response = await api.post<QuickCommandResponse>('/chatbot/command', request);
    return response.data;
};

// --- Resource Allocation Types ---

export interface Location {
    lat: number;
    lng: number;
}

export interface Resource {
    id: string;
    type: string;
    location: Location;
    capacity: number;
    status: string;
    specialization: string[];
    speed_kmh: number;
}

export interface DisasterZone {
    id: string;
    type: string;
    severity: number;
    location: Location;
    affected_population: number;
    vulnerability_score: number;
    required_resources: Record<string, number>;
    status?: string; // "Active", "Processing", "Resolved"
}

export interface Allocation {
    resource_id: string;
    zone_id: string;
    eta_minutes: number;
    distance_km: number;
    explanation: string;
}

export interface AllocationPlan {
    allocations: Allocation[];
    unallocated_resources: string[];
    unserved_zones: string[];
    total_score: number;
    computation_time_ms: number;
    ai_rationale?: string;
}

export const allocateResources = async (resources: Resource[], zones: DisasterZone[]): Promise<AllocationPlan> => {
    const response = await api.post<AllocationPlan>('/resources/allocate', { resources, zones });
    return response.data;
};

// --- Operation Office API ---

export interface SimulationData {
    resources: Resource[];
    zones: DisasterZone[];
}

export interface SafeArea {
    id: string;
    location: Location;
    capacity: number;
    type: string;
}

export const fetchSimulationData = async (): Promise<SimulationData> => {
    const response = await api.get<SimulationData>('/resources/simulation_data');
    return response.data;
};

export const fetchSafeAreas = async (): Promise<SafeArea[]> => {
    const response = await api.get<SafeArea[]>('/resources/safe_areas');
    return response.data;
};

export interface ResourceCreate {
    type: string;
    location: Location;
    capacity: number;
    specialization?: string[];
}

export const createResource = async (data: ResourceCreate): Promise<any> => {
    const response = await api.post('/resources/resource', data);
    return response.data;
};

export const dispatchResources = async (plan: AllocationPlan): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>('/resources/dispatch', plan);
    return response.data;
};


export const requestReinforcements = async (zoneIds: string[]): Promise<{ message: string; added_count: number }> => {
    const response = await api.post<{ message: string; added_count: number }>('/resources/reinforce', { zone_ids: zoneIds });
    return response.data;
};

// --- SOS System API ---

export interface SOSSignal {
    id: string;
    lat: number;
    lng: number;
    type: string;
    timestamp: string;
    status: string;
}

export const sendSOS = async (location: Location, type: string = "medical"): Promise<{ message: string; id: string }> => {
    const response = await api.post<{ message: string; id: string }>('/monitor/sos', {
        id: "",
        lat: location.lat,
        lng: location.lng,
        type: type,
        timestamp: new Date().toISOString(),
        status: "active"
    });
    return response.data;
};

export const fetchSOSSignals = async (): Promise<SOSSignal[]> => {
    const response = await api.get<SOSSignal[]>('/monitor/sos');
    return response.data;
};

export const resolveSOS = async (signalId: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/monitor/sos/${signalId}/resolve`);
    return response.data;
};

export const deleteResource = async (resourceId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/resources/resource/${resourceId}`);
    return response.data;
};

export const deleteDisaster = async (zoneId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/resources/disaster/${zoneId}`);
    return response.data;
};

export const startSimulation = async (): Promise<{ message: string; resources_count: number; zones_count: number }> => {
    const response = await api.post<{ message: string; resources_count: number; zones_count: number }>('/resources/simulation/start');
    return response.data;
};

// --- Simulation Mode API ---

export interface SimulationData {
    active_alerts: number;
    resources_active: number;
    total_impacted: number;
    resource_load: number;
    disaster_feeds: DisasterFeedItem[];
}

export const toggleSimulationMode = async (): Promise<{ message: string; enabled: boolean }> => {
    const response = await api.post<{ message: string; enabled: boolean }>('/monitor/simulation/toggle');
    return response.data;
};

export const getSimulationStatus = async (): Promise<{ enabled: boolean }> => {
    const response = await api.get<{ enabled: boolean }>('/monitor/simulation/status');
    return response.data;
};

export const fetchSimulationMockData = async (): Promise<SimulationData> => {
    const response = await api.get<SimulationData>('/monitor/simulation/data');
    return response.data;
};

// --- Manual Incident Reporting ---

export interface IncidentReport {
    type: string;
    location: {
        lat: number;
        lng: number;
        name: string;
    };
    severity: number; // 1-10
    description: string;
    affected_population?: number;
}

export const submitIncidentReport = async (report: IncidentReport): Promise<{ message: string; id: string }> => {
    const response = await api.post<{ message: string; id: string }>('/resources/incident/report', report);
    return response.data;
};

export const deleteResourcesBulk = async (resourceIds: string[]): Promise<{ message: string; deleted_count: number }> => {
    const response = await api.post<{ message: string; deleted_count: number }>('/resources/resource/bulk_delete', { resource_ids: resourceIds });
    return response.data;
};

export default api;

