import axios from 'axios';

// Configuration
const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
const ROOF_API_KEY = import.meta.env.VITE_BACKEND_API_KEY || "";

// Create Axios Instance
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // IMPORTANT: Allows sending/receiving cookies (refresh_token)
});

// Storage Keys
const ACCESS_TOKEN_KEY = 'roof_access_token';

// State
let isRefreshing = false;
let failedQueue = [];
let refreshTimer = null;

// Token refresh interval (55 minutes in ms - before 60min expiry)
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000;

// Helper: Start auto-refresh timer
const startRefreshTimer = () => {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(async () => {
        if (getAccessToken()) {
            console.log("⏰ Auto-refreshing token (55 min interval)...");
            try {
                const response = await api.post('/refresh');
                const { access_token } = response.data;
                setAccessToken(access_token);
                console.log("✅ Token auto-refresh successful");
            } catch (err) {
                console.error("❌ Token auto-refresh failed:", err);
            }
        }
    }, TOKEN_REFRESH_INTERVAL);
};

// Helper: Stop auto-refresh timer
const stopRefreshTimer = () => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
};

// Helper: Process Failed Queue
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Initial Login (Call this on App mount)
export const loginWithApiKey = async (apiKey) => {
    try {
        console.log("🔐 Authenticating with API Key...");
        const response = await api.post('/token', null, {
            params: { api_key: apiKey }
        });

        const { access_token } = response.data;
        setAccessToken(access_token);
        startRefreshTimer(); // Start auto-refresh timer
        console.log("✅ Authentication successful");
        return true;
    } catch (error) {
        console.error("❌ Authentication failed:", error);
        return false;
    }
};

// Get Token
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

// Set Token
export const setAccessToken = (token) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

// Logout - clear token and stop refresh timer
export const logout = () => {
    stopRefreshTimer();
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    console.log("👋 Logged out and timer stopped");
};

// Axios Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Axios Response Interceptor: Handle 401 & Refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("🔄 Access token expired. Attempting refresh...");
                // Call /refresh endpoint (cookies are sent automatically due to withCredentials: true)
                const response = await api.post('/refresh');

                const { access_token } = response.data;
                setAccessToken(access_token);
                startRefreshTimer(); // Restart auto-refresh timer

                console.log("✅ Token refresh successful");

                // Retry queued requests
                processQueue(null, access_token);

                // Retry original request
                originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                return api(originalRequest);

            } catch (err) {
                console.error("❌ Token refresh failed. User might need to re-login.");
                processQueue(err, null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);
