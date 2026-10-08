import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Heart, 
  Moon, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  Activity, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { ReadinessResult } from '../types';

export const RecoveryLabView: React.FC = () => {
  // Biometric inputs
  const [restingHeartRate, setRestingHeartRate] = useState(46);
  const [hrv, setHrv] = useState(72);
  const [sleepHours, setSleepHours] = useState(7.8);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [muscleSoreness, setMuscleSoreness] = useState(3);
  const [soreRegions, setSoreRegions] = useState<string[]>(['Hamstrings', 'Calves']);
  const [yesterdayTrimp, setYesterdayTrimp] = useState(168);
  const [weeklyAcuteToChronic, setWeeklyAcuteToChronic] = useState(1.12);

  const [isComputing, setIsComputing] = useState(false);
  const [readinessData, setReadinessData] = useState<ReadinessResult | null>({
    readinessScore: 88,
    readinessStatus: 'Optimal Adaptive Capacity',
    autonomicStatus: 'Balanced Autonomic Tone (Slight Parasympathetic Priming)',
    maxIntensityRecommended: 'Zone 4 / Threshold Permitted (Up to 90% HRmax)',
    volumeAdjustmentPercent: 100,
    acwrSafetyAssessment: 'Acute:Chronic ratio of 1.12 is in the optimal sweetspot (0.80 - 1.30) with low injury probability.',
    keyPhysiologicalFindings: [
      'HRV rMSSD of 72ms is +8ms above your rolling 30-day baseline, indicating positive vagal tone adaptation.',
      'Resting heart rate remains suppressed at 46 bpm without nocturnal tachycardia.',
      'Peripheral muscular soreness is localized to posterior chain; core stabilization and joint capsule health are intact.',
    ],
    recoveryProtocols: [
      {
        timing: 'Immediate Post-Session',
        intervention: '15-min Active Zone 1 Spin (Cadence >90 RPM, <125 bpm)',
        physiologicalMechanism: 'Accelerates venous return and clears blood lactate without adding additional mechanical muscular trauma.',
      },
      {
        timing: 'Mid-Afternoon (3-4 PM)',
        intervention: 'Pneumatic Compression Boots or Contrast Shower (3 min cold / 2 min hot x 3 cycles)',
        physiologicalMechanism: 'Promotes lymphatic drainage and modulates systemic inflammation markers (IL-6).',
      },
      {
        timing: '30 mins Pre-Sleep',
        intervention: 'Magnesium Glycinate (400mg) + 10 mins 4-7-8 Breathing Protocol',
        physiologicalMechanism: 'Down-regulates central nervous system sympatho-excitation to optimize slow-wave (Stage 3) deep sleep.',
      },
    ],
    nutritionHydrationTiming: 'Replenish with 1.2g carbohydrate per kg body mass within 90 minutes post-workout, paired with 35g leucine-rich whey protein. Maintain sodium intake at 600mg per liter of water.',
  });

  const muscleOptions = [
    'Hamstrings',
    'Quads',
    'Calves & Achilles',
    'Glutes & Hip Abductors',
    'Lower Back & Erectors',
    'Shoulders & Traps',
    'Hip Flexors & Psoas',
  ];

  const toggleRegion = (region: string) => {
    if (soreRegions.includes(region)) {
      setSoreRegions(soreRegions.filter((r) => r !== region));
    } else {
      setSoreRegions([...soreRegions, region]);
    }
  };

  const handleComputeReadiness = async () => {
    setIsComputing(true);
    try {
      const res = await fetch('/api/recovery/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restingHeartRate,
          hrv,
          sleepHours,
          sleepQuality,
          muscleSoreness,
          soreRegions,
          yesterdayTrimp,
          weeklyAcuteToChronic,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Readiness calculation failed');
      }

      setReadinessData(data.recovery);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner with Image and Neumorphic Soft Bevel */}
      <section className="neu-card relative overflow-hidden rounded-3xl p-1 shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)]">
        <div className="relative rounded-[22px] overflow-hidden min-h-[220px] flex flex-col justify-end p-6 sm:p-10">
          <div className="absolute inset-0">
            <img
              src="/src/assets/images/athlit_recovery_lab_1790658120900.jpg"
              alt="Elite recovery science lounge"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover opacity-30 filter brightness-90 contrast-115"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161a22] via-[#161a22]/70 to-transparent" />
          </div>

          <div className="relative z-10">
            <div className="text-xs font-semibold text-lime-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]">
              Autonomic & Physiological Recovery Science
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-sm">
              Daily Physiological Readiness & Adaptation Hub
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 mt-2 max-w-xl leading-relaxed">
              Input nocturnal HRV, resting pulse, and acute workload metrics to determine autonomic nervous balance and exact training intensity ceilings.
            </p>
          </div>
        </div>
      </section>

      {/* Two Column Layout: Biometric Sliders & Synthesis Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Daily Biometric Assessment Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="neu-card rounded-3xl p-6 sm:p-7 space-y-5 shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)]">
            <div className="flex items-center justify-between border-b border-black/40 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Morning Biometric Inputs
              </h3>
              <span className="neu-btn px-2.5 py-0.5 rounded-md text-xs text-lime-400 font-mono font-semibold">Today's Check-in</span>
            </div>

            {/* Resting Heart Rate */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                <span>Resting Heart Rate (Waking)</span>
                <span className="font-mono text-red-400 tabular-nums">{restingHeartRate} bpm</span>
              </div>
              <input
                type="range"
                min="35"
                max="85"
                value={restingHeartRate}
                onChange={(e) => setRestingHeartRate(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
                <span>35 bpm (Elite Bradycardia)</span>
                <span>85 bpm</span>
              </div>
            </div>

            {/* HRV (rMSSD) */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                <span>Heart Rate Variability (rMSSD)</span>
                <span className="font-mono text-emerald-400 tabular-nums">{hrv} ms</span>
              </div>
              <input
                type="range"
                min="20"
                max="140"
                value={hrv}
                onChange={(e) => setHrv(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
                <span>20 ms (Sympathetic Strain)</span>
                <span>140 ms (High Vagal Tone)</span>
              </div>
            </div>

            {/* Sleep Hours & Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Sleep Duration
                </label>
                <div className="neu-inset rounded-xl px-3 py-2 flex items-center gap-1.5 font-mono text-xs text-cyan-400">
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="12"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full bg-transparent text-xs text-white tabular-nums focus:outline-none"
                  />
                  <span className="text-neutral-400">hrs</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Sleep Quality (1-5)
                </label>
                <select
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(Number(e.target.value))}
                  className="neu-inset w-full rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="5">5 - Deep & Restorative</option>
                  <option value="4">4 - Good Rest</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Restless</option>
                  <option value="1">1 - Poor / Broken</option>
                </select>
              </div>
            </div>

            {/* Subjective Muscle Soreness */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                <span>Subjective Soreness (DOMS)</span>
                <span className="font-mono text-amber-400 tabular-nums">{muscleSoreness} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={muscleSoreness}
                onChange={(e) => setMuscleSoreness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Sore Regions Tag Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Localized Soreness Regions
              </label>
              <div className="flex flex-wrap gap-2">
                {muscleOptions.map((region) => {
                  const active = soreRegions.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                        active
                          ? 'neu-btn-active text-amber-300 border border-amber-400/40'
                          : 'neu-btn text-neutral-400 hover:text-white'
                      }`}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Workload Context */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Yesterday's TRIMP
                </label>
                <input
                  type="number"
                  value={yesterdayTrimp}
                  onChange={(e) => setYesterdayTrimp(Number(e.target.value))}
                  className="neu-inset w-full rounded-xl px-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  ACWR Workload Ratio
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={weeklyAcuteToChronic}
                  onChange={(e) => setWeeklyAcuteToChronic(Number(e.target.value))}
                  className="neu-inset w-full rounded-xl px-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none"
                />
              </div>
            </div>

            {/* Submit computation button */}
            <button
              onClick={handleComputeReadiness}
              disabled={isComputing}
              className="neu-btn-primary w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold disabled:opacity-50"
            >
              {isComputing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Physiological Balance...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Calculate Readiness & Recovery Protocol</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Physiological Readiness & Protocols (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {readinessData && (
            <div className="neu-card rounded-3xl p-6 sm:p-8 space-y-6 shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)]">
              
              {/* Main Score Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/40 pb-5">
                <div>
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    Computed Daily Readiness
                  </div>
                  <h2 className="text-2xl font-extrabold text-white drop-shadow-sm">
                    {readinessData.readinessStatus}
                  </h2>
                  <div className="text-xs text-lime-400 font-semibold mt-1">
                    {readinessData.autonomicStatus}
                  </div>
                </div>

                <div className="neu-inset px-5 py-3.5 rounded-2xl flex flex-col items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-5xl font-black text-white tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                      {readinessData.readinessScore}
                    </span>
                    <span className="text-sm text-neutral-400 font-mono">/ 100</span>
                  </div>
                  <span className="text-[10px] text-lime-400 uppercase font-mono font-bold mt-0.5">
                    Systemic Readiness
                  </span>
                </div>
              </div>

              {/* Prescribed Training Thresholds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="neu-inset-subtle p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-neutral-400">Prescribed Intensity Ceiling</span>
                  <div className="text-sm font-bold text-white">
                    {readinessData.maxIntensityRecommended}
                  </div>
                </div>

                <div className="neu-inset-subtle p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-neutral-400">Suggested Volume Scaling</span>
                  <div className="text-sm font-bold text-lime-400 font-mono tabular-nums">
                    {readinessData.volumeAdjustmentPercent}% of Standard Baseline
                  </div>
                </div>
              </div>

              {/* Workload Safety (ACWR) in recessed pod */}
              <div className="neu-inset p-4 rounded-2xl text-xs text-neutral-300 space-y-1">
                <span className="font-bold text-cyan-400">Workload & ACWR Assessment: </span>
                <span>{readinessData.acwrSafetyAssessment}</span>
              </div>

              {/* Key Physiological Findings */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Key Physiological Findings
                </div>
                <div className="space-y-2">
                  {readinessData.keyPhysiologicalFindings.map((finding, idx) => (
                    <div key={idx} className="neu-inset-subtle p-3 rounded-xl flex items-start gap-2 text-xs text-neutral-300">
                      <span className="text-lime-400 font-bold">›</span>
                      <span className="leading-relaxed">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Evidence-Based Recovery Protocols */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-lime-400" />
                  <span>Targeted Recovery Interventions</span>
                </div>
                <div className="space-y-2.5">
                  {readinessData.recoveryProtocols.map((protocol, idx) => (
                    <div key={idx} className="neu-card-sm p-4 rounded-2xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{protocol.intervention}</span>
                        <span className="neu-btn px-2.5 py-0.5 rounded text-[11px] font-mono text-neutral-400 font-semibold">{protocol.timing}</span>
                      </div>
                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        <span className="text-neutral-300 font-semibold">Mechanism: </span>
                        {protocol.physiologicalMechanism}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition & Glycogen Timing */}
              <div className="neu-inset rounded-2xl p-4 text-xs text-neutral-300 space-y-1">
                <span className="font-bold text-white">Fueling & Electrolyte Optimization: </span>
                <span className="leading-relaxed">{readinessData.nutritionHydrationTiming}</span>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
