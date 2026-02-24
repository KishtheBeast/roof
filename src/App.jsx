import React, { lazy, Suspense } from 'react';
import PasswordGate from './components/PasswordGate';
import { loginWithApiKey } from './utils/auth';
import { useMapControl } from './hooks/useMapControl';
import { useAiAnalysis } from './hooks/useAiAnalysis';
import LoadingPage from './pages/LoadingPage';
import { ShieldCheck } from 'lucide-react';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));

/**
 * Main App Component
 * Uses hooks for state management
 */
function MainApp() {
    const { initializeMaps } = useMapControl();
    const {
        aiMeasurements,
        triggerAiAnalysis,
        setAiMeasurements
    } = useAiAnalysis();

    // UI state
    const [hasLocation, setHasLocation] = React.useState(false);
    const [isLoadingSolar, setIsLoadingSolar] = React.useState(false);
    const [selectedAddress, setSelectedAddress] = React.useState('');

    // Initialize Google Maps on mount
    React.useEffect(() => {
        initializeMaps();
    }, [initializeMaps]);

    // Handle location selection from address search
    const handleLocationSelect = React.useCallback(async (location) => {
        setIsLoadingSolar(true);
        setHasLocation(true);
        setSelectedAddress(location.address || '');
        setAiMeasurements(null);

        // Trigger AI analysis after a short delay
        setTimeout(() => {
            triggerAiAnalysis(location.address || '');
        }, 100);
    }, [triggerAiAnalysis, setAiMeasurements]);

    // Clear loading state when AI measurements arrive
    React.useEffect(() => {
        if (aiMeasurements) {
            setIsLoadingSolar(false);
        }
    }, [aiMeasurements]);

    // Render loading state
    if (isLoadingSolar) {
        return <LoadingPage />;
    }

    // Render results page
    if (hasLocation && aiMeasurements) {
        return (
            <Suspense fallback={<LoadingPage />}>
                <ResultsPage
                    aiMeasurements={aiMeasurements}
                    address={selectedAddress}
                    onLocationSelect={handleLocationSelect}
                    onBack={() => {
                        setHasLocation(false);
                        setAiMeasurements(null);
                        setSelectedAddress('');
                    }}
                />
            </Suspense>
        );
    }

    // Render fallback error state
    if (hasLocation && !aiMeasurements) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-brand-navy text-white">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur text-center max-w-md">
                    <ShieldCheck className="w-12 h-12 text-brand-gold mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-serif font-bold mb-2">Analysis Pending...</h3>
                    <p className="text-white/40 mb-8">Data processing in progress.</p>
                    <button
                        onClick={() => triggerAiAnalysis(selectedAddress)}
                        className="px-8 py-3 bg-brand-gold text-brand-navy font-bold rounded-xl uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    // Render landing page (default)
    return (
        <Suspense fallback={<LoadingPage />}>
            <LandingPage
                onLocationSelect={handleLocationSelect}
                selectedAddress={selectedAddress}
            />
        </Suspense>
    );
}

/**
 * App Component with Password Gate
 */
function App() {
    const ROOF_API_KEY = import.meta.env.VITE_BACKEND_API_KEY;

    // Authenticate with backend on mount
    React.useEffect(() => {
        if (ROOF_API_KEY) {
            loginWithApiKey(ROOF_API_KEY);
        } else {
            console.warn('VITE_BACKEND_API_KEY is missing in .env');
        }
    }, []);

    return (
        <PasswordGate>
            <MainApp />
        </PasswordGate>
    );
}

export default App;
