interface MLHLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function MLHLogo({ size = 'sm', className = '' }: MLHLogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-10', 
    lg: 'h-16'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        viewBox="0 0 320 80" 
        className={`${sizeClasses[size]} w-auto`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* M - Red */}
        <rect x="0" y="0" width="70" height="50" rx="8" fill="#E53E3E" />
        <rect x="12" y="8" width="8" height="34" fill="white" />
        <rect x="24" y="8" width="8" height="34" fill="white" />
        <rect x="38" y="8" width="8" height="34" fill="white" />
        <rect x="50" y="8" width="8" height="34" fill="white" />
        
        {/* L - Blue */}
        <rect x="80" y="0" width="50" height="50" rx="8" fill="#3182CE" />
        <rect x="92" y="8" width="8" height="34" fill="white" />
        <rect x="100" y="34" width="18" height="8" fill="white" />
        
        {/* H - Yellow (first H) */}
        <rect x="140" y="0" width="50" height="50" rx="8" fill="#F6D55C" />
        <rect x="152" y="8" width="8" height="34" fill="white" />
        <rect x="172" y="8" width="8" height="34" fill="white" />
        <rect x="160" y="21" width="12" height="8" fill="white" />
        
        {/* H - Yellow (second H) */}
        <rect x="200" y="0" width="50" height="50" rx="8" fill="#F6D55C" />
        <rect x="212" y="8" width="8" height="34" fill="white" />
        <rect x="232" y="8" width="8" height="34" fill="white" />
        <rect x="220" y="21" width="12" height="8" fill="white" />
        <rect x="212" y="8" width="28" height="6" fill="white" />
        
        {/* Text - MAJOR LEAGUE HACKING */}
        <text x="0" y="68" fontSize="10" fontWeight="800" fill="#2D3748" fontFamily="Arial, sans-serif" letterSpacing="1px">
          MAJOR LEAGUE HACKING
        </text>
      </svg>
    </div>
  );
}

export default MLHLogo;