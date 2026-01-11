import { useEffect, useState } from 'react';
import { fetchWeather, type WeatherData } from '@/lib/api';
import { Cloud, Wind, Droplets, Sun, CloudRain, CloudSnow, RefreshCw, AlertCircle } from 'lucide-react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

const CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedWeather {
    data: WeatherData;
    timestamp: number;
    city: string;
}

const WeatherWidget = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [city, setCity] = useState('Mumbai');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const cities = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore', 'Hyderabad', 'Pune', 'Ahmedabad'];

    useEffect(() => {
        loadWeather();
        // Auto-refresh every 5 minutes
        const interval = setInterval(loadWeather, 300000);
        return () => clearInterval(interval);
    }, [city]);

    const getCachedWeather = (): WeatherData | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsedCache: CachedWeather = JSON.parse(cached);
                const now = Date.now();
                if (parsedCache.city === city && now - parsedCache.timestamp < CACHE_DURATION) {
                    setLastUpdated(new Date(parsedCache.timestamp));
                    return parsedCache.data;
                }
            }
        } catch (e) {
            console.error('Failed to read cache', e);
        }
        return null;
    };

    const setCachedWeather = (data: WeatherData) => {
        try {
            const cacheData: CachedWeather = {
                data,
                timestamp: Date.now(),
                city
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
            console.error('Failed to write cache', e);
        }
    };

    const loadWeather = async () => {
        // Try to load from cache first
        const cachedData = getCachedWeather();
        if (cachedData) {
            setWeather(cachedData);
            setError(null);
            setLoading(false);
        } else {
            setLoading(true);
        }

        try {
            const data = await fetchWeather(city);
            setWeather(data);
            setCachedWeather(data);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            console.error('Failed to load weather', err);
            setError('Failed to fetch weather data');
            // If we have cached data, keep showing it
            if (!cachedData) {
                setWeather(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIcon = (condition: string) => {
        const cond = condition.toLowerCase();
        if (cond.includes('rain') || cond.includes('storm')) return <CloudRain className="w-8 h-8 text-blue-400" />;
        if (cond.includes('cloud')) return <Cloud className="w-8 h-8 text-gray-400" />;
        if (cond.includes('snow')) return <CloudSnow className="w-8 h-8 text-blue-200" />;
        return <Sun className="w-8 h-8 text-yellow-400" />;
    };

    return (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Weather</h3>
                <div className="flex items-center gap-2">
                    <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                    >
                        {cities.map(c => (
                            <option key={c} value={c} className="bg-gray-800">{c}</option>
                        ))}
                    </select>
                    {!loading && (
                        <button
                            onClick={loadWeather}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Refresh weather"
                        >
                            <RefreshCw className="w-3 h-3 text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {loading && !weather ? (
                <SkeletonLoader variant="weather" />
            ) : error && !weather ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-red-400 py-4">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-xs">Unable to load weather</span>
                    </div>
                    <button
                        onClick={loadWeather}
                        className="w-full py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-xs transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : weather ? (
                <div className="space-y-3">
                    {error && (
                        <div className="flex items-center gap-1 text-yellow-400 text-[10px]">
                            <AlertCircle className="w-3 h-3" />
                            <span>Showing cached data</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getWeatherIcon(weather.condition)}
                            <div>
                                <div className="text-3xl font-bold">{Math.round(weather.temperature)}°C</div>
                                <div className="text-xs text-gray-400 capitalize">{weather.condition}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs">
                            <Wind className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Wind:</span>
                            <span className="font-semibold">{Math.round(weather.wind_speed)} km/h</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <Droplets className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Humidity:</span>
                            <span className="font-semibold">{Math.round(weather.humidity)}%</span>
                        </div>
                    </div>

                    <div className="text-[10px] text-gray-500 text-right">
                        Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
                    </div>
                </div>
            ) : (
                <div className="text-xs text-gray-500 text-center py-4">No data available</div>
            )}
        </div>
    );
};

export default WeatherWidget;

