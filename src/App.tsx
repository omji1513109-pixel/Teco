import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DailyLifeScheduleView } from './components/DailyLifeScheduleView';
import { WorkoutBuilderView } from './components/WorkoutBuilderView';
import { FormVisionView } from './components/FormVisionView';
import { RecoveryLabView } from './components/RecoveryLabView';
import { TelemetryLogView } from './components/TelemetryLogView';
import { CoachConsultView } from './components/CoachConsultView';
import { AthleteProfile, TrainingLogEntry, WorkoutPlan } from './types';
import { 
  defaultTodayWorkout, 
  initialAthlete, 
  initialTrainingLogs 
} from './data/mockData';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [athlete, setAthlete] = useState<AthleteProfile>(initialAthlete);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutPlan>(() => {
    const saved = localStorage.getItem('techo_active_workout') || localStorage.getItem('athlit_active_workout');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return defaultTodayWorkout;
  });

  const [logs, setLogs] = useState<TrainingLogEntry[]>(() => {
    const saved = localStorage.getItem('techo_training_logs') || localStorage.getItem('athlit_training_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return initialTrainingLogs;
  });

  const [isLiveModeActive, setIsLiveModeActive] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  // Persist workout changes
  useEffect(() => {
    localStorage.setItem('techo_active_workout', JSON.stringify(todayWorkout));
  }, [todayWorkout]);

  // Persist logs
  useEffect(() => {
    localStorage.setItem('techo_training_logs', JSON.stringify(logs));
  }, [logs]);

  const handleAddLog = (newLog: TrainingLogEntry) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleStartLiveWorkout = () => {
    setIsLiveModeActive(true);
    setCurrentTab('workout-engine');
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] text-slate-800 flex flex-col font-sans selection:bg-lime-500 selection:text-white">
      
      {/* 3-Zone Top Bar Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        onStartLiveWorkout={handleStartLiveWorkout}
      />

      {/* Main Viewport Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            athlete={athlete}
            todayWorkout={todayWorkout}
            recentLogs={logs}
            onOpenWorkoutBuilder={() => setCurrentTab('workout-engine')}
            onOpenLiveWorkout={handleStartLiveWorkout}
            onOpenFormVision={() => setCurrentTab('form-vision')}
            onOpenRecoveryLab={() => setCurrentTab('recovery-lab')}
            onOpenCoachConsult={() => setCurrentTab('coach-consult')}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
            onOpenDailySchedule={() => setCurrentTab('daily-schedule')}
          />
        )}

        {currentTab === 'daily-schedule' && <DailyLifeScheduleView />}

        {currentTab === 'workout-engine' && (
          <WorkoutBuilderView
            currentWorkout={todayWorkout}
            onUpdateWorkout={(updated) => setTodayWorkout(updated)}
            isLiveModeActive={isLiveModeActive}
            onCloseLiveMode={() => setIsLiveModeActive(false)}
          />
        )}

        {currentTab === 'form-vision' && <FormVisionView />}

        {currentTab === 'recovery-lab' && <RecoveryLabView />}

        {currentTab === 'telemetry-logs' && (
          <TelemetryLogView
            logs={logs}
            onAddLog={handleAddLog}
            isQuickLogOpen={isQuickLogOpen}
            onCloseQuickLog={() => setIsQuickLogOpen(false)}
          />
        )}

        {currentTab === 'coach-consult' && (
          <CoachConsultView athlete={athlete} />
        )}
      </main>

      {/* Quiet, clean editorial footer adhering to Section 1.B */}
      <footer className="border-t border-black/50 bg-[#111319] py-8 mt-12 text-xs text-neutral-500 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-neutral-300">Techo</span>
            <span>·</span>
            <span>Intelligent Athletic Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="hover:text-neutral-300 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('daily-schedule')}
              className="hover:text-neutral-300 transition-colors"
            >
              Daily Schedule
            </button>
            <button
              onClick={() => setCurrentTab('form-vision')}
              className="hover:text-neutral-300 transition-colors"
            >
              200+ Games & 3D AI
            </button>
            <button
              onClick={() => setCurrentTab('workout-engine')}
              className="hover:text-neutral-300 transition-colors"
            >
              Workout Engine
            </button>
            <button
              onClick={() => setCurrentTab('recovery-lab')}
              className="hover:text-neutral-300 transition-colors"
            >
              Recovery Science
            </button>
          </div>

          <div>
            © {new Date().getFullYear()} Techo. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
