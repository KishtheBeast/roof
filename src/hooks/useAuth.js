import { useState, useEffect, useCallback } from 'react';
import { api, getAccessToken, setAccessToken, logout as authLogout } from '../utils/auth';

/**
 * Custom hook for authentication state and token management
 * Provides login, logout, and token refresh functionality
 */
export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const loginWithApiKey = useCallback(async (apiKey) => {
        if (!apiKey) {
            setError('API key is required');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post('/token', null, {
                params: { api_key: apiKey }
            });

            const { access_token } = response.data;
            setAccessToken(access_token);
            setIsAuthenticated(true);
            return true;
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
            setIsAuthenticated(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        authLogout();
        setIsAuthenticated(false);
        setError(null);
    }, []);

    // Check token status on mount
    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    return {
        isAuthenticated,
        isLoading,
        error,
        loginWithApiKey,
        logout
    };
}

export default useAuth;
