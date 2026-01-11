import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import RiskChart from "@/components/Dashboard/RiskChart"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Truck, Activity, Users, Shield, Zap, Brain } from "lucide-react"
import { useState, useEffect } from "react"
import { allocateResources, fetchSimulationData } from "@/lib/api"
import type { Resource, DisasterZone, AllocationPlan } from "@/lib/api"

export default function ResourcesPage() {
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<AllocationPlan | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [zones, setZones] = useState<DisasterZone[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchSimulationData();
                setResources(data.resources);
                setZones(data.zones);
            } catch (e) {
                console.error("Failed to load resources", e);
            }
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAllocate = async () => {
        setLoading(true);
        try {
            // Use real data from backend
            const result = await allocateResources(resources, zones);
            setPlan(result);
        } catch (error) {
            console.error("Allocation failed", error);
        } finally {
            setLoading(false);
        }
    };

    const medicalCount = resources.filter(r => r.type === 'Ambulance' || r.type === 'Medical').length;
    const fireCount = resources.filter(r => r.type === 'Fire Truck').length;
    // Police + NDRF + Rescue Teams
    const personnelCount = resources.filter(r => ['Police', 'NDRF Team', 'Rescue Team'].includes(r.type)).length;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden bg-grid dark flex flex-col">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />

            <header className="glass-nav px-6 h-16 flex items-center justify-between shadow-2xl backdrop-blur-2xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Truck className="w-5 h-5 text-blue-400" />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">
                        AETHER<span className="text-blue-500">X</span> <span className="text-white/50 font-light mx-2">|</span> <span className="text-sm tracking-widest text-blue-200">LOGISTICS</span>
                    </h1>
                </div>

                <Link to="/">
                    <Button variant="ghost" size="sm" className="rounded-lg border border-white/10 px-4 hover:bg-blue-500/20">Back to Core</Button>
                </Link>
            </header>

            <main className="flex-1 p-6 md:p-8 relative z-10 max-w-6xl mx-auto w-full">
                <div className="mb-10">
                    <h2 className="text-4xl font-black tracking-tight uppercase">Logistics Matrix</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl">Real-time inventory and deployment status of emergency response assets across all sectors.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <Card className="border-white/10 bg-white/[0.02] hover:border-green-500/50 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Medical Units</CardTitle>
                            <Activity className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-black tracking-tighter">{medicalCount}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Operational & Ready</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/[0.02] hover:border-red-500/50 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fire Response</CardTitle>
                            <Shield className="h-5 w-5 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-black tracking-tighter">{fireCount}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-red-500" />
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Active in Field</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/[0.02] hover:border-blue-500/50 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Personnel</CardTitle>
                            <Users className="h-5 w-5 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-black tracking-tighter">{personnelCount}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Verified On-Duty</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-8">
                    <Card className="border-white/10 bg-white/[0.02] shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Resource Utilization Stream</CardTitle>
                                    <CardDescription>Temporal analysis of asset commitment and depletion rates.</CardDescription>
                                </div>
                                <Zap className="h-5 w-5 text-yellow-500 opacity-30" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <RiskChart />
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/[0.02] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain className="w-24 h-24 text-primary" />
                        </div>
                        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                            <CardTitle className="text-lg text-primary">Autonomous Allocation Engine</CardTitle>
                            <CardDescription>AI-driven resource distribution optimization.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Deploy constraints-based heuristic algorithms to optimize resource assignment across active disaster zones in real-time.
                                </p>
                                <Button
                                    onClick={handleAllocate}
                                    disabled={loading}
                                    className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50"
                                >
                                    {loading ? "Optimizing..." : "Execute AI Allocation Strategy"}
                                    {!loading && <Brain className="ml-2 w-4 h-4" />}
                                </Button>

                                {plan && (
                                    <div className="mt-4 space-y-3 bg-black/20 p-4 rounded-lg border border-white/5">
                                        <div className="flex justify-between items-center text-xs uppercase tracking-wider text-muted-foreground border-b border-white/5 pb-2">
                                            <span>Optimization Result</span>
                                            <span className="text-green-500">{plan.computation_time_ms.toFixed(2)}ms</span>
                                        </div>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                            {plan.allocations.map((alloc, i) => (
                                                <div key={i} className="flex justify-between items-start text-sm">
                                                    <div>
                                                        <span className="font-bold text-white">{alloc.resource_id}</span>
                                                        <span className="text-muted-foreground mx-2">→</span>
                                                        <span className="text-red-400">{alloc.zone_id}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-mono text-green-400">{alloc.eta_minutes}m ETA</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-2 border-t border-white/5 flex gap-4 text-xs">
                                            <div className="text-muted-foreground">Score: <span className="text-white">{plan.total_score}</span></div>
                                            <div className="text-muted-foreground">Allocated: <span className="text-white">{plan.allocations.length}</span></div>
                                            <div className="text-muted-foreground">Unserved: <span className="text-red-500">{plan.unserved_zones.length}</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

