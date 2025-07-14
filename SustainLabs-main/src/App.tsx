import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/appStore';
import { useDataStore } from './store/dataStore';
import MaintenanceDashboard from './components/MaintenanceDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { Web3Provider } from './contexts/Web3Context';

// Lazy load pages for better initial load performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const RenewableEnergy = lazy(() => import('./pages/RenewableEnergy'));

const NetworkOptimizer = lazy(() => import('./pages/Network'));

const InteractiveAIChatbot = lazy(() => import('./components/InteractiveAIChatbot'));

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

// Separate components into their own files
import FloatingChatButton from './components/FloatingChatButton';
import ChatModal from './components/ChatModal';

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-base-200">
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          SusTainLabs
        </div>
      </div>
      <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-primary"></div>
    </div>
    <p className="mt-4 text-base-content/70 animate-pulse">Loading amazing features...</p>
  </div>
);

// AppContent component to conditionally render Navbar
const AppContent = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { setChatOpen } = useAppStore();
  const { fetchSites, fetchMarketplaceItems } = useDataStore();
  const location = useLocation();

  // Check if current route is landing page
  const isLandingPage = location.pathname === "/";

  // Effect to load initial data
  useEffect(() => {
    if (isAuthenticated) {
      fetchSites();
      fetchMarketplaceItems();
    }
  }, [isAuthenticated, fetchSites, fetchMarketplaceItems]);

  // Sync chat state with global state
  useEffect(() => {
    setChatOpen(isChatOpen);
  }, [isChatOpen, setChatOpen]);

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Only render Navbar when not on landing page */}
      {!isLandingPage && <Navbar />}
      
      <main className={`container mx-auto px-4 ${isLandingPage ? '' : 'py-8'}`}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            } />
            <Route path="/renewable-energy" element={
              <ProtectedRoute>
                <RenewableEnergy />
              </ProtectedRoute>
            } />
            
            
           
            
            <Route path="/maintenance-mobile" element={<ProtectedRoute><MaintenanceDashboard /></ProtectedRoute>} />

            {/* Special routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      
      {!isLandingPage && <Footer />}

      <FloatingChatButton onClick={() => setIsChatOpen(true)} />
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        ChatComponent={InteractiveAIChatbot}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Web3Provider>
        <Router>
          <AppContent />
        </Router>
      </Web3Provider>
    </ErrorBoundary>
  );
};

export default App;