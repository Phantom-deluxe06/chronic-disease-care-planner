/**
 * API Configuration
 * Centralized API URL configuration for web and mobile builds
 */

// For Android emulator, localhost refers to the emulator itself, not the host machine
// Use 10.0.2.2 to access host machine from Android emulator
// For a real device on the same network, use your computer's local IP address

const getApiBaseUrl = () => {
    // Multiple checks to detect if running in Capacitor/native app
    const isCapacitor = window.Capacitor !== undefined;
    const isNativeApp = navigator.userAgent.includes('CapacitorApp') ||
        document.URL.startsWith('capacitor://') ||
        document.URL.startsWith('ionic://') ||
        document.URL.startsWith('file://');

    // Check if running in production (Vercel)
    const isProduction = window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';

    // Always use deployed backend for native apps and production
    if (isCapacitor || isNativeApp || isProduction) {
        return 'https://healthbuddy-backend-fdum.onrender.com';
    }

    // Local development only
    return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function for API calls
export const apiUrl = (endpoint) => {
    const base = API_BASE_URL;
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
};

export default API_BASE_URL;
