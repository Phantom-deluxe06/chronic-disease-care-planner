/**
 * API Configuration
 * Centralized API URL configuration for web and mobile builds
 */

// For Android emulator, localhost refers to the emulator itself, not the host machine
// Use 10.0.2.2 to access host machine from Android emulator
// For a real device on the same network, use your computer's local IP address

const getApiBaseUrl = () => {
    // Check if running in production (Vercel)
    const isProduction = window.location.hostname !== 'localhost';

    // Check if running in Capacitor/native app
    const isNative = window.Capacitor !== undefined;

    if (isProduction || isNative) {
        // Production: Use deployed Render backend
        return 'https://healthbuddy-backend-fdum.onrender.com';
    }

    // Local development
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
