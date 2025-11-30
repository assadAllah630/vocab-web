/**
 * Permission context for admin panel RBAC
 */
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
    const [permissions, setPermissions] = useState([]);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:8000/api/admin/auth/me/', {
                headers: { Authorization: `Token ${token}` }
            });

            setPermissions(response.data.permissions || []);
            setRole(response.data.role);
        } catch (error) {
            console.error('Failed to fetch permissions', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (permission) => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (...perms) => {
        return perms.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (...perms) => {
        return perms.every(p => permissions.includes(p));
    };

    return (
        <PermissionContext.Provider value={{
            permissions,
            role,
            loading,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions
        }}>
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissions must be used within PermissionProvider');
    }
    return context;
}

// HOC to protect components based on permissions
export function withPermission(Component, requiredPermission) {
    return function ProtectedComponent(props) {
        const { hasPermission } = usePermissions();

        if (!hasPermission(requiredPermission)) {
            return (
                <div className="p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Access Denied
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        You don't have permission to access this resource.
                    </p>
                </div>
            );
        }

        return <Component {...props} />;
    };
}
