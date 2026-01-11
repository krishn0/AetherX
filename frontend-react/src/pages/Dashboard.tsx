import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/Navbar"
import { AlertTriangle, Activity, Users, Zap, FileText, Play, Square } from "lucide-react"
import RiskChart from "@/components/Dashboard/RiskChart"
import WeatherWidget from "@/components/Dashboard/WeatherWidget"
import { useEffect, useState } from "react"
import { fetchActiveAlerts, fetchWeather, fetchSimulationData, toggleSimulationMode, getSimulationStatus, fetchSimulationMockData, type WeatherData } from "@/lib/api"
import DisasterMap from "@/components/Dashboard/Map" // Standard import for SPA
import IncidentReportDialog from "@/components/Dashboard/IncidentReportDialog"

export default function Dashboard() {
    const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    // @ts-ignore - setWeather is used, but weather state is not read directly here
    const [, setWeather] = useState<WeatherData | null>(null);
    const [simulationMode, setSimulationMode] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [busyResources, setBusyResources] = useState(0);
    const [totalImpacted, setTotalImpacted] = useState(0);
    const [resourceLoad, setResourceLoad] = useState(0);

    useEffect(() => {
        // Check simulation mode status on mount
        getSimulationStatus().then(status => setSimulationMode(status.enabled));
    }, []);

    useEffect(() => {
        async function loadData() {
            try {
                if (simulationMode) {
                    // Load simulation mock data
                    const mockData = await fetchSimulationMockData();
                    setActiveAlertsCount(mockData.active_alerts);
                    setBusyResources(mockData.resources_active);
                    setTotalImpacted(mockData.total_impacted);
                    setResourceLoad(mockData.resource_load);
                    // Note: feeds are handled separately in FeedList
                } else {
                    // Fetch real data
                    const alerts = await fetchActiveAlerts();
                    const simData = await fetchSimulationData();
                    setActiveAlertsCount(alerts.length + simData.zones.length);

                    // Calculate metrics from real data
                    const impacted = simData.zones.reduce((sum, z) => sum + (z.affected_population || 0), 0);
                    const busy = simData.resources.filter(r => r.status !== 'Available').length;
                    const total = simData.resources.length || 1;

                    setTotalImpacted(impacted);
                    setBusyResources(busy);
                    setResourceLoad(Math.round((busy / total) * 100));
                }

                const weatherData = await fetchWeather();
                setWeather(weatherData);
                setLastUpdate(new Date());
            } catch (e) {
                console.error("Failed to fetch dashboard data", e);
            }
        }

        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [simulationMode]);

    const handleToggleSimulation = async () => {
        try {
            const result = await toggleSimulationMode();
            setSimulationMode(result.enabled);
        } catch (e) {
            console.error('Failed to toggle simulation mode', e);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background relative overflow-hidden bg-grid dark">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 via-background to-background pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

            <Navbar />
            <IncidentReportDialog
                isOpen={showReportDialog}
                onClose={() => setShowReportDialog(false)}
                onSuccess={() => {
                    // Optionally refresh data after successful report
                }}
            />

            {/* Spacer for fixed Navbar */}
            <div className="h-16" />

            <main className="flex-1 p-6 md:p-8 space-y-8 relative z-10 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight">Mission Control</h2>
                        <p className="text-muted-foreground mt-1">Real-time disaster monitoring and response coordination for India.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <button
                            onClick={() => setShowReportDialog(true)}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Report Incident
                        </button>
                        <button
                            onClick={handleToggleSimulation}
                            className={`px-3 py-1.5 border rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${simulationMode
                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {simulationMode ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            {simulationMode ? 'Stop Demo' : 'Demo Mode'}
                        </button>
                        <span className="px-2 py-1 bg-white/5 rounded border border-white/10 text-xs font-mono">COORD: 20.59N, 78.96E</span>
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded flex items-center gap-1 text-xs font-mono">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            SYNC: {lastUpdate.toLocaleTimeString()}
                        </span>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="group hover:border-red-500/50 transition-all duration-500 hover:shadow-red-500/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-red-500 transition-colors">
                                Active Alerts
                            </CardTitle>
                            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">{activeAlertsCount}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-red-500" />
                                <p className="text-[10px] font-medium text-muted-foreground uppercase">High Priority Threats</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="group hover:border-primary/50 transition-all duration-500 hover:shadow-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                Resources Active
                            </CardTitle>
                            <Activity className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">{busyResources}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                                <p className="text-[10px] font-medium text-muted-foreground uppercase">Dispatched Units</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="group hover:border-primary/50 transition-all duration-500 hover:shadow-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                Total Impacted
                            </CardTitle>
                            <Users className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">{(totalImpacted / 1000).toFixed(1)}<span className="text-lg font-normal text-muted-foreground ml-1">k</span></div>
                            <div className="flex items-center gap-2 mt-2 text-red-500">
                                <p className="text-[10px] font-bold uppercase">Real-time Pop. Risk</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="group hover:border-yellow-500/50 transition-all duration-500 hover:shadow-yellow-500/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-yellow-500 transition-colors">
                                Resource Load
                            </CardTitle>
                            <Zap className="h-5 w-5 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">{resourceLoad}<span className="text-lg font-normal text-muted-foreground ml-1">%</span></div>
                            <div className="w-full bg-white/5 rounded-full h-1 mt-4 overflow-hidden">
                                <div className="bg-yellow-500 h-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" style={{ width: `${resourceLoad}%` }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 h-[600px]">
                    <Card className="lg:col-span-4 overflow-hidden group h-full flex flex-col">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02] shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">India Monitoring Layer</CardTitle>
                                    <CardDescription>Live telemetry from satellites, USGS, and ground units.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    <span className="text-[10px] font-mono opacity-50 uppercase tracking-tighter">Live Feed</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 relative min-h-0">
                            <DisasterMap />
                            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                <div className="bg-background/80 backdrop-blur-md p-2 rounded-lg border border-white/10 text-[10px] font-mono">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">LAT</span>
                                        <span className="text-primary font-bold">20.0003N</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">LNG</span>
                                        <span className="text-primary font-bold">0.0000E</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-3 flex flex-col gap-6 h-full">
                        {/* Risk Chart */}
                        <Card className="flex-1">
                            <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4">
                                <CardTitle className="text-sm">Predictive Risk Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 h-[250px] w-full">
                                <RiskChart />
                            </CardContent>
                        </Card>

                        {/* Weather Widget */}
                        <WeatherWidget />

                        {/* Live Feed List */}
                        <FeedList />
                    </div>
                </div>
            </main>
        </div>
    )

}

function FeedList() {
    const [feeds, setFeeds] = useState<import("@/lib/api").DisasterFeedItem[]>([]);

    useEffect(() => {
        // Poll for feeds every 5 seconds to ensure admin sees "first"
        const load = async () => {
            try {
                const api = await import("@/lib/api");
                const data = await api.fetchDisasterFeeds();
                setFeeds(data);
            } catch (e) {
                console.error("Feed poll failed", e);
            }
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Incoming Reports</CardTitle>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Real-time</span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="divide-y divide-white/5">
                    {feeds.map(feed => (
                        <div key={feed.id} className="p-4 flex items-start gap-3 hover:bg-white/5 transition-colors">
                            <div className={`mt-1 w-2 h-2 rounded-full ${feed.severity === 'Critical' ? 'bg-red-500 animate-pulse' :
                                feed.severity === 'High' ? 'bg-orange-500' :
                                    'bg-blue-500'
                                }`} />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">{feed.type}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">{feed.severity}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">Reported in <span className="text-white/80">{feed.location}</span></p>
                                <p className="text-[10px] text-muted-foreground/50 mt-1">{new Date(feed.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                    {feeds.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No active reports</div>}
                </div>
            </CardContent>
        </Card>
    );
}
