import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Activity, Zap } from "lucide-react"
import { sendChatMessage } from "@/lib/api"
import { Link } from "react-router-dom"

export default function CitizenPage() {
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([
        { role: 'bot', content: 'Hello! I am AetherX AI. How can I help you stay safe today?' }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSend = async () => {
        if (!input.trim() || loading) return
        const userMsg = input
        setInput("")
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setLoading(true)

        try {
            const response = await sendChatMessage(userMsg);
            setMessages(prev => [...prev, { role: 'bot', content: response.reply }])
        } catch (error) {
            console.error("Chat error", error)
            setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I am having trouble connecting to the server." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden bg-grid dark flex flex-col">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />

            <header className="glass-nav px-6 h-16 flex items-center justify-between shadow-2xl backdrop-blur-2xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">
                        AETHER<span className="text-blue-500">X</span> <span className="text-white/50 font-light mx-2">|</span> <span className="text-sm tracking-widest text-blue-200">CITIZEN</span>
                    </h1>
                </div>

                <Link to="/">
                    <Button variant="ghost" size="sm" className="rounded-lg border border-white/10 px-4 hover:bg-blue-500/20">Exit Terminal</Button>
                </Link>
            </header>

            <main className="flex-1 flex flex-col p-6 md:p-8 relative z-10 max-w-4xl mx-auto w-full overflow-hidden">
                <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tight uppercase">AI Safety Node</h2>
                    <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-widest">Connected to AetherX Core Prediction Engine</p>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden border-white/10 bg-white/[0.02] shadow-2xl rounded-2xl">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02] px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <Activity className="w-5 h-5 text-primary animate-pulse" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold">AetherX Neural Assistant</CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">Status: Processing optimized response vectors</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col gap-6 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`group relative rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-xl transition-all ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 backdrop-blur-md rounded-tl-none'
                                    }`}>
                                    {m.content}
                                    <div className={`absolute top-0 ${m.role === 'user' ? '-right-2 border-l-primary' : '-left-2 border-r-white/5'} border-t-8 border-t-transparent border-b-8 border-b-transparent`} />
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <div className="p-4 bg-white/[0.02] border-t border-white/5">
                        <div className="relative flex items-center gap-2 max-w-2xl mx-auto">
                            <input
                                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                                placeholder="Query neural assistant for safety protocols..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={loading}
                                size="icon"
                                className={`w-12 h-12 rounded-xl transition-all shadow-lg ${input.trim() ? 'bg-blue-600 scale-100 opacity-100' : 'bg-white/5 scale-90 opacity-50'}`}
                            >
                                <Zap className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                        <p className="text-center text-[9px] text-muted-foreground/40 mt-3 uppercase tracking-[0.2em]">Neural response may vary based on local telemetry</p>
                    </div>
                </Card>
            </main>
        </div>
    )

}
