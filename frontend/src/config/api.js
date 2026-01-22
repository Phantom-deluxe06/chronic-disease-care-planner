/**
 * API Configuration
 * Centralized API URL configuration for web and mobile builds
 */

// For Android emulator, localhost refers to the emulator itself, not the host machine
// Use 10.0.2.2 to access host machine from Android emulator
// For a real device on the same network, use your computer's local IP address

const getApiBaseUrl = () => {
    // LOCAL TESTING: Use 10.0.2.2 for Android emulator (routes to host machine)
    // PRODUCTION: Use the deployed backend URL
    // eslint-disable-next-line no-unused-vars
    const LOCAL_BACKEND = 'http://10.0.2.2:8000';
    const PRODUCTION_BACKEND = 'https://healthbuddy-backend-fdum.onrender.com';

    // For emulator testing, use LOCAL_BACKEND
    // For production/real device, use PRODUCTION_BACKEND
    const ACTIVE_BACKEND = PRODUCTION_BACKEND; // Using production for real phone

    // Multiple checks to detect if running in Capacitor/native app
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
    const isNativeApp = typeof navigator !== 'undefined' && (
        navigator.userAgent.includes('CapacitorApp') ||
        navigator.userAgent.includes('Android') ||
        navigator.userAgent.includes('wv') // WebView indicator
    );
    const isFileProtocol = typeof document !== 'undefined' && (
        document.URL.startsWith('capacitor://') ||
        document.URL.startsWith('ionic://') ||
        document.URL.startsWith('file://')
    );

    // Check if running in production (Vercel or any non-localhost)
    const isProduction = typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';

    // Use configured backend for native apps, file protocol, or production
    if (isCapacitor || isNativeApp || isFileProtocol || isProduction) {
        console.log('[API Config] Using backend:', ACTIVE_BACKEND);
        return ACTIVE_BACKEND;
    }

    // Local web development only
    console.log('[API Config] Using local backend: http://localhost:8000');
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
