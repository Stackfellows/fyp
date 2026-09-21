import React from 'react';

const FYPLogo = ({ size = 'md', showText = true, className = '' }) => {
  const dimensions = {
    sm: { icon: 32, text: 'text-sm' },
    md: { icon: 44, text: 'text-base' },
    lg: { icon: 60, text: 'text-xl' },
    xl: { icon: 72, text: 'text-2xl' },
  }[size] || { icon: 44, text: 'text-base' };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* FYP Academic Crest */}
      <div 
        className="relative shrink-0 rounded-2xl p-1 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 50%, #06b6d4 100%)',
          width: dimensions.icon + 8,
          height: dimensions.icon + 8
        }}
      >
        <div 
          className="w-full h-full rounded-xl flex items-center justify-center text-white border border-white/20 shadow-inner"
          style={{ background: '#0f172a' }}
        >
          <span className="font-extrabold text-indigo-400 tracking-wider text-xs sm:text-sm">
            FYP
          </span>
        </div>
      </div>

      {showText && (
        <div className="min-w-0">
          <h2 className="font-extrabold tracking-tight text-white leading-tight truncate flex items-center gap-1.5">
            <span>FYP COMPLAINT PORTAL</span>
          </h2>
          <p className="text-indigo-300/90 text-xs font-semibold tracking-wider uppercase truncate">
            University Student Grievance Cell
          </p>
        </div>
      )}
    </div>
  );
};

export default FYPLogo;
