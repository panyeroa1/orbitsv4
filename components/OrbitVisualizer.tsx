import React from 'react';

interface OrbitVisualizerProps {
  isActive: boolean;
  state: 'listening' | 'processing' | 'speaking' | 'idle';
}

const OrbitVisualizer: React.FC<OrbitVisualizerProps> = ({ isActive, state }) => {
  // Determine colors and animation speeds based on state
  const getColor = () => {
    switch(state) {
      case 'listening': return 'border-neon';
      case 'processing': return 'border-neon-purple';
      case 'speaking': return 'border-neon-pink';
      default: return 'border-white/20';
    }
  };

  const getShadow = () => {
    switch(state) {
      case 'listening': return 'shadow-[0_0_40px_rgba(0,243,255,0.5)]';
      case 'processing': return 'shadow-[0_0_40px_rgba(189,0,255,0.5)]';
      case 'speaking': return 'shadow-[0_0_60px_rgba(255,0,85,0.7)]';
      default: return 'shadow-[0_0_20px_rgba(255,255,255,0.1)]';
    }
  };

  const getGlow = () => {
    switch(state) {
      case 'listening': return 'bg-gradient-to-r from-neon/20 to-neon/5';
      case 'processing': return 'bg-gradient-to-r from-neon-purple/20 to-neon-purple/5';
      case 'speaking': return 'bg-gradient-to-r from-pink-500/20 to-pink-500/5';
      default: return 'bg-white/5';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Ambient Glow Background */}
      <div className={`absolute inset-0 rounded-full blur-3xl ${getGlow()} transition-all duration-700`}></div>

      {/* Outer Ring with Particle */}
      <div className={`absolute w-full h-full rounded-full border-[1px] ${state === 'idle' ? 'border-white/5' : 'border-white/10'} animate-[spin_10s_linear_infinite] transition-all duration-500`}>
         <div className={`absolute top-0 left-1/2 w-2 h-2 ${state === 'listening' ? 'bg-neon' : 'bg-white/50'} rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${state === 'listening' ? 'shadow-[0_0_10px_rgba(0,243,255,0.8)] animate-pulse' : ''}`}></div>
      </div>

      {/* Middle Ring (Opposite Spin) with Particle */}
      <div className={`absolute w-48 h-48 rounded-full border-[1px] border-white/5 animate-[spin_15s_linear_infinite_reverse] transition-all duration-500`}>
         <div className={`absolute bottom-0 left-1/2 w-1.5 h-1.5 ${state === 'processing' ? 'bg-neon-purple' : 'bg-white/30'} rounded-full -translate-x-1/2 translate-y-1/2 transition-all duration-300 ${state === 'processing' ? 'shadow-[0_0_8px_rgba(189,0,255,0.8)] animate-pulse' : ''}`}></div>
      </div>

      {/* Inner Accent Ring */}
      <div className={`absolute w-36 h-36 rounded-full border-[0.5px] border-white/5 animate-[spin_8s_linear_infinite] transition-all duration-500`}>
         <div className={`absolute right-0 top-1/2 w-1 h-1 ${state === 'speaking' ? 'bg-pink-400' : 'bg-white/20'} rounded-full translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${state === 'speaking' ? 'shadow-[0_0_8px_rgba(255,20,147,0.8)] animate-pulse' : ''}`}></div>
      </div>

      {/* Core Ring (Active State) with Glassmorphism */}
      <div 
        className={`relative w-32 h-32 rounded-full border-4 transition-all duration-700 ease-out flex items-center justify-center backdrop-blur-xl ${getColor()} ${getShadow()} ${state === 'listening' || state === 'speaking' ? 'scale-110 bg-black/60' : 'scale-100 bg-black/40'}`}
      >
        {/* Multiple Pulse Effects for Active States */}
        {isActive && state === 'listening' && (
           <>
             <div className={`absolute inset-0 rounded-full border-2 ${getColor()} animate-ping opacity-30`}></div>
             <div className={`absolute inset-0 rounded-full border-2 ${getColor()} animate-ping opacity-20 animation-delay-200`}></div>
           </>
        )}
        
        {isActive && state === 'speaking' && (
           <div className={`absolute inset-0 rounded-full ${getColor()} animate-pulse opacity-40`}></div>
        )}

        {state === 'processing' && (
           <div className="absolute inset-0 rounded-full border-2 border-neon-purple animate-spin opacity-30"></div>
        )}

        {/* Breathing Animation for Idle State */}
        {state === 'idle' && (
           <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-[pulse_3s_ease-in-out_infinite]"></div>
        )}

        <div className="text-xs font-display tracking-widest text-white/90 uppercase font-bold drop-shadow-lg">
          {state}
        </div>
      </div>

      {/* Particle System for Speaking State */}
      {state === 'speaking' && (
        <>
          <div className="absolute w-1 h-1 bg-pink-400 rounded-full top-1/4 left-1/4 animate-float opacity-60"></div>
          <div className="absolute w-1 h-1 bg-pink-300 rounded-full top-3/4 right-1/4 animate-float-delayed opacity-40"></div>
          <div className="absolute w-0.5 h-0.5 bg-pink-500 rounded-full top-1/2 right-1/3 animate-float-slow opacity-50"></div>
        </>
      )}
    </div>
  );
};

export default OrbitVisualizer;
