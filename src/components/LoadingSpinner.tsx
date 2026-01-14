interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text = 'Please wait...' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div
        className={`${sizeClasses[size]} border-gray-300 border-t-green-700 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && <p className={`text-gray-700 ${textSizeClasses[size]} font-bold`}>{text}</p>}
    </div>
  );
}
