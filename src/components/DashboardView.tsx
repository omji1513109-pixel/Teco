import React from 'react';
import { 
  Play, 
  Sparkles, 
  ArrowUpRight, 
  Heart, 
  Flame, 
  Timer, 
  TrendingUp, 
  ShieldCheck, 
  Compass, 
  Volume2 
} from 'lucide-react';
import { AthleteProfile, TrainingLogEntry, WorkoutPlan } from '../types';
import { speakCue } from '../utils/audioCoach';
import { TrainingVolumeRpeTrendsChart } from './TrainingVolumeRpeTrendsChart';
import { LiveHeartRateSensorHUD } from './LiveHeartRateSensorHUD';

interface DashboardViewProps {
  athlete: AthleteProfile;
  todayWorkout: WorkoutPlan;
  recentLogs: TrainingLogEntry[];
  onOpenWorkoutBuilder: () => void;
  onOpenLiveWorkout: () => void;
  onOpenFormVision: () => void;
  onOpenRecoveryLab: () => void;
  onOpenCoachConsult: () => void;
  onOpenQuickLog?: () => void;
  onOpenDailySchedule?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  athlete,
  todayWorkout,
  recentLogs,
  onOpenWorkoutBuilder,
  onOpenLiveWorkout,
  onOpenFormVision,
  onOpenRecoveryLab,
  onOpenCoachConsult,
  onOpenQuickLog,
  onOpenDailySchedule,
}) => {
  const [isPlayingCue, setIsPlayingCue] = React.useState(false);

  const handlePlayHeroCue = () => {
    if (todayWorkout.audioCoachCues && todayWorkout.audioCoachCues.length > 0) {
      setIsPlayingCue(true);
      speakCue(todayWorkout.audioCoachCues[0], () => setIsPlayingCue(false));
    }
  };

  // Weekly zone distribution calculation (simulated telemetry based on logs)
  const zoneHours = {
    z1: 1.8,
    z2: 4.2,
    z3: 2.1,
    z4: 1.4,
    z5: 0.5,
  };
  const totalHours = Object.values(zoneHours).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Showcase Frame with Neumorphic Relief */}
      <section className="neu-card relative overflow-hidden rounded-3xl p-1 shadow-[8px_8px_20px_rgba(0,0,0,0.7),-6px_-6px_16px_rgba(255,255,255,0.03)]">
        <div className="relative rounded-[22px] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/src/assets/images/athlit_hero_runner_1790658093515.jpg"
              alt="Elite runner training on all-weather track"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center opacity-30 filter brightness-90 contrast-115"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161a22] via-[#161a22]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#161a22] via-[#161a22]/50 to-transparent" />
          </div>

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-12 flex flex-col justify-between min-h-[340px]">
            
            {/* Top metadata strip (Zero-pill discipline: unboxed clean text) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-medium">
              <span className="text-lime-400 font-semibold drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]">{athlete.name}</span>
              <span aria-hidden="true">·</span>
              <span>{athlete.primarySport}</span>
              <span aria-hidden="true">·</span>
              <span>{athlete.experienceLevel}</span>
              <span aria-hidden="true">·</span>
              <span className="text-neutral-300">{athlete.currentMesocycle}</span>
            </div>

            {/* Focal Headline */}
            <div className="max-w-2xl space-y-3 my-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance drop-shadow-md">
                Lactate threshold surge day. Push the clearance limit.
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
                Today's protocol targets MCT-1 transporter upregulation through progressive 8-minute intervals. Autonomic recovery is verified at 88/100 readiness.
              </p>
            </div>

            {/* Primary Action Row with Neumorphic tactile buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenLiveWorkout}
                className="neu-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold whitespace-nowrap"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Launch Live Workout</span>
              </button>

              <button
                onClick={onOpenWorkoutBuilder}
                className="neu-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:text-white whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 text-lime-400" />
                <span>Adapt Session with AI</span>
              </button>

              <button
                onClick={handlePlayHeroCue}
                disabled={isPlayingCue}
                className="neu-btn inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium text-neutral-300 hover:text-white whitespace-nowrap"
                title="Hear pre-workout voice cue from Coach Techo"
              >
                <Volume2 className={`h-3.5 w-3.5 ${isPlayingCue ? 'text-lime-400 animate-pulse' : 'text-neutral-400'}`} />
                <span>{isPlayingCue ? 'Playing Voice Cue...' : 'Pre-Workout Cue'}</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Physiological Telemetry & Metric Cards (Neumorphic Soft Extruded Pods) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Readiness */}
        <div 
          onClick={onOpenRecoveryLab}
          className="neu-card group cursor-pointer rounded-2xl p-5 transition-all hover:scale-[1.02] hover:shadow-[9px_9px_22px_rgba(0,0,0,0.7),-7px_-7px_18px_rgba(255,255,255,0.04)]"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span className="font-semibold tracking-wide">Readiness</span>
            <div className="p-1 rounded-lg bg-[#111319] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
              <ShieldCheck className="h-4 w-4 text-lime-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white tabular-nums drop-shadow-sm">88</span>
            <span className="text-xs text-neutral-400 font-mono">/ 100</span>
          </div>
          <p className="mt-1 text-xs text-lime-400 font-semibold truncate drop-shadow-[0_0_6px_rgba(163,230,53,0.3)]">
            Peak Capacity · Green
          </p>
        </div>

        {/* HRV */}
        <div className="neu-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span className="font-semibold tracking-wide">HRV (rMSSD)</span>
            <div className="p-1 rounded-lg bg-[#111319] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white tabular-nums drop-shadow-sm">72</span>
            <span className="text-xs text-neutral-400 font-mono">ms</span>
          </div>
          <p className="mt-1 text-xs text-emerald-400 font-semibold tabular-nums">
            +8 ms vs baseline
          </p>
        </div>

        {/* Resting Heart Rate */}
        <div className="neu-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span className="font-semibold tracking-wide">Resting HR</span>
            <div className="p-1 rounded-lg bg-[#111319] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
              <Heart className="h-4 w-4 text-red-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white tabular-nums drop-shadow-sm">{athlete.restingHeartRate}</span>
            <span className="text-xs text-neutral-400 font-mono">bpm</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Nominal resting state
          </p>
        </div>

        {/* ACWR Workload Ratio */}
        <div className="neu-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span className="font-semibold tracking-wide">Workload (ACWR)</span>
            <div className="p-1 rounded-lg bg-[#111319] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
              <Compass className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white tabular-nums drop-shadow-sm">1.12</span>
            <span className="text-xs text-neutral-400 font-mono">ratio</span>
          </div>
          <p className="mt-1 text-xs text-cyan-400 font-semibold">
            Sweetspot (0.8–1.3)
          </p>
        </div>

        {/* VO2 Max Estimate */}
        <div className="col-span-2 sm:col-span-1 neu-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span className="font-semibold tracking-wide">VO2 Max Est.</span>
            <div className="p-1 rounded-lg bg-[#111319] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white tabular-nums drop-shadow-sm">{athlete.vo2MaxEstimate}</span>
            <span className="text-xs text-neutral-400 font-mono">mL/kg</span>
          </div>
          <p className="mt-1 text-xs text-amber-400 font-semibold">
            Top 2% Demographic
          </p>
        </div>

      </section>

      {/* Real-Time Heart Rate & Intensity Sensor HUD (Acoustic / Mic Access & Simulated ECG) */}
      <LiveHeartRateSensorHUD athlete={athlete} />

      {/* Main Grid: Today's Prescribed Session & Periodization Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's Prescribed Session (7 cols) */}
        <div className="lg:col-span-7 neu-card rounded-3xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-black/40 pb-4">
            <div>
              <div className="text-xs font-semibold text-lime-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(163,230,53,0.25)]">
                Today's Protocol
              </div>
              <h2 className="text-xl font-bold text-white drop-shadow-sm">
                {todayWorkout.workoutName}
              </h2>
            </div>
            <button
              onClick={onOpenWorkoutBuilder}
              className="neu-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1 transition-all"
            >
              <span>Session Details</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-lime-400" />
            </button>
          </div>

          {/* Session Specs Line in Recessed Well */}
          <div className="neu-inset-subtle rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs text-neutral-300 font-mono tabular-nums">
            <div className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-neutral-400" />
              <span>60 mins</span>
            </div>
            <span className="text-neutral-600">|</span>
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              <span>{todayWorkout.targetHeartRateZone}</span>
            </div>
            <span className="text-neutral-600">|</span>
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>RPE {todayWorkout.targetRPE}/10</span>
            </div>
            <span className="text-neutral-600">|</span>
            <span>~{todayWorkout.estimatedCaloricBurn} kcal</span>
          </div>

          {/* Rationale explanation in soft inset */}
          <div className="neu-inset rounded-xl p-3.5 text-xs text-neutral-300 leading-relaxed">
            <span className="font-semibold text-lime-400">Physiological Adaptation: </span>
            {todayWorkout.physiologicalAdaptation}
          </div>

          {/* Interval preview list */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Working Blocks ({todayWorkout.mainBlocks.length} phases)
            </div>
            {todayWorkout.mainBlocks.map((block, idx) => (
              <div
                key={idx}
                className="neu-inset-subtle flex items-center justify-between p-3.5 rounded-xl text-xs transition-colors hover:border-lime-400/20"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-white">
                    {block.title}
                  </div>
                  <div className="text-neutral-400 tabular-nums">
                    {block.intervalsOrReps} · Rest: {block.restInterval}
                  </div>
                </div>
                <div className="text-right">
                  <span className="neu-btn px-2.5 py-1 rounded-md text-neutral-200 font-mono text-[11px] tabular-nums font-semibold">
                    {block.intensity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={onOpenLiveWorkout}
              className="neu-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Begin Session</span>
            </button>

            <button
              onClick={onOpenWorkoutBuilder}
              className="neu-btn px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white transition-all"
            >
              Modify with AI Assistant →
            </button>
          </div>
        </div>

        {/* Periodization & Zone Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Weekly Zone 1-5 Distribution */}
          <div className="neu-card rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="border-b border-black/40 pb-3">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">
                Polarized Training Distribution
              </div>
              <h3 className="text-base font-bold text-white drop-shadow-sm">
                Weekly Zone Exposure ({totalHours.toFixed(1)} hrs total)
              </h3>
            </div>

            {/* Zone bar graphic with sunken neumorphic grooves */}
            <div className="space-y-3.5 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-300">Zone 1: Active Recovery (&lt;135 bpm)</span>
                  <span className="font-mono text-neutral-400 tabular-nums">{zoneHours.z1} hrs (18%)</span>
                </div>
                <div className="neu-inset h-3 w-full rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ width: '18%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-300">Zone 2: Aerobic Base (135–152 bpm)</span>
                  <span className="font-mono text-lime-400 tabular-nums font-semibold">{zoneHours.z2} hrs (42%)</span>
                </div>
                <div className="neu-inset h-3 w-full rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-lime-400 rounded-full shadow-[0_0_8px_rgba(163,230,53,0.6)]" style={{ width: '42%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-300">Zone 3: Tempo (153–165 bpm)</span>
                  <span className="font-mono text-neutral-400 tabular-nums">{zoneHours.z3} hrs (21%)</span>
                </div>
                <div className="neu-inset h-3 w-full rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" style={{ width: '21%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-300">Zone 4: Lactate Threshold (166–175 bpm)</span>
                  <span className="font-mono text-neutral-400 tabular-nums">{zoneHours.z4} hrs (14%)</span>
                </div>
                <div className="neu-inset h-3 w-full rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" style={{ width: '14%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-300">Zone 5: VO2 Max / Anaerobic (176+ bpm)</span>
                  <span className="font-mono text-neutral-400 tabular-nums">{zoneHours.z5} hrs (5%)</span>
                </div>
                <div className="neu-inset h-3 w-full rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" style={{ width: '5%' }} />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-normal pt-1">
              Follows an 80/20 polarized discipline: 80% low-intensity aerobic foundation, 20% high-threshold surge density.
            </p>
          </div>

          {/* 200+ Games & 3D AI Recognition Studio Fast Trigger Card */}
          <div 
            onClick={onOpenFormVision}
            className="neu-card group cursor-pointer rounded-3xl overflow-hidden transition-all hover:scale-[1.02]"
          >
            <div className="h-32 w-full overflow-hidden relative">
              <img
                src="/src/assets/images/athlit_game_basketball_1790677377887.jpg"
                alt="200+ Games and 3D Posture AI"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161a22] via-[#161a22]/40 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                  <span>200+ Games & AI Video Trainer</span>
                </span>
                <span className="text-xs font-medium text-lime-400 flex items-center gap-1">
                  <span>Open Studio</span>
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
            <div className="p-4 text-xs text-slate-600 leading-relaxed">
              Explore 230+ athletic games, upload video for computer vision recognition, train the AI on custom techniques, and preview the 3D kinematic mannequin.
            </div>
          </div>

          {/* Daily Life Schedule & Routine Fast Trigger Card */}
          <div 
            onClick={onOpenDailySchedule}
            className="neu-card group cursor-pointer rounded-3xl p-5 transition-all hover:scale-[1.02] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-lime-700 uppercase tracking-wider">
                  Circadian Routine
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <span>View Timetable</span>
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                Daily Life Athletic Schedule
              </h4>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Circadian wake-up sunlight, joint mobility, nutrition fuel windows, work/study ergonomic breaks, afternoon sport training, and deep sleep hygiene.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800">12 Planned Daily Routines</span>
              <span className="font-bold text-lime-700">Circadian Synced</span>
            </div>
          </div>

        </div>

      </section>
      
      {/* 30-Day Training Volume & RPE Trends Data Visualization (Recharts Engine) */}
      <TrainingVolumeRpeTrendsChart 
        recentLogs={recentLogs}
        athleteName={athlete.name}
        onOpenQuickLog={onOpenQuickLog}
      />

      {/* Recent Training Logs Mini-Feed */}
      <section className="neu-card rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-black/40 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Recent Training Sessions</h3>
            <p className="text-xs text-neutral-400">Last 5 recorded sessions with TRIMP load and physiological notes</p>
          </div>
          <button
            onClick={onOpenCoachConsult}
            className="neu-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-lime-400 hover:text-lime-300 transition-colors"
          >
            Ask Coach Techo about Trends →
          </button>
        </div>

        <div className="divide-y divide-black/40">
          {recentLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{log.title}</span>
                  <span className="text-neutral-500 text-xs">·</span>
                  <span className="text-xs text-neutral-400">{log.sport}</span>
                  <span className="text-neutral-500 text-xs">·</span>
                  <span className="text-xs text-neutral-400">{log.date}</span>
                </div>
                <p className="text-xs text-neutral-400 leading-snug line-clamp-1">{log.notes}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-300 font-mono tabular-nums shrink-0">
                {log.distanceKm && (
                  <span>{log.distanceKm} km</span>
                )}
                <span>{log.durationMinutes} min</span>
                <span>Avg {log.avgHeartRate} bpm</span>
                <span className="neu-btn px-2 py-0.5 rounded text-amber-400 font-semibold text-[11px]">RPE {log.rpe}/10</span>
                <span className="neu-btn px-2 py-0.5 rounded text-lime-400 font-bold text-[11px]">TRIMP {log.trimpLoad}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
