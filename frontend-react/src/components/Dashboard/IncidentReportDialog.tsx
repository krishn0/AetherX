import { useState } from 'react';
import { X, MapPin, AlertTriangle } from 'lucide-react';
import { submitIncidentReport, type IncidentReport } from '@/lib/api';

interface IncidentReportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function IncidentReportDialog({ isOpen, onClose, onSuccess }: IncidentReportDialogProps) {
    const [formData, setFormData] = useState<Partial<IncidentReport>>({
        type: 'Flood',
        location: { lat: 20.5937, lng: 78.9629, name: '' },
        severity: 5,
        description: '',
        affected_population: 0
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const disasterTypes = [
        'Flood', 'Earthquake', 'Cyclone', 'Landslide',
        'Wildfire', 'Heat Wave', 'Drought', 'Tsunami'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.location?.name) {
            setError('Please enter a location name');
            return;
        }

        if (!formData.description) {
            setError('Please provide a description');
            return;
        }

        setSubmitting(true);

        try {
            await submitIncidentReport(formData as IncidentReport);
            onSuccess?.();
            onClose();
            // Reset form
            setFormData({
                type: 'Flood',
                location: { lat: 20.5937, lng: 78.9629, name: '' },
                severity: 5,
                description: '',
                affected_population: 0
            });
        } catch (err) {
            console.error('Failed to submit report:', err);
            setError('Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-background border border-white/10 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-bold">Report Incident</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Incident Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Incident Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-blue-500"
                            required
                        >
                            {disasterTypes.map(type => (
                                <option key={type} value={type} className="bg-gray-800">{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Location Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location?.name || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                location: { ...formData.location!, name: e.target.value }
                            })}
                            placeholder="e.g., Mumbai, Maharashtra"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium mb-2 text-gray-400">Latitude</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={formData.location?.lat || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    location: { ...formData.location!, lat: parseFloat(e.target.value) }
                                })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-2 text-gray-400">Longitude</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={formData.location?.lng || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    location: { ...formData.location!, lng: parseFloat(e.target.value) }
                                })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Severity */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Severity: <span className="text-blue-400">{formData.severity}/10</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={formData.severity}
                            onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Low</span>
                            <span>Medium</span>
                            <span>High</span>
                            <span>Critical</span>
                        </div>
                    </div>

                    {/* Affected Population */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Affected Population (Optional)</label>
                        <input
                            type="number"
                            value={formData.affected_population || ''}
                            onChange={(e) => setFormData({ ...formData, affected_population: parseInt(e.target.value) || 0 })}
                            placeholder="Estimated number of people affected"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Provide details about the incident..."
                            rows={4}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-blue-500 resize-none"
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
