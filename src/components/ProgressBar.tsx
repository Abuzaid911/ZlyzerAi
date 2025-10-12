// Reusable progress bar component

interface ProgressBarProps {
  progress: number;
  status: string;
  requestId?: string | null;
  variant?: 'video' | 'profile';
}

export default function ProgressBar({ progress, status, requestId, variant = 'video' }: ProgressBarProps) {
  const gradientClass =
    variant === 'video'
      ? 'bg-gradient-to-r from-[#2ce695] via-[#18CCFC] to-[#6344F5]'
      : 'bg-gradient-to-r from-[#18CCFC] via-[#54d8a8] to-[#2ce695]';

  return (
    <div className="mt-8">
      <p className="text-sm text-white/70">
        {status === 'queued'
          ? `Queued for ${variant} analysis…`
          : `Analyzing ${variant} with AI…`}
      </p>
      <div className="mt-2 h-3 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${gradientClass} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {requestId && <p className="mt-2 text-xs text-white/40">Job ID: {requestId}</p>}
    </div>
  );
}

