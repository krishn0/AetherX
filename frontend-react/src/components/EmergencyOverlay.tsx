
import React, { useState, useEffect } from 'react';
import { Phone, ShieldAlert, Lock, Siren, X, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { sendSOS } from '../lib/api';

interface EmergencyOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState<'menu' | 'sos-active' | 'panic-active'>('menu');
    const [countDown, setCountDown] = useState(5);
    const [sosSent, setSosSent] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Get location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Fallback to Mumbai if permission denied
                    setLocation({ lat: 19.0760, lng: 72.8777 });
                }
            );
        }
    }, []);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setMode('menu');
            setCountDown(5);
            setSosSent(false);
        }
    }, [isOpen]);

    // Countdown for SOS
    useEffect(() => {
        if (mode === 'sos-active' && countDown > 0) {
            const timer = setTimeout(() => setCountDown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (mode === 'sos-active' && countDown === 0 && !sosSent) {
            // Trigger SOS
            handleSendSOS();
        }
    }, [mode, countDown, sosSent]);

    const handleSendSOS = async () => {
        if (!location) return;
        try {
            await sendSOS(location, "critical");
            setSosSent(true);
        } catch (error) {
            console.error("Failed to send SOS", error);
        }
    };

    const handleQuickDial = (number: string) => {
        window.open(`tel:${number}`);
    };

    if (!isOpen) return null;

    // 3. PANIC MODE (Fake System Lock)
    if (mode === 'panic-active') {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-none">
                <div className="text-center space-y-4 opacity-50">
                    <Lock className="w-16 h-16 text-gray-600 mx-auto" />
                    <h1 className="text-2xl font-mono text-gray-500">TERMINAL LOCKED</h1>
                    <p className="text-sm font-mono text-gray-700">System Update In Progress... (v4.0.2)</p>
                </div>
                {/* Secret Unlock Button Area */}
                <button
                    onClick={() => setMode('menu')}
                    className="absolute bottom-0 right-0 w-20 h-20 opacity-0"
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl animate-in fade-in flex items-center justify-center p-4">
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white p-2">
                <X className="w-8 h-8" />
            </button>

            {mode === 'sos-active' ? (
                // 1. SOS BROADCAST ACTIVE
                <div className="text-center space-y-8 animate-in zoom-in-95">
                    {countDown > 0 ? (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                                <div className="relative bg-red-600 w-48 h-48 rounded-full flex items-center justify-center border-4 border-red-400 shadow-[0_0_100px_rgba(220,38,38,0.5)]">
                                    <span className="text-6xl font-black text-white">{countDown}</span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-red-500 uppercase tracking-widest animate-pulse">Broadcasting Distress Signal</h2>
                            <Button variant="outline" size="lg" onClick={() => setMode('menu')} className="border-white/20 text-white hover:bg-white/10">
                                CANCEL BROADCAST
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <CheckCircle2 className="w-32 h-32 text-green-500 mx-auto" />
                            <h2 className="text-3xl font-bold text-white uppercase">Signal Locked</h2>
                            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl max-w-md mx-auto">
                                <p className="text-red-200">NDRF and Local Response Units have been dispatched to your coordinates.</p>
                                <p className="text-red-200 mt-2 font-mono text-sm">Case ID: #SOS-{Math.floor(Math.random() * 10000)}</p>
                            </div>
                            <Button onClick={onClose} className="bg-white text-black hover:bg-gray-200 font-bold">
                                Close Overlay
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                // MAIN MENU
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Header */}
                    <div className="md:col-span-2 text-center mb-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1 bg-red-900/30 border border-red-500/30 rounded-full mb-4">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            <span className="text-xs uppercase font-bold text-red-400 tracking-widest">Protocol Omega Active</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">Emergency Response</h1>
                    </div>

                    {/* Option 1: SOS Beacon */}
                    <Card
                        className="group bg-red-600 hover:bg-red-500 transition-all cursor-pointer border-none shadow-[0_0_50px_rgba(220,38,38,0.2)] hover:shadow-[0_0_80px_rgba(220,38,38,0.4)] md:col-span-2 p-8 flex items-center justify-between"
                        onClick={() => setMode('sos-active')}
                    >
                        <div className="flex flex-col text-left">
                            <h2 className="text-3xl font-black text-white uppercase italic">Broadcast SOS</h2>
                            <p className="text-red-100/80 mt-1">Instant high-priority beacon to all nearby units.</p>
                        </div>
                        <Siren className="w-20 h-20 text-white animate-pulse" />
                    </Card>

                    {/* Option 2: Quick Dial */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { name: 'Police', number: '100' },
                            { name: 'Ambulance', number: '102' },
                            { name: 'Fire', number: '101' },
                            { name: 'NDRF Control', number: '011-24363260' }
                        ].map((contact, i) => (
                            <Button
                                key={i}
                                variant="secondary"
                                className="h-24 flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border-0 text-white"
                                onClick={() => handleQuickDial(contact.number)}
                            >
                                <Phone className="w-6 h-6 text-blue-400" />
                                <span className="text-lg font-bold">{contact.name} ({contact.number})</span>
                            </Button>
                        ))}
                    </div>

                    {/* Option 3: Panic Mode */}
                    <Card
                        className="group bg-gray-900 hover:bg-gray-800 transition-all cursor-pointer border border-white/10 p-8 flex flex-col items-center justify-center text-center"
                        onClick={() => setMode('panic-active')}
                    >
                        <Lock className="w-12 h-12 text-gray-500 mb-4 group-hover:text-white transition-colors" />
                        <h2 className="text-xl font-bold text-white">Silent Panic Lock</h2>
                        <p className="text-gray-500 text-sm mt-2">Locks terminal and sends silent active shooter beacon.</p>
                    </Card>

                </div>
            )}
        </div>
    );
};

export default EmergencyOverlay;
