// App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const VideoAnalysis = lazy(() => import("./pages/VideoAnalysis"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const GuidedTestPage = lazy(() => import("./pages/GuidedTestPage"));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex items-center gap-3 text-white/80">
      <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
      </svg>
      <span>Loading...</span>
    </div>
  </div>
);

// Fixed Background
const Background: React.FC = () => (
  <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden role="presentation">
    <div className="absolute inset-0 bg-[#132e53]" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <div className="flex min-h-screen flex-col bg-[#132e53] text-white antialiased ">
            <Background />
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                {/* Support both /callback and /auth/callback for OAuth redirects */}
                <Route path="/callback" element={<AuthCallback />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/video-analysis" element={<VideoAnalysis />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/guided-test" element={<GuidedTestPage />} />
              </Routes>
            </Suspense>
            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
