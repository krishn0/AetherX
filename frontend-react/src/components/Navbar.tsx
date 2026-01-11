
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import EmergencyOverlay from './EmergencyOverlay';

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [emergencyOpen, setEmergencyOpen] = useState(false);
    const location = useLocation();

    // Scroll effect for glassmorphism
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Mission Control', path: '/dashboard' },
        { name: 'Simulation', path: '/simulation' },
        { name: 'Help Desk', path: '/help-desk' },
    ];

    return (
        <>
            <EmergencyOverlay isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />

            <nav
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${scrolled
                    ? 'bg-black/60 backdrop-blur-2xl border-white/10 py-3 shadow-2xl'
                    : 'bg-black/20 backdrop-blur-md border-white/5 py-4'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex justify-between md:grid md:grid-cols-3 items-center">

                    {/* Left: Logo */}
                    <div className="flex justify-start">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:scale-105 transition-transform duration-300">
                                <Zap className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-black tracking-tighter text-white">
                                    AETHER<span className="text-blue-500">X</span>
                                </h1>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold hidden sm:block">
                                    Disaster Response System
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Center: Mission Control Pill */}
                    <div className="hidden md:flex justify-center">
                        {navLinks.map((link) => (
                            <Link key={link.path} to={link.path}>
                                <Button
                                    className={`rounded-full px-8 py-6 text-base font-bold transition-all shadow-xl hover:scale-105 active:scale-95 ${location.pathname === link.path || location.pathname === '/'
                                        ? 'bg-blue-600 text-white shadow-blue-600/25 hover:bg-blue-500 border border-blue-400/20'
                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {link.name}
                                </Button>
                            </Link>
                        ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex justify-end gap-3 items-center">
                        <Button
                            variant="destructive"
                            onClick={() => setEmergencyOpen(true)}
                            className="rounded-full px-4 py-6 font-bold shadow-lg shadow-red-900/20 border border-red-500/20 animate-pulse hover:animate-none gap-2"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span className="hidden sm:inline">EMERGENCY</span>
                        </Button>

                        <Link to="/operation-office" className="hidden md:block">
                            <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-xl rounded-full px-6 py-6 gap-3 group transition-all hover:border-white/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="font-medium tracking-wide">Ops Center</span>
                            </Button>
                        </Link>

                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden p-2 text-white/80 hover:text-white ml-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-900/20 hover:border-blue-500/30 transition-all group"
                            >
                                <span className="text-gray-300 group-hover:text-white font-medium">{link.name}</span>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400" />
                            </Link>
                        ))}
                        <Link to="/operation-office" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-6 text-lg font-bold shadow-lg shadow-red-900/20">
                                Enter Ops Center
                            </Button>
                        </Link>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navbar;
