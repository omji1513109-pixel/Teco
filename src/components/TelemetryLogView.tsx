import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Heart, 
  Timer, 
  Gauge,
  X
} from 'lucide-react';
import { SportDiscipline, TrainingLogEntry } from '../types';

interface TelemetryLogViewProps {
  logs: TrainingLogEntry[];
  onAddLog: (log: TrainingLogEntry) => void;
  isQuickLogOpen: boolean;
  onCloseQuickLog: () => void;
}

export function getRpeMeta(rpe: number) {
  const score = Math.max(1, Math.min(10, Math.round(rpe)));
  switch (score) {
    case 1:
      return {
        score: 1,
        label: 'Very Light',
        zone: 'Recovery',
        color: 'text-emerald-400',
        border: 'border-emerald-400/30',
        bg: 'bg-emerald-400/10',
        barColor: 'bg-emerald-400',
        description: 'Hardly any exertion. Breathing effortless, normal conversation possible.',
      };
    case 2:
      return {
        score: 2,
        label: 'Easy Active',
        zone: 'Warm-up / Flush',
        color: 'text-emerald-400',
        border: 'border-emerald-400/30',
        bg: 'bg-emerald-400/10',
        barColor: 'bg-emerald-400',
        description: 'Gentle aerobic pace. Full conversational sentences, sustained indefinitely.',
      };
    case 3:
      return {
        score: 3,
        label: 'Light Aerobic',
        zone: 'Zone 2 Base',
        color: 'text-teal-400',
        border: 'border-teal-400/30',
        bg: 'bg-teal-400/10',
        barColor: 'bg-teal-400',
        description: 'Steady conversational pace. Drives mitochondrial density without fatigue accumulation.',
      };
    case 4:
      return {
        score: 4,
        label: 'Moderate',
        zone: 'Zone 2-3 Transition',
        color: 'text-cyan-400',
        border: 'border-cyan-400/30',
        bg: 'bg-cyan-400/10',
        barColor: 'bg-cyan-400',
        description: 'Moderate aerobic effort. Breathing deeper, sentences spoken with slight pauses.',
      };
    case 5:
      return {
        score: 5,
        label: 'Somewhat Hard',
        zone: 'Zone 3 Tempo',
        color: 'text-blue-400',
        border: 'border-blue-400/30',
        bg: 'bg-blue-400/10',
        barColor: 'bg-blue-400',
        description: 'Fast sustained rhythm. Speaking limited to short phrases. Requires sustained focus.',
      };
    case 6:
      return {
        score: 6,
        label: 'Vigorous',
        zone: 'Sub-Threshold Sweetspot',
        color: 'text-amber-400',
        border: 'border-amber-400/30',
        bg: 'bg-amber-400/10',
        barColor: 'bg-amber-400',
        description: 'Challenging effort. Breathing rhythmic and heavy; conversation limited to 3-4 words.',
      };
    case 7:
      return {
        score: 7,
        label: 'Hard',
        zone: 'Lactate Turnpoint (Zone 4)',
        color: 'text-amber-500',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10',
        barColor: 'bg-amber-500',
        description: 'Significant muscular burn. Deep, rapid ventilation. Only 1-2 words per breath.',
      };
    case 8:
      return {
        score: 8,
        label: 'Very Hard',
        zone: 'Threshold Surge / VO2 Max',
        color: 'text-orange-500',
        border: 'border-orange-500/30',
        bg: 'bg-orange-500/10',
        barColor: 'bg-orange-500',
        description: 'Severe respiratory strain. Acidosis clearing speed tested. Sustainable 3-8 minutes.',
      };
    case 9:
      return {
        score: 9,
        label: 'Extremely Hard',
        zone: 'Anaerobic Glycolytic Surge',
        color: 'text-rose-500',
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/10',
        barColor: 'bg-rose-500',
        description: 'Near maximal effort. Heavy lactic burn. Sustainable for 30-90 seconds only.',
      };
    case 10:
    default:
      return {
        score: 10,
        label: 'Maximal All-Out',
        zone: 'Neuromuscular Sprint / 1RM',
        color: 'text-red-500',
        border: 'border-red-500/50',
        bg: 'bg-red-500/20',
        barColor: 'bg-red-500',
        description: 'Absolute maximal exertion. Zero reserve left; immediate breathlessness and failure.',
      };
  }
}

export const TelemetryLogView: React.FC<TelemetryLogViewProps> = ({
  logs,
  onAddLog,
  isQuickLogOpen,
  onCloseQuickLog,
}) => {
  const [filterSport, setFilterSport] = useState<string>('All');
  const [filterRpeTier, setFilterRpeTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for logging a session
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState<SportDiscipline>('Running');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [avgHeartRate, setAvgHeartRate] = useState(152);
  const [maxHeartRate, setMaxHeartRate] = useState(174);
  const [distanceKm, setDistanceKm] = useState<number | ''>(8.5);
  const [rpe, setRpe] = useState<number>(7);
  const [notes, setNotes] = useState('');

  // Calculate TRIMP load automatically
  const calculateTrimp = (duration: number, avgHR: number, maxHR: number) => {
    const hrFraction = Math.min(1.0, Math.max(0.4, (avgHR - 46) / (maxHR - 46)));
    const trimp = Math.round(duration * hrFraction * 0.64 * Math.exp(1.92 * hrFraction));
    return trimp;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newLog: TrainingLogEntry = {
      id: `log-${Date.now()}`,
      date: 'Today',
      title: title.trim(),
      sport,
      durationMinutes: Number(durationMinutes),
      avgHeartRate: Number(avgHeartRate),
      maxHeartRate: Number(maxHeartRate),
      distanceKm: distanceKm ? Number(distanceKm) : undefined,
      rpe: Number(rpe),
      trimpLoad: calculateTrimp(Number(durationMinutes), Number(avgHeartRate), Number(maxHeartRate)),
      notes: notes.trim() || 'Completed as prescribed.',
    };

    onAddLog(newLog);
    onCloseQuickLog();
    setTitle('');
    setNotes('');
    setRpe(7);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSport = filterSport === 'All' || log.sport === filterSport;
    
    let matchesRpe = true;
    if (filterRpeTier === 'light') {
      matchesRpe = log.rpe <= 3;
    } else if (filterRpeTier === 'moderate') {
      matchesRpe = log.rpe >= 4 && log.rpe <= 6;
    } else if (filterRpeTier === 'hard') {
      matchesRpe = log.rpe >= 7 && log.rpe <= 8;
    } else if (filterRpeTier === 'max') {
      matchesRpe = log.rpe >= 9;
    }

    const matchesSearch = 
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.notes.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSport && matchesRpe && matchesSearch;
  });

  const totalDuration = logs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalTrimp = logs.reduce((acc, l) => acc + l.trimpLoad, 0);
  const avgRpeNum = logs.length > 0 ? (logs.reduce((acc, l) => acc + l.rpe, 0) / logs.length) : 0;
  const avgRpeStr = avgRpeNum.toFixed(1);
  const avgRpeMeta = getRpeMeta(Math.round(avgRpeNum) || 7);

  const activeModalRpeMeta = getRpeMeta(rpe);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/40 pb-6">
        <div>
          <div className="text-xs font-semibold text-lime-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]">
            Training Telemetry & Intensity Tracking
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm">
            Athletic Performance Logbook
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track subjective Rate of Perceived Exertion (RPE 1-10), TRIMP impulse, and cardiovascular strain.
          </p>
        </div>

        <button
          onClick={onCloseQuickLog}
          className="neu-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Record New Session</span>
        </button>
      </div>

      {/* Metric summary strip in Neumorphic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Volume */}
        <div className="neu-card rounded-2xl p-5 shadow-[7px_7px_18px_rgba(0,0,0,0.65),-5px_-5px_12px_rgba(255,255,255,0.03)]">
          <span className="text-xs text-neutral-400 font-semibold tracking-wide">Total Volume Recorded</span>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums drop-shadow-sm">
              {(totalDuration / 60).toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400 font-mono">hours</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">{logs.length} completed sessions</p>
        </div>

        {/* Accumulated TRIMP */}
        <div className="neu-card rounded-2xl p-5 shadow-[7px_7px_18px_rgba(0,0,0,0.65),-5px_-5px_12px_rgba(255,255,255,0.03)]">
          <span className="text-xs text-neutral-400 font-semibold tracking-wide">Accumulated TRIMP Load</span>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-3xl font-extrabold text-lime-400 font-mono tabular-nums drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]">
              {totalTrimp}
            </span>
            <span className="text-xs text-neutral-400 font-mono">load units</span>
          </div>
          <p className="text-xs text-lime-500/80 mt-1 font-semibold">Productive stimulus band</p>
        </div>

        {/* Mean Session RPE */}
        <div className="neu-card rounded-2xl p-5 shadow-[7px_7px_18px_rgba(0,0,0,0.65),-5px_-5px_12px_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-semibold tracking-wide">Mean Session RPE (1-10)</span>
            <div className="p-1 rounded-lg bg-[#111319] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
              <Gauge className={`h-4 w-4 ${avgRpeMeta.color}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className={`text-3xl font-extrabold font-mono tabular-nums ${avgRpeMeta.color}`}>
              {avgRpeStr}
            </span>
            <span className="text-xs text-neutral-400 font-mono">/ 10</span>
            <span className="text-xs font-bold text-neutral-200 ml-1">
              · {avgRpeMeta.label}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 truncate">
            {avgRpeMeta.zone}
          </p>
        </div>

      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3.5">
        
        {/* Row 1: Sport Filter & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Interactive Neumorphic Segmented Sport Filter */}
          <div className="neu-inset-subtle p-1 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {['All', 'Running', 'Hyrox & Functional', 'Strength & Powerlifting', 'Cycling'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSport(s)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  filterSport === s
                    ? 'neu-btn-active text-lime-400 border border-lime-400/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search input with Neumorphic Inset well */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search session notes..."
              className="neu-inset w-full rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: RPE Intensity Tier Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-neutral-400 font-semibold shrink-0 flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5 text-lime-400" />
            <span>RPE Intensity:</span>
          </span>
          <div className="neu-inset-subtle p-1 rounded-xl flex items-center gap-1 shrink-0">
            <button
              onClick={() => setFilterRpeTier('All')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterRpeTier === 'All' ? 'neu-btn-active text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Intensities
            </button>
            <button
              onClick={() => setFilterRpeTier('light')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterRpeTier === 'light' ? 'neu-btn-active text-emerald-400 border border-emerald-400/30' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Easy / Base (RPE 1-3)
            </button>
            <button
              onClick={() => setFilterRpeTier('moderate')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterRpeTier === 'moderate' ? 'neu-btn-active text-cyan-400 border border-cyan-400/30' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Moderate / Tempo (RPE 4-6)
            </button>
            <button
              onClick={() => setFilterRpeTier('hard')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterRpeTier === 'hard' ? 'neu-btn-active text-amber-400 border border-amber-400/30' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Threshold / Hard (RPE 7-8)
            </button>
            <button
              onClick={() => setFilterRpeTier('max')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterRpeTier === 'max' ? 'neu-btn-active text-rose-400 border border-rose-400/30' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Maximal / VO2 (RPE 9-10)
            </button>
          </div>
        </div>

      </div>

      {/* Session Logs List in Neumorphic Enclosure */}
      <div className="neu-card rounded-3xl overflow-hidden shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)]">
        <div className="divide-y divide-black/40">
          {filteredLogs.map((log) => {
            const meta = getRpeMeta(log.rpe);

            return (
              <div key={log.id} className="p-5 sm:p-6 hover:bg-[#12141a]/60 transition-colors space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: Title, Sport, Date, and Notes */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-sm font-bold text-white truncate drop-shadow-sm">{log.title}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-400">{log.sport}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-500 font-mono">{log.date}</span>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl line-clamp-2">
                      {log.notes}
                    </p>
                  </div>

                  {/* Right Column: Intensity Telemetry & Tactile RPE 1-10 Gauge */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
                    
                    {/* Basic telemetry metrics in inset well */}
                    <div className="neu-inset-subtle px-3.5 py-1.5 rounded-xl flex items-center gap-3 text-xs font-mono tabular-nums text-neutral-300">
                      {log.distanceKm && (
                        <span>{log.distanceKm} km</span>
                      )}
                      <div className="flex items-center gap-1 text-neutral-300">
                        <Timer className="h-3 w-3 text-neutral-500" />
                        <span>{log.durationMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-400">
                        <Heart className="h-3 w-3" />
                        <span>{log.avgHeartRate} bpm</span>
                      </div>
                      <span className="neu-btn px-2 py-0.5 rounded text-lime-400 font-bold text-[11px]">
                        TRIMP {log.trimpLoad}
                      </span>
                    </div>

                    {/* PROMINENT TACTILE NEUMORPHIC RPE GAUGE */}
                    <div 
                      className={`neu-card-sm flex flex-col items-end rounded-2xl px-3.5 py-2 border transition-all ${meta.border} hover:scale-105`}
                      title={`RPE ${log.rpe}/10 — ${meta.label} (${meta.zone}): ${meta.description}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono">
                          RPE
                        </span>
                        <span className={`text-base font-black font-mono tabular-nums ${meta.color} drop-shadow-[0_0_8px_currentColor]`}>
                          {log.rpe}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">/ 10</span>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[10px] font-bold ${meta.color} leading-none`}>
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-0.5 ml-1">
                          {Array.from({ length: 10 }).map((_, barIdx) => (
                            <span
                              key={barIdx}
                              className={`h-1.5 w-0.5 rounded-full ${
                                barIdx < log.rpe ? meta.barColor : 'bg-neutral-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-xs text-neutral-500">
              No matching workout logs found for this filter combination.
            </div>
          )}
        </div>
      </div>

      {/* QUICK LOG MODAL IN NEUMORPHIC ELEVATED CHAMBER */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="neu-card relative w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-[16px_16px_40px_rgba(0,0,0,0.9),-8px_-8px_24px_rgba(255,255,255,0.035)] space-y-5 max-h-[92vh] overflow-y-auto border border-lime-400/20">
            
            <div className="flex items-center justify-between border-b border-black/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-white drop-shadow-sm">Record Completed Athletic Session</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Log heart rate, distance, and subjective exertion rating.</p>
              </div>
              <button
                onClick={onCloseQuickLog}
                className="neu-btn text-neutral-400 hover:text-white p-1.5 rounded-xl"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Session Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 5x1km Threshold Repeats on Track"
                  className="neu-inset w-full rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>

              {/* Discipline and Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Discipline
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as SportDiscipline)}
                    className="neu-inset w-full rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Running">Running</option>
                    <option value="Hyrox & Functional">Hyrox & Functional</option>
                    <option value="Strength & Powerlifting">Strength & Powerlifting</option>
                    <option value="Cycling">Cycling</option>
                    <option value="Triathlon & Endurance">Triathlon & Endurance</option>
                    <option value="Sprints & Plyometrics">Sprints & Plyometrics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="neu-inset w-full rounded-xl px-3.5 py-2.5 text-xs text-white font-mono tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              {/* Biometric Telemetry Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Avg HR (bpm)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="220"
                    value={avgHeartRate}
                    onChange={(e) => setAvgHeartRate(Number(e.target.value))}
                    className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-white font-mono tabular-nums focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Max HR (bpm)
                  </label>
                  <input
                    type="number"
                    min="80"
                    max="230"
                    value={maxHeartRate}
                    onChange={(e) => setMaxHeartRate(Number(e.target.value))}
                    className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-white font-mono tabular-nums focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Optional"
                    className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-white font-mono tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              {/* DEDICATED RPE 1-10 SECTION IN TACTILE WELL */}
              <div className="neu-card-sm p-4 rounded-2xl space-y-3.5 border border-lime-400/20">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gauge className={`h-4 w-4 ${activeModalRpeMeta.color}`} />
                    <span className="text-xs font-bold text-white">
                      Perceived Exertion (RPE 1-10 Scale)
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-black font-mono tabular-nums ${activeModalRpeMeta.color} drop-shadow-[0_0_6px_currentColor]`}>
                      RPE {rpe}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">/ 10</span>
                  </div>
                </div>

                {/* Clickable 1-10 Segmented Buttons */}
                <div className="grid grid-cols-10 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                    const meta = getRpeMeta(val);
                    const selected = rpe === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRpe(val)}
                        className={`h-10 rounded-xl font-mono text-xs font-bold transition-all flex flex-col items-center justify-center ${
                          selected
                            ? 'neu-btn-active border-2 border-lime-400 text-lime-400 scale-105'
                            : 'neu-btn text-neutral-400 hover:text-white'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                  className="w-full"
                />

                {/* Dynamic Description Banner */}
                <div className={`neu-inset p-3 rounded-xl border ${activeModalRpeMeta.border} text-xs space-y-0.5`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className={activeModalRpeMeta.color}>
                      Level {rpe}: {activeModalRpeMeta.label}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 font-semibold">
                      {activeModalRpeMeta.zone}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-normal">
                    {activeModalRpeMeta.description}
                  </p>
                </div>

              </div>

              {/* Subjective Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Subjective Kinematic & Physiological Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Felt strong through interval 4. Cadence maintained at 182 spm. Minor hamstring tightness."
                  className="neu-inset w-full rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex justify-end gap-3 border-t border-black/40">
                <button
                  type="button"
                  onClick={onCloseQuickLog}
                  className="neu-btn px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  Commit Session Log
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
