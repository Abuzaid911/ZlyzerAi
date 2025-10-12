// components/AnalysisLoader.tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface AnalysisLoaderProps {
  status?: string;
  message?: string;
}

export default function AnalysisLoader({ status, message }: AnalysisLoaderProps) {
  const defaultMessage = status === 'queued' 
    ? 'Queueing your analysis...' 
    : status === 'processing'
    ? 'Analyzing with AI...'
    : 'Processing...';

  return (
    <div className="mt-8 flex flex-col items-center justify-center py-12">
      {/* Lottie Animation */}
      <div className="w-64 h-64 flex items-center justify-center">
        <DotLottieReact
          src="https://lottie.host/e0f6d806-4c01-42cd-8526-4354a7925b1e/ibtWqlBeTO.lottie"
          loop
          autoplay
          className="w-full h-full"
        />
      </div>

      {/* Loading Message */}
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold text-white animate-pulse">
          {message || defaultMessage}
        </p>
        <p className="mt-2 text-sm text-white/60">
          This may take a few moments
        </p>
      </div>

      {/* Animated dots */}
      <div className="mt-4 flex gap-2">
        <span className="w-2 h-2 bg-[#2ce695] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-[#2ce695] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-[#2ce695] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  );
}

