// App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import VideoAnalysis from "./pages/VideoAnalysis";
import Pricing from "./pages/Pricing";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import GuidedTestPage from "./pages/GuidedTestPage";

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

          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/" element={<Home />} />
            <Route path="/video-analysis" element={<VideoAnalysis />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/guided-test" element={<GuidedTestPage />} />
          </Routes>
<Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
