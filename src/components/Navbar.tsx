import React from 'react';
import { Plus, Zap } from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'daily-schedule'
  | 'workout-engine'
  | 'form-vision'
  | 'recovery-lab'
  | 'telemetry-logs'
  | 'coach-consult';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickLog: () => void;
  onStartLiveWorkout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickLog,
  onStartLiveWorkout,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-300/70 bg-[#eef2f6]/95 backdrop-blur-md shadow-[0_4px_16px_rgba(166,180,200,0.35)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element wordmark with subtle embossed glow */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className="group flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 rounded-sm"
        >
          <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-lime-700 transition-colors drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
            Techo
          </span>
        </button>

        {/* Zone 2: Neumorphic Segmented Navigation Bar */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-[#e5ebf2] shadow-[inset_2px_2px_5px_rgba(166,180,200,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/70 text-xs font-semibold">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === 'dashboard'
                ? 'bg-[#f0f4f9] text-lime-700 shadow-[3px_3px_8px_rgba(166,180,200,0.5),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onSelectTab('daily-schedule')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === 'daily-schedule'
                ? 'bg-[#f0f4f9] text-lime-700 shadow-[3px_3px_8px_rgba(166,180,200,0.5),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Schedule
          </button>

          <button
            onClick={() => onSelectTab('form-vision')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === 'form-vision'
                ? 'bg-[#f0f4f9] text-lime-700 shadow-[3px_3px_8px_rgba(166,180,200,0.5),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            200+ Games & 3D AI
          </button>

          <button
            onClick={() => onSelectTab('workout-engine')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === 'workout-engine'
                ? 'bg-[#f0f4f9] text-lime-700 shadow-[3px_3px_8px_rgba(166,180,200,0.5),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Workout Engine
          </button>

          <button
            onClick={() => onSelectTab('recovery-lab')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === 'recovery-lab'
                ? 'bg-[#f0f4f9] text-lime-700 shadow-[3px_3px_8px_rgba(166,180,200,0.5),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recovery Lab
          </button>

          <button
            onClick={() => onSelectTab('telemetry-logs')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === 'telemetry-logs'
                ? 'bg-[#f0f4f9] text-lime-700 shadow-[3px_3px_8px_rgba(166,180,200,0.5),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Telemetry & Logs
          </button>

          <button
            onClick={() => onSelectTab('coach-consult')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === 'coach-consult'
                ? 'bg-[#f0f4f9] text-lime-700 shadow-[3px_3px_8px_rgba(166,180,200,0.5),-2px_-2px_6px_rgba(255,255,255,0.95)] border border-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Coach Techo
          </button>
        </nav>

        {/* Zone 3: Neumorphic tactile action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStartLiveWorkout}
            className="neu-btn hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-lime-700 whitespace-nowrap"
            title="Start live interactive workout timer with voice coaching"
          >
            <Zap className="h-3.5 w-3.5 text-lime-600" />
            <span>Live Session</span>
          </button>

          <button
            onClick={onOpenQuickLog}
            className="neu-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Workout</span>
          </button>
        </div>

      </div>

      {/* Mobile sub-nav strip */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-300/60 bg-[#e5ebf2] px-4 py-2 gap-3 text-xs font-medium scrollbar-none shadow-inner">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${currentTab === 'dashboard' ? 'bg-[#f0f4f9] text-lime-700 font-bold shadow-sm' : 'text-slate-600'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('daily-schedule')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${currentTab === 'daily-schedule' ? 'bg-[#f0f4f9] text-lime-700 font-bold shadow-sm' : 'text-slate-600'}`}
        >
          Daily Schedule
        </button>
        <button
          onClick={() => onSelectTab('form-vision')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${currentTab === 'form-vision' ? 'bg-[#f0f4f9] text-lime-700 font-bold shadow-sm' : 'text-slate-600'}`}
        >
          200+ Games & 3D AI
        </button>
        <button
          onClick={() => onSelectTab('workout-engine')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${currentTab === 'workout-engine' ? 'bg-[#f0f4f9] text-lime-700 font-bold shadow-sm' : 'text-slate-600'}`}
        >
          Workouts
        </button>
        <button
          onClick={() => onSelectTab('recovery-lab')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${currentTab === 'recovery-lab' ? 'bg-[#f0f4f9] text-lime-700 font-bold shadow-sm' : 'text-slate-600'}`}
        >
          Recovery
        </button>
        <button
          onClick={() => onSelectTab('telemetry-logs')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${currentTab === 'telemetry-logs' ? 'bg-[#f0f4f9] text-lime-700 font-bold shadow-sm' : 'text-slate-600'}`}
        >
          Telemetry
        </button>
        <button
          onClick={() => onSelectTab('coach-consult')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${currentTab === 'coach-consult' ? 'bg-[#f0f4f9] text-lime-700 font-bold shadow-sm' : 'text-slate-600'}`}
        >
          Coach
        </button>
      </div>
    </header>
  );
};
