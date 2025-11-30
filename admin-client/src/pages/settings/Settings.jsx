import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Settings() {
    const [config, setConfig] = useState({
        maintenance_mode: false,
        allow_signups: true,
        admin_ip_whitelist: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:8000/api/admin/config/', {
                headers: { Authorization: `Token ${token}` }
            });
            setConfig(response.data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post('http://localhost:8000/api/admin/config/', config, {
                headers: { Authorization: `Token ${token}` }
            });
            alert('Settings saved successfully');
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, maintenance_mode: !config.maintenance_mode })}
                            className={`${config.maintenance_mode ? 'bg-indigo-600' : 'bg-gray-200'
                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                        >
                            <span
                                className={`${config.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Allow New Signups</label>
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, allow_signups: !config.allow_signups })}
                            className={`${config.allow_signups ? 'bg-indigo-600' : 'bg-gray-200'
                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                        >
                            <span
                                className={`${config.allow_signups ? 'translate-x-5' : 'translate-x-0'
                                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Admin IP Whitelist</label>
                        <p className="text-sm text-gray-500 mb-2">Comma-separated list of allowed IP addresses. Leave empty to allow all.</p>
                        <textarea
                            rows={3}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={config.admin_ip_whitelist}
                            onChange={(e) => setConfig({ ...config, admin_ip_whitelist: e.target.value })}
                            placeholder="192.168.1.1, 10.0.0.1"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
