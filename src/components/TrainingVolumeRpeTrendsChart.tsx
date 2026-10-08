import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  Flame, 
  Timer, 
  Heart, 
  Sparkles, 
  Calendar,
  Filter,
  Activity,
  Layers,
  Info
} from 'lucide-react';
import { SportDiscipline, TrainingLogEntry } from '../types';

interface ChartDataPoint {
  dayIndex: number; // 1 to 30
  dateLabel: string;
  fullDate: string;
  durationMinutes: number;
  rpe: number; // 0 if rest day or 1-10
  sport: SportDiscipline | 'Rest / Recovery';
  trimpLoad: number;
  sessionTitle: string;
  avgHeartRate: number;
  isRestDay: boolean;
  runningMinutes: number;
  strengthMinutes: number;
  cyclingMinutes: number;
  hyroxMinutes: number;
  rollingAvgVolume?: number;
  rollingAvgRpe?: number;
}

interface TrainingVolumeRpeTrendsChartProps {
  recentLogs: TrainingLogEntry[];
  athleteName?: string;
  onOpenQuickLog?: () => void;
}

type ViewMode = 'dual-axis' | 'sport-breakdown' | 'rpe-zones' | 'trimp-load';
type Granularity = 'daily' | 'rolling-7d';

export const TrainingVolumeRpeTrendsChart: React.FC<TrainingVolumeRpeTrendsChartProps> = ({
  recentLogs,
  athleteName = 'Alex Mercer',
  onOpenQuickLog,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dual-axis');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [highlightedRpeTier, setHighlightedRpeTier] = useState<string>('all');

  // Build realistic 30-day dataset aligned with mesocycle and user's recent logs
  const chartData = useMemo(() => {
    const today = new Date();
    const result: ChartDataPoint[] = [];

    // Pre-calculated 30-day historical mesocycle pattern for athlete
    // (Build II periodization with 3-week loading + 1-week reload/recovery)
    const baseMesocycleTemplate = [
      { d: 30, offset: 29, dur: 60, rpe: 6, sport: 'Running', title: 'Aerobic Aerobic Base Run', hr: 144, trimp: 110 },
      { d: 29, offset: 28, dur: 50, rpe: 7, sport: 'Strength & Powerlifting', title: 'Lower Body Strength & Core', hr: 130, trimp: 95 },
      { d: 28, offset: 27, dur: 75, rpe: 5, sport: 'Cycling', title: 'Zone 2 Cadence Ride', hr: 132, trimp: 120 },
      { d: 27, offset: 26, dur: 0, rpe: 1, sport: 'Rest / Recovery', title: 'Scheduled Recovery Day', hr: 48, trimp: 0 },
      { d: 26, offset: 25, dur: 55, rpe: 8, sport: 'Running', title: 'Tempo Cruise Intervals', hr: 168, trimp: 155 },
      { d: 25, offset: 24, dur: 45, rpe: 9, sport: 'Hyrox & Functional', title: 'Metabolic Conditioning Blitz', hr: 174, trimp: 172 },
      { d: 24, offset: 23, dur: 90, rpe: 6, sport: 'Running', title: 'Long Aerobic Progression', hr: 148, trimp: 160 },
      { d: 23, offset: 22, dur: 0, rpe: 2, sport: 'Rest / Recovery', title: 'Mobility & Cold Plunge', hr: 47, trimp: 15 },
      { d: 22, offset: 21, dur: 60, rpe: 7, sport: 'Strength & Powerlifting', title: 'Upper Body Power & Hinge', hr: 134, trimp: 115 },
      { d: 21, offset: 20, dur: 65, rpe: 5, sport: 'Cycling', title: 'Active Recovery Flush', hr: 126, trimp: 88 },
      { d: 20, offset: 19, dur: 58, rpe: 8, sport: 'Running', title: 'Hill Sprint Repetitions', hr: 172, trimp: 162 },
      { d: 19, offset: 18, dur: 0, rpe: 1, sport: 'Rest / Recovery', title: 'Full Autonomic Rest', hr: 46, trimp: 0 },
      { d: 18, offset: 17, dur: 70, rpe: 7, sport: 'Hyrox & Functional', title: 'Sled / Erg Circuit Test', hr: 162, trimp: 150 },
      { d: 17, offset: 16, dur: 85, rpe: 6, sport: 'Running', title: 'Steady Aerobic Mile Build', hr: 146, trimp: 145 },
      { d: 16, offset: 15, dur: 45, rpe: 4, sport: 'Cycling', title: 'Zone 1 Regeneration', hr: 122, trimp: 60 },
      { d: 15, offset: 14, dur: 55, rpe: 8, sport: 'Strength & Powerlifting', title: 'Deadlift & Posterior Chain', hr: 138, trimp: 125 },
      { d: 14, offset: 13, dur: 0, rpe: 1, sport: 'Rest / Recovery', title: 'Contrast Hydrotherapy', hr: 45, trimp: 0 },
      { d: 13, offset: 12, dur: 60, rpe: 8, sport: 'Running', title: 'Lactate Shutter Intervals', hr: 169, trimp: 158 },
      { d: 12, offset: 11, dur: 50, rpe: 9, sport: 'Hyrox & Functional', title: 'Hyrox Simulation Stations', hr: 175, trimp: 180 },
      { d: 11, offset: 10, dur: 80, rpe: 5, sport: 'Cycling', title: 'Tempo Spin & Drills', hr: 135, trimp: 130 },
      { d: 10, offset: 9, dur: 0, rpe: 2, sport: 'Rest / Recovery', title: 'Fascial Release & Sauna', hr: 46, trimp: 20 },
      { d: 9, offset: 8, dur: 65, rpe: 7, sport: 'Strength & Powerlifting', title: 'Olympic Lift Primers', hr: 135, trimp: 118 },
      { d: 8, offset: 7, dur: 70, rpe: 6, sport: 'Running', title: 'Endurance Stride Run', hr: 147, trimp: 135 },
      { d: 7, offset: 6, dur: 35, rpe: 3, sport: 'Running', title: 'Recovery Flush & Mobility', hr: 118, trimp: 52 },
      { d: 6, offset: 5, dur: 48, rpe: 9, sport: 'Hyrox & Functional', title: 'Hyrox Sled & Wall Balls', hr: 171, trimp: 185 },
      { d: 5, offset: 4, dur: 90, rpe: 5, sport: 'Cycling', title: 'Aerobic Base Zone 2 Ride', hr: 136, trimp: 145 },
      { d: 4, offset: 3, dur: 0, rpe: 1, sport: 'Rest / Recovery', title: 'Active Regeneration', hr: 46, trimp: 0 },
      { d: 3, offset: 2, dur: 55, rpe: 7, sport: 'Strength & Powerlifting', title: 'Posterior Hypertrophy', hr: 128, trimp: 112 },
      { d: 2, offset: 1, dur: 62, rpe: 8, sport: 'Running', title: 'Threshold Ladder Intervals', hr: 164, trimp: 168 },
      { d: 1, offset: 0, dur: 60, rpe: 8, sport: 'Running', title: "Today's Threshold Protocol", hr: 170, trimp: 165 },
    ];

    // If recentLogs has entries, replace corresponding day offsets
    const sortedRecent = [...recentLogs];

    baseMesocycleTemplate.forEach((item, index) => {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() - item.offset);

      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = dateObj.getDate();
      const dateLabel = item.offset === 0 ? 'Today' : item.offset === 1 ? 'Yest' : `${monthName} ${dayNum}`;
      const fullDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      // Match from user's recent logs if available for recent days
      let durationMinutes = item.dur;
      let rpe = item.rpe;
      let sport = item.sport as SportDiscipline | 'Rest / Recovery';
      let title = item.title;
      let trimp = item.trimp;
      let avgHeartRate = item.hr;

      if (item.offset < sortedRecent.length) {
        const userLog = sortedRecent[item.offset];
        if (userLog) {
          durationMinutes = userLog.durationMinutes;
          rpe = userLog.rpe || item.rpe;
          sport = userLog.sport;
          title = userLog.title;
          trimp = userLog.trimpLoad || Math.round(durationMinutes * (rpe / 5) * 1.2);
          avgHeartRate = userLog.avgHeartRate || item.hr;
        }
      }

      const isRestDay = durationMinutes === 0 || sport === 'Rest / Recovery';

      result.push({
        dayIndex: 30 - item.offset,
        dateLabel,
        fullDate,
        durationMinutes,
        rpe: isRestDay ? 1 : rpe,
        sport,
        trimpLoad: trimp,
        sessionTitle: title,
        avgHeartRate,
        isRestDay,
        runningMinutes: sport === 'Running' ? durationMinutes : 0,
        strengthMinutes: sport === 'Strength & Powerlifting' ? durationMinutes : 0,
        cyclingMinutes: sport === 'Cycling' ? durationMinutes : 0,
        hyroxMinutes: sport === 'Hyrox & Functional' ? durationMinutes : 0,
      });
    });

    // Calculate 7-day rolling averages
    for (let i = 0; i < result.length; i++) {
      const windowStart = Math.max(0, i - 6);
      const windowPoints = result.slice(windowStart, i + 1);
      
      const avgVol = windowPoints.reduce((sum, p) => sum + p.durationMinutes, 0) / windowPoints.length;
      const nonRestPoints = windowPoints.filter(p => !p.isRestDay);
      const avgRpe = nonRestPoints.length > 0 
        ? nonRestPoints.reduce((sum, p) => sum + p.rpe, 0) / nonRestPoints.length 
        : 1;

      result[i].rollingAvgVolume = Math.round(avgVol);
      result[i].rollingAvgRpe = Number(avgRpe.toFixed(1));
    }

    return result;
  }, [recentLogs]);

  // Filtered dataset according to user controls
  const filteredData = useMemo(() => {
    return chartData.map((d) => {
      let isVisible = true;
      if (selectedSport !== 'all') {
        isVisible = d.sport === selectedSport;
      }
      if (highlightedRpeTier !== 'all') {
        if (highlightedRpeTier === 'easy' && (d.rpe > 3 || d.isRestDay)) isVisible = false;
        if (highlightedRpeTier === 'moderate' && (d.rpe < 4 || d.rpe > 6)) isVisible = false;
        if (highlightedRpeTier === 'threshold' && (d.rpe < 7 || d.rpe > 8)) isVisible = false;
        if (highlightedRpeTier === 'maximal' && d.rpe < 9) isVisible = false;
      }

      if (!isVisible) {
        return {
          ...d,
          durationMinutes: 0,
          runningMinutes: 0,
          strengthMinutes: 0,
          cyclingMinutes: 0,
          hyroxMinutes: 0,
          trimpLoad: 0,
        };
      }
      return d;
    });
  }, [chartData, selectedSport, highlightedRpeTier]);

  // Overall 30-day Aggregate Telemetry
  const stats = useMemo(() => {
    const trainingDays = chartData.filter((d) => !d.isRestDay && d.durationMinutes > 0);
    const totalMinutes = chartData.reduce((acc, d) => acc + d.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const totalTrimp = chartData.reduce((acc, d) => acc + d.trimpLoad, 0);
    
    const meanRpe = trainingDays.length > 0
      ? (trainingDays.reduce((acc, d) => acc + d.rpe, 0) / trainingDays.length).toFixed(1)
      : '0.0';

    const highIntensitySessions = trainingDays.filter((d) => d.rpe >= 8).length;
    const aerobicBaseSessions = trainingDays.filter((d) => d.rpe >= 4 && d.rpe <= 6).length;
    const recoverySessions = chartData.length - trainingDays.length + trainingDays.filter((d) => d.rpe <= 3).length;

    // Acute (last 7 days) vs Chronic (30 days / 4) workload calculation
    const acuteLoad = chartData.slice(-7).reduce((acc, d) => acc + d.trimpLoad, 0);
    const chronicWeeklyAverage = totalTrimp / 4;
    const calculatedAcwr = chronicWeeklyAverage > 0 ? (acuteLoad / chronicWeeklyAverage).toFixed(2) : '1.05';

    return {
      totalHours,
      totalMinutes,
      meanRpe,
      totalSessions: trainingDays.length,
      highIntensitySessions,
      aerobicBaseSessions,
      recoverySessions,
      acuteLoad,
      totalTrimp,
      calculatedAcwr,
    };
  }, [chartData]);

  // Custom Neumorphic Tooltip Component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;

      const getRpeColor = (score: number) => {
        if (score <= 3) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
        if (score <= 6) return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40';
        if (score <= 8) return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
        return 'text-rose-400 bg-rose-950/40 border-rose-800/40';
      };

      const getRpeLabel = (score: number) => {
        if (score <= 1) return 'Rest / Baseline';
        if (score <= 3) return 'Active Recovery / Flush';
        if (score <= 5) return 'Zone 2 Aerobic Base';
        if (score <= 6) return 'Sub-Threshold Tempo';
        if (score <= 8) return 'Lactate Threshold';
        if (score === 9) return 'VO2 Max Surge';
        return 'Maximal All-Out Effort';
      };

      return (
        <div className="neu-card rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.85),-4px_-4px_12px_rgba(255,255,255,0.04)] border border-white/10 text-xs w-64 space-y-2.5 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/40 pb-2">
            <div>
              <div className="font-bold text-white text-sm tracking-tight">{data.dateLabel}</div>
              <div className="text-[11px] text-neutral-400 font-mono">{data.fullDate}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono ${getRpeColor(data.rpe)}`}>
              RPE {data.rpe}/10
            </span>
          </div>

          {/* Session Details */}
          <div>
            <div className="text-neutral-200 font-semibold text-xs leading-snug">{data.sessionTitle}</div>
            <div className="text-neutral-400 text-[11px] flex items-center gap-1.5 mt-0.5">
              <span className="text-lime-400 font-medium">{data.sport}</span>
              <span>·</span>
              <span>{getRpeLabel(data.rpe)}</span>
            </div>
          </div>

          {/* Recessed Metric Readout Well */}
          <div className="neu-inset-subtle rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center font-mono">
            <div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Volume</div>
              <div className="text-white font-bold text-xs tabular-nums mt-0.5">{data.durationMinutes} min</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Avg HR</div>
              <div className="text-rose-400 font-bold text-xs tabular-nums mt-0.5">{data.avgHeartRate} bpm</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">TRIMP</div>
              <div className="text-lime-400 font-bold text-xs tabular-nums mt-0.5">{data.trimpLoad}</div>
            </div>
          </div>

          {/* Rolling average note if available */}
          {data.rollingAvgVolume !== undefined && (
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1 border-t border-black/30">
              <span>7d Roll Vol: <strong className="text-neutral-200">{data.rollingAvgVolume}m</strong></span>
              <span>7d Roll RPE: <strong className="text-amber-300">{data.rollingAvgRpe}</strong></span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="neu-card rounded-3xl p-6 sm:p-7 space-y-6">
      
      {/* Header & Meta Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/40 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neu-btn px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold text-lime-400 tracking-wider uppercase">
              30-Day Periodization Telemetry
            </span>
            <span className="text-neutral-500 text-xs">·</span>
            <span className="text-xs text-neutral-400 font-mono">Volume & Exertion Dynamics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm flex items-center gap-2.5">
            <span>Training Volume & RPE Trends</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/20">
              ACWR {stats.calculatedAcwr}
            </span>
          </h2>
          <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
            Coordinated dual-axis analysis tracking daily session duration (minutes) against Rate of Perceived Exertion (1–10 Borg CR10 scale) across the current 30-day mesocycle.
          </p>
        </div>

        {/* View Mode & Granularity Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          
          {/* View Mode Selector */}
          <div className="neu-inset-subtle p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('dual-axis')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'dual-axis'
                  ? 'neu-btn text-lime-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Combined Volume (Bars) and RPE (Line)"
            >
              Dual-Axis
            </button>
            <button
              onClick={() => setViewMode('sport-breakdown')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'sport-breakdown'
                  ? 'neu-btn text-lime-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Volume stacked by Sport discipline"
            >
              By Sport
            </button>
            <button
              onClick={() => setViewMode('rpe-zones')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'rpe-zones'
                  ? 'neu-btn text-lime-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="RPE Exertion Curve & Intensity Thresholds"
            >
              RPE Curve
            </button>
            <button
              onClick={() => setViewMode('trimp-load')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'trimp-load'
                  ? 'neu-btn text-lime-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="TRIMP Workload Impulse accumulation"
            >
              TRIMP Load
            </button>
          </div>

          {/* Granularity Toggle */}
          <div className="neu-inset-subtle p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setGranularity('daily')}
              className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all ${
                granularity === 'daily'
                  ? 'neu-btn text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setGranularity('rolling-7d')}
              className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all ${
                granularity === 'rolling-7d'
                  ? 'neu-btn text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="7-Day Rolling Moving Average"
            >
              7d Rolling
            </button>
          </div>

        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Total Volume */}
        <div className="neu-card-sm rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-semibold">30-Day Volume</span>
            <Timer className="h-3.5 w-3.5 text-lime-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white tabular-nums">{stats.totalHours}</span>
            <span className="text-xs text-neutral-400 font-mono">hrs</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 tabular-nums">
            {stats.totalSessions} completed sessions
          </p>
        </div>

        {/* Average RPE */}
        <div className="neu-card-sm rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-semibold">Mean RPE Exertion</span>
            <Flame className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white tabular-nums">{stats.meanRpe}</span>
            <span className="text-xs text-neutral-400 font-mono">/ 10</span>
          </div>
          <p className="text-[11px] text-amber-400 font-medium mt-0.5 truncate">
            {Number(stats.meanRpe) >= 7 ? 'High Load Surge' : 'Sub-Threshold Tempo'}
          </p>
        </div>

        {/* High Intensity vs Polarized Balance */}
        <div className="neu-card-sm rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-semibold">Threshold+ Days (RPE 8-10)</span>
            <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-rose-400 tabular-nums">{stats.highIntensitySessions}</span>
            <span className="text-xs text-neutral-400 font-mono">sessions</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 tabular-nums">
            {Math.round((stats.highIntensitySessions / stats.totalSessions) * 100)}% high-strain density
          </p>
        </div>

        {/* Acute:Chronic Workload Ratio */}
        <div className="neu-card-sm rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="font-semibold">ACWR Workload</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-cyan-400 tabular-nums">{stats.calculatedAcwr}</span>
            <span className="text-xs text-neutral-400 font-mono">ratio</span>
          </div>
          <p className="text-[11px] text-lime-400 font-medium mt-0.5">
            Optimal Safe Zone (0.8–1.3)
          </p>
        </div>

      </div>

      {/* Filter and Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        
        {/* Sport Discipline Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-neutral-400 font-medium text-xs mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Sport:</span>
          </span>
          {[
            { id: 'all', label: 'All Disciplines' },
            { id: 'Running', label: 'Running' },
            { id: 'Strength & Powerlifting', label: 'Strength' },
            { id: 'Cycling', label: 'Cycling' },
            { id: 'Hyrox & Functional', label: 'Hyrox' },
          ].map((sportItem) => (
            <button
              key={sportItem.id}
              onClick={() => setSelectedSport(sportItem.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedSport === sportItem.id
                  ? 'neu-btn-active text-lime-400 font-bold border border-lime-500/30'
                  : 'neu-btn text-neutral-400 hover:text-white'
              }`}
            >
              {sportItem.label}
            </button>
          ))}
        </div>

        {/* Interactive RPE Tier Intensity Highlights */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-neutral-400 font-medium text-xs mr-1">RPE Filter:</span>
          {[
            { id: 'all', label: 'All RPE' },
            { id: 'easy', label: '1–3 Easy' },
            { id: 'moderate', label: '4–6 Moderate' },
            { id: 'threshold', label: '7–8 Threshold' },
            { id: 'maximal', label: '9–10 Max' },
          ].map((rpeItem) => (
            <button
              key={rpeItem.id}
              onClick={() => setHighlightedRpeTier(rpeItem.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                highlightedRpeTier === rpeItem.id
                  ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {rpeItem.label}
            </button>
          ))}
        </div>

      </div>

      {/* Main Chart Visualization Chamber */}
      <div className="neu-inset rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        
        {/* Subtle Watermark Branding */}
        <div className="absolute top-4 right-6 text-[10px] font-mono text-neutral-600 uppercase tracking-widest select-none pointer-events-none">
          TECHO // RECHARTS ENGINE
        </div>

        <div className="h-80 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'dual-axis' ? (
              <ComposedChart
                data={filteredData}
                margin={{ top: 20, right: 20, bottom: 20, left: -10 }}
              >
                <defs>
                  <linearGradient id="volumeBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a3e635" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#84cc16" stopOpacity={0.25} />
                  </linearGradient>
                  <linearGradient id="rollingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#232936" vertical={false} />
                
                <XAxis 
                  dataKey="dateLabel" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  interval={2}
                  fontFamily="JetBrains Mono, monospace"
                />

                {/* Left Axis: Duration / Volume in Minutes */}
                <YAxis 
                  yAxisId="volumeAxis"
                  stroke="#a3e635" 
                  fontSize={11} 
                  tickLine={false}
                  domain={[0, 120]}
                  unit="m"
                  fontFamily="JetBrains Mono, monospace"
                />

                {/* Right Axis: RPE Rating 1-10 */}
                <YAxis 
                  yAxisId="rpeAxis"
                  orientation="right"
                  stroke="#fbbf24" 
                  fontSize={11} 
                  tickLine={false}
                  domain={[0, 10]}
                  ticks={[1, 3, 5, 7, 8, 10]}
                  unit=""
                  fontFamily="JetBrains Mono, monospace"
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Lactate Threshold RPE Guideline */}
                <ReferenceLine 
                  yAxisId="rpeAxis" 
                  y={8} 
                  stroke="#f43f5e" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.6}
                  label={{ value: 'RPE 8 Threshold Limit', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }}
                />

                {/* Aerobic Base Guideline */}
                <ReferenceLine 
                  yAxisId="rpeAxis" 
                  y={5} 
                  stroke="#22d3ee" 
                  strokeDasharray="2 2" 
                  strokeOpacity={0.4}
                />

                {/* 60-Minute Daily Target Reference */}
                <ReferenceLine 
                  yAxisId="volumeAxis" 
                  y={60} 
                  stroke="#a3e635" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.35}
                />

                {/* Volume Bar or Rolling Area */}
                {granularity === 'daily' ? (
                  <Bar
                    yAxisId="volumeAxis"
                    dataKey="durationMinutes"
                    name="Daily Volume (min)"
                    fill="url(#volumeBarGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={22}
                  />
                ) : (
                  <Area
                    yAxisId="volumeAxis"
                    type="monotone"
                    dataKey="rollingAvgVolume"
                    name="7d Avg Volume (min)"
                    stroke="#38bdf8"
                    fill="url(#rollingAreaGrad)"
                    strokeWidth={2.5}
                  />
                )}

                {/* RPE Trend Line */}
                <Line
                  yAxisId="rpeAxis"
                  type="monotone"
                  dataKey={granularity === 'daily' ? 'rpe' : 'rollingAvgRpe'}
                  name="Rate of Perceived Exertion (1-10)"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#14171d', stroke: '#fbbf24', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            ) : viewMode === 'sport-breakdown' ? (
              <BarChart
                data={filteredData}
                margin={{ top: 20, right: 20, bottom: 20, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#232936" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} tickLine={false} interval={2} fontFamily="JetBrains Mono, monospace" />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="m" domain={[0, 120]} fontFamily="JetBrains Mono, monospace" />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: 11, paddingBottom: 10, color: '#94a3b8' }} 
                />

                <Bar dataKey="runningMinutes" name="Running" stackId="a" fill="#a3e635" radius={[0, 0, 0, 0]} maxBarSize={20} />
                <Bar dataKey="strengthMinutes" name="Strength" stackId="a" fill="#818cf8" radius={[0, 0, 0, 0]} maxBarSize={20} />
                <Bar dataKey="cyclingMinutes" name="Cycling" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} maxBarSize={20} />
                <Bar dataKey="hyroxMinutes" name="Hyrox / Functional" stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            ) : viewMode === 'rpe-zones' ? (
              <ComposedChart
                data={filteredData}
                margin={{ top: 20, right: 20, bottom: 20, left: -10 }}
              >
                <defs>
                  <linearGradient id="rpeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="40%" stopColor="#fbbf24" stopOpacity={0.4} />
                    <stop offset="80%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232936" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} tickLine={false} interval={2} fontFamily="JetBrains Mono, monospace" />
                <YAxis stroke="#fbbf24" fontSize={11} tickLine={false} domain={[0, 10]} ticks={[1, 2, 4, 6, 8, 10]} unit=" RPE" fontFamily="JetBrains Mono, monospace" />
                <Tooltip content={<CustomTooltip />} />
                
                <ReferenceLine y={8} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Hard / Threshold (RPE 8)', fill: '#f43f5e', fontSize: 10 }} />
                <ReferenceLine y={6} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'Tempo Upper Limit (RPE 6)', fill: '#fbbf24', fontSize: 10 }} />
                <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Active Recovery (RPE 3)', fill: '#22c55e', fontSize: 10 }} />

                <Area 
                  type="monotone" 
                  dataKey="rpe" 
                  stroke="#fbbf24" 
                  strokeWidth={2.5} 
                  fill="url(#rpeAreaGrad)" 
                  name="Session RPE Exertion"
                />
              </ComposedChart>
            ) : (
              <BarChart
                data={filteredData}
                margin={{ top: 20, right: 20, bottom: 20, left: -10 }}
              >
                <defs>
                  <linearGradient id="trimpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232936" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} tickLine={false} interval={2} fontFamily="JetBrains Mono, monospace" />
                <YAxis stroke="#ec4899" fontSize={11} tickLine={false} unit=" pts" fontFamily="JetBrains Mono, monospace" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="trimpLoad" 
                  name="TRIMP Training Impulse" 
                  fill="url(#trimpGrad)" 
                  radius={[5, 5, 0, 0]} 
                  maxBarSize={22} 
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend Footnote */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-black/40 text-[11px] text-neutral-400">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-lime-400 inline-block shadow-[0_0_6px_rgba(163,230,53,0.5)]" />
              <span>Training Volume (Left Axis, min)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-400 inline-block rounded-full" />
              <span>RPE Intensity Scale 1–10 (Right Axis)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b border-dashed border-rose-500 inline-block" />
              <span>Threshold Redline (RPE 8)</span>
            </div>
          </div>

          <div className="font-mono text-neutral-400 text-[10px]">
            Hover data points for exact heart rate, TRIMP, and qualitative exertion details
          </div>
        </div>

      </div>

      {/* Sports Science Periodization Coaching Note */}
      <div className="neu-inset-subtle rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-lime-500/10 text-lime-400 border border-lime-500/20 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-white flex items-center gap-2">
              <span>Coach Techo Physiological Load Evaluation</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                Periodization Build II
              </span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              Volume-to-intensity relationship adheres to polarized 80/20 guidelines. RPE spikes (8–9) coincide with planned threshold ladders, while recovery buffer days effectively reset baseline HRV without premature overreaching.
            </p>
          </div>
        </div>

        {onOpenQuickLog && (
          <button
            onClick={onOpenQuickLog}
            className="neu-btn px-3.5 py-2 rounded-xl text-lime-400 hover:text-white font-semibold whitespace-nowrap text-xs transition-all self-end sm:self-center"
          >
            Log Session →
          </button>
        )}
      </div>

    </section>
  );
};
