/**
 * useSystemHealth Hook - Uses ONLY REAL backend data
 * Fetches actual system metrics from the server via API
 */
import { useState, useEffect } from 'react';
import api from '../api';

export const useSystemHealth = () => {
    const [metrics, setMetrics] = useState({
        cpu: 0,
        memory: 0,
        disk: 0,
        uptime: 0
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await api.get(
                    '/api/admin/monitoring/health/'
                );

                const newData = {
                    cpu: response.data.cpu || 0,
                    memory: response.data.memory || 0,
                    disk: response.data.disk || 0,
                    uptime: response.data.uptime || 0,
                    timestamp: new Date().toISOString() // Add local timestamp for chart
                };

                setMetrics(newData);

                // Update history (keep last 60 points = 5 minutes at 5s interval)
                setHistory(prev => {
                    const newHistory = [...prev, newData];
                    return newHistory.slice(-60);
                });

                setError(null);
            } catch (err) {
                console.error('Failed to fetch system metrics:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchMetrics();

        // Refresh every 5 seconds for real-time updates
        const interval = setInterval(fetchMetrics, 5000);

        return () => clearInterval(interval);
    }, []);

    return { metrics, history, loading, error };
};
