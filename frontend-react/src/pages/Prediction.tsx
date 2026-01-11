import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Activity } from "lucide-react"
import { fetchRiskPrediction } from "@/lib/api"
import { Link } from "react-router-dom"

export default function PredictionPage() {
    const [formData, setFormData] = useState({
        disaster_type: "Flood",
        severity_index: 5.0,
        economic_loss_usd: 100000,
        casualties: 0,
        response_time_hours: 12.0
    })
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handlePredict = async () => {
        setLoading(true)
        setResult(null)
        try {
            const res = await fetchRiskPrediction({
                ...formData,
                severity_index: parseFloat(formData.severity_index.toString()),
                economic_loss_usd: parseFloat(formData.economic_loss_usd.toString()),
                casualties: parseInt(formData.casualties.toString()),
                response_time_hours: parseFloat(formData.response_time_hours.toString())
            })
            setResult(res)
        } catch (error) {
            console.error(error)
            alert("Error connecting to prediction API")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden bg-grid dark flex flex-col">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />

            <header className="glass-nav px-6 h-16 flex items-center justify-between shadow-2xl backdrop-blur-2xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">
                        AETHER<span className="text-blue-500">X</span> <span className="text-white/50 font-light mx-2">|</span> <span className="text-sm tracking-widest text-blue-200">PREDICTION</span>
                    </h1>
                </div>

                <Link to="/">
                    <Button variant="ghost" size="sm" className="rounded-lg border border-white/10 px-4 hover:bg-blue-500/20">Back to Core</Button>
                </Link>
            </header>

            <main className="flex-1 p-6 md:p-8 relative z-10 max-w-6xl mx-auto w-full">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-4xl font-black tracking-tight uppercase">Risk Assessment Engine</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl">Deploy neural models to calculate disaster impact probabilities and response optimization vectors.</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                    <Card className="lg:col-span-2 border-white/10 bg-white/[0.02] shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Input Parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disaster Type</label>
                                <select
                                    name="disaster_type"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.disaster_type}
                                    onChange={handleChange}
                                >
                                    <option value="Flood">Flood</option>
                                    <option value="Earthquake">Earthquake</option>
                                    <option value="Hurricane">Hurricane</option>
                                    <option value="Wildfire">Wildfire</option>
                                    <option value="Tornado">Tornado</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Severity Index</label>
                                    <input
                                        type="number" step="0.1" name="severity_index"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        value={formData.severity_index}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Casualties (EST)</label>
                                    <input
                                        type="number" name="casualties"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        value={formData.casualties}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Economic Loss (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">$</span>
                                    <input
                                        type="number" name="economic_loss_usd"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-8 pr-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        value={formData.economic_loss_usd}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Response Window (HRS)</label>
                                <input
                                    type="number" step="0.1" name="response_time_hours"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                                    value={formData.response_time_hours}
                                    onChange={handleChange}
                                />
                            </div>
                            <Button className="w-full py-6 text-sm font-bold uppercase tracking-widest" onClick={handlePredict} disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Computing...
                                    </div>
                                ) : "Execute Neural Analysis"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3 flex flex-col items-center justify-center border-white/10 bg-white/[0.02] shadow-2xl relative overflow-hidden group">
                        {/* Interactive Background for Assessment */}
                        <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${result?.risk_level === 'High' ? 'bg-red-500' :
                            result?.risk_level === 'Medium' ? 'bg-yellow-500' :
                                result?.risk_level === 'Low' ? 'bg-green-500' : 'bg-primary'
                            }`} />

                        <CardHeader className="w-full border-b border-white/5 bg-white/[0.02] z-10">
                            <CardTitle className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">Neural Assessment Output</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-12 text-center w-full z-10">
                            {result ? (
                                <div className="space-y-8 animate-in zoom-in-95 duration-500 w-full">
                                    <div>
                                        <div className={`text-8xl font-black italic tracking-tighter transition-all duration-1000 ${result.risk_level === 'High' ? 'text-red-500 text-glow' :
                                            result.risk_level === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                                            }`}>
                                            {result.risk_level}
                                        </div>
                                        <p className="text-muted-foreground uppercase tracking-[0.3em] font-bold text-xs mt-2">Predicted Threat Level</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 w-full max-w-sm mx-auto p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                                        <div className="space-y-1">
                                            <div className="text-2xl font-black">{(result.confidence_score * 100).toFixed(0)}%</div>
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Confidence</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-2xl font-black text-primary">VALID</div>
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Vector Status</p>
                                        </div>
                                    </div>

                                    <div className="h-1 w-full max-w-md bg-white/5 rounded-full mx-auto overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px] ${result.risk_level === 'High' ? 'bg-red-500 shadow-red-500' :
                                                result.risk_level === 'Medium' ? 'bg-yellow-500 shadow-yellow-500' : 'bg-green-500 shadow-green-500'
                                                }`}
                                            style={{ width: `${(result.confidence_score * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mx-auto animate-pulse">
                                        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold italic">Awaiting Input Vectors</p>
                                        <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">Neural core initialized and ready for computation</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <div className="w-full p-4 border-t border-white/5 bg-white/[0.01] z-10">
                            <div className="flex justify-between items-center text-[8px] font-mono text-muted-foreground/60">
                                <span>KERNEL_ID: RX-8821-VITE</span>
                                <span>MODEL_VERSION: 4.2.0-STABLE</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    )

}
