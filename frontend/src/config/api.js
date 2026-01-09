/**
 * API Configuration
 * Centralized API URL configuration for web and mobile builds
 */

// For Android emulator, localhost refers to the emulator itself, not the host machine
// Use 10.0.2.2 to access host machine from Android emulator
// For a real device on the same network, use your computer's local IP address

const getApiBaseUrl = () => {
    // Check if running in Capacitor/native app
    const isNative = window.Capacitor !== undefined;

    if (isNative) {
        // For Android emulator: 10.0.2.2 points to host machine's localhost
        // For real device: Replace with your computer's IP (e.g., 192.168.1.x)
        // For production: Replace with your deployed backend URL
        return 'http://10.12.2.110:8000';
    }

    // Web development
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
