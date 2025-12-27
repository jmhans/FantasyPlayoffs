import Link from 'next/link';

interface HomeButtonProps {
  className?: string;
}

export default function HomeButton({ className = '' }: HomeButtonProps) {
  return (
    <Link
      href="/"
      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 transition-colors hover:bg-gray-100 ${className}`}
      aria-label="Back to Home"
    >
      <svg 
        className="h-5 w-5" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
      </svg>
    </Link>
  );
}
