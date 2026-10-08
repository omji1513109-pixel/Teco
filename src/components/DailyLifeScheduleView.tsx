import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Droplet, 
  Flame, 
  BookOpen, 
  Activity, 
  RotateCcw, 
  Sliders, 
  Info,
  Calendar,
  Volume2
} from 'lucide-react';
import { ALL_GAMES_DATABASE } from '../data/allGamesDatabase';
import { speakCue } from '../utils/audioCoach';

export interface DailyHabitItem {
  id: string;
  time: string;
  category: 'Morning' | 'Work/School' | 'Nutrition' | 'Training' | 'Recovery' | 'Sleep';
  title: string;
  description: string;
  durationMinutes: number;
  physiologicalBenefit: string;
  hydrationCues?: string;
  completed?: boolean;
}

const DEFAULT_HABITS: DailyHabitItem[] = [
  {
    id: 'habit-1',
    time: '06:30 AM',
    category: 'Morning',
    title: 'Circadian Awakening & Natural Sunlight',
    description: 'Step outdoors or view natural sky for 10-15 minutes to reset suprachiasmatic nucleus (cortisol peak, melatonin suppression).',
    durationMinutes: 15,
    physiologicalBenefit: 'Synchronizes master circadian clock, elevating daytime alertness and establishing night melatonin onset.',
    hydrationCues: 'Drink 500ml room temperature water + pinch of sea salt (electrolytes).',
    completed: true,
  },
  {
    id: 'habit-2',
    time: '06:45 AM',
    category: 'Morning',
    title: 'Kinetic Joint Mobility & Core Priming',
    description: 'Cat-cow, world’s greatest stretch, thoracic rotations, ankle dorsiflexion rocks, and deadbugs.',
    durationMinutes: 15,
    physiologicalBenefit: 'Hydrates intervertebral discs, mobilizes synovial joint fluid, and activates deep transverse abdominis stabilizers.',
    completed: true,
  },
  {
    id: 'habit-3',
    time: '07:15 AM',
    category: 'Nutrition',
    title: 'High-Protein Breakfast & Brain Fuel',
    description: '35g high-biological-value protein (eggs, Greek yogurt, or whey) + slow-digesting oats or berries.',
    durationMinutes: 30,
    physiologicalBenefit: 'Triggers muscle protein synthesis (leucine threshold) and provides sustained cognitive glucose without insulin spikes.',
    hydrationCues: 'Optional black coffee or green tea (delay caffeine 60 mins after waking for adenosine clearance).',
    completed: false,
  },
  {
    id: 'habit-4',
    time: '09:00 AM',
    category: 'Work/School',
    title: 'Deep Focus Work / Study Block 1',
    description: 'High-leverage analytical work or academic study. Maintain ergonomic lumbar support with screen at eye level.',
    durationMinutes: 120,
    physiologicalBenefit: 'Peak prefrontal cortex cognitive performance during morning dopamine and cortisol plateau.',
    completed: false,
  },
  {
    id: 'habit-5',
    time: '11:15 AM',
    category: 'Work/School',
    title: 'Micro-Movement Posture Reset & Decompression',
    description: 'Stand up, 2-minute doorway chest stretch, glute bridges, and 20-20-20 visual rest.',
    durationMinutes: 10,
    physiologicalBenefit: 'Counteracts hip flexor shortening, reduces cervical spine shear load, and re-engages posterior chain.',
    hydrationCues: 'Drink 400ml water.',
    completed: false,
  },
  {
    id: 'habit-6',
    time: '12:30 PM',
    category: 'Nutrition',
    title: 'Nutritious Lunch & 15-Minute Sunlight Walk',
    description: 'Complex carbohydrates, lean protein, and leafy greens. Follow with an easy 15-minute outdoor walking stroll.',
    durationMinutes: 45,
    physiologicalBenefit: 'Postprandial walking blunts blood glucose spike by ~30% via non-insulin mediated muscle GLUT-4 translocation.',
    completed: false,
  },
  {
    id: 'habit-7',
    time: '03:30 PM',
    category: 'Nutrition',
    title: 'Pre-Training Hydration & Glycogen Window',
    description: 'Easily digestible carbohydrates (banana, rice cake with honey) + 500ml water 90 minutes before training.',
    durationMinutes: 15,
    physiologicalBenefit: 'Elevates circulating blood glucose and hepatic glycogen reserves for anaerobic power output.',
    hydrationCues: 'Drink 500ml water + electrolytes (sodium, magnesium).',
    completed: false,
  },
  {
    id: 'habit-8',
    time: '05:00 PM',
    category: 'Training',
    title: 'Main Athletic Practice Session (Selected Game)',
    description: 'Dynamic warm-up (10m), primary game skill drills & form practice (35m), high-intensity interval / scrimmage (15m).',
    durationMinutes: 60,
    physiologicalBenefit: 'Optimal core body temperature and neuromuscular recruitment peak between 4 PM and 7 PM.',
    completed: false,
  },
  {
    id: 'habit-9',
    time: '06:15 PM',
    category: 'Recovery',
    title: 'Post-Workout Down-Regulation & Cool-Down',
    description: 'Static stretching of hamstrings and lats, diaphragmatic box breathing (4s in, 4s hold, 4s out, 4s hold).',
    durationMinutes: 15,
    physiologicalBenefit: 'Shifts autonomic nervous system from sympathetic fight-or-flight to parasympathetic rest-and-digest.',
    completed: false,
  },
  {
    id: 'habit-10',
    time: '07:30 PM',
    category: 'Nutrition',
    title: 'Restorative Dinner & Micronutrient Replenishment',
    description: 'Whole foods rich in antioxidants, magnesium, zinc, and lean protein for tissue repair.',
    durationMinutes: 45,
    physiologicalBenefit: 'Promotes muscle tissue remodeling, supplies amino acids for overnight rebuilding, and replenishes glycogen.',
    completed: false,
  },
  {
    id: 'habit-11',
    time: '09:15 PM',
    category: 'Sleep',
    title: 'Blue Light Cutoff & Wind-Down Routine',
    description: 'Dim ambient overhead lighting, activate night shift on devices, light foam rolling or casual reading.',
    durationMinutes: 30,
    physiologicalBenefit: 'Removes blue-spectrum photons that degrade pineal gland melatonin production.',
    hydrationCues: 'Small sip of chamomile or tart cherry juice (natural melatonin precursor).',
    completed: false,
  },
  {
    id: 'habit-12',
    time: '10:15 PM',
    category: 'Sleep',
    title: 'Deep Sleep & Growth Hormone Secretion',
    description: 'Cool bedroom (65-68°F / 18-20°C), blackout curtains, white noise or earplugs.',
    durationMinutes: 495, // 8.25 hrs
    physiologicalBenefit: 'Facilitates Slow Wave Sleep (Stage 3/4) triggering 70% of daily human growth hormone (HGH) release.',
    completed: false,
  },
];

export const DailyLifeScheduleView: React.FC = () => {
  const [habits, setHabits] = useState<DailyHabitItem[]>(() => {
    const saved = localStorage.getItem('techo_daily_schedule_habits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_HABITS;
  });

  const [selectedSport, setSelectedSport] = useState<string>('Basketball (Jump Shot & Defense)');
  const [occupation, setOccupation] = useState<string>('Student / Hybrid Athlete');
  const [wakeTime, setWakeTime] = useState<string>('06:30 AM');
  const [sleepTime, setSleepTime] = useState<string>('10:15 PM');
  const [trainingTime, setTrainingTime] = useState<string>('05:00 PM');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [scheduleMeta, setScheduleMeta] = useState<{
    title: string;
    athleteType: string;
    circadianFocus: string;
    coachTip: string;
  }>({
    title: 'Elite Student-Athlete Daily Circadian Protocol',
    athleteType: 'Dual-Career Competitor (Academics / Work + High Performance)',
    circadianFocus: 'Synchronized Cortisol Peak & Parasympathetic Recovery Window',
    coachTip: 'Consistency in wake-up time and morning sunlight is the highest-leverage lever for athletic recovery and evening sleep latency.',
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('techo_daily_schedule_habits', JSON.stringify(habits));
  }, [habits]);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const completionPercentage = Math.round((completedCount / habits.length) * 100) || 0;

  const handleGenerateAiSchedule = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primarySport: selectedSport,
          occupation,
          wakeTime,
          sleepTime,
          trainingTime,
          trainingDurationMin: 60,
          goals: ['Cardiovascular Endurance', 'Skill Precision', 'Injury Prevention'],
        }),
      });

      const data = await res.json();
      if (data.success && data.schedule) {
        const s = data.schedule;
        setScheduleMeta({
          title: s.scheduleTitle,
          athleteType: s.athleteType,
          circadianFocus: s.circadianFocus,
          coachTip: s.coachTipOfTheDay,
        });

        if (Array.isArray(s.dailyHabits) && s.dailyHabits.length > 0) {
          setHabits(
            s.dailyHabits.map((item: any, idx: number) => ({
              id: item.id || `custom-habit-${idx}`,
              time: item.time || '07:00 AM',
              category: item.category || 'Morning',
              title: item.title,
              description: item.description,
              durationMinutes: item.durationMinutes || 30,
              physiologicalBenefit: item.physiologicalBenefit || 'Optimizes daily performance',
              hydrationCues: item.hydrationCues,
              completed: false,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to generate daily schedule:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const resetAllHabits = () => {
    setHabits((prev) => prev.map((h) => ({ ...h, completed: false })));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header Card */}
      <div className="neu-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-lime-700 uppercase tracking-wider mb-2">
              <Calendar className="h-4 w-4" />
              <span>Circadian Athletic Rhythm & Daily Life Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {scheduleMeta.title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              {scheduleMeta.athleteType} · <span className="font-semibold text-slate-800">{scheduleMeta.circadianFocus}</span>
            </p>
          </div>

          {/* Daily Progress Gauge */}
          <div className="neu-inset rounded-2xl p-4 flex items-center gap-5 min-w-[240px]">
            <div className="relative h-16 w-16 flex items-center justify-center">
              <svg className="h-16 w-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  className="stroke-slate-300"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  className="stroke-lime-600 transition-all duration-700"
                  strokeWidth="5"
                  strokeDasharray={163.3}
                  strokeDashoffset={163.3 - (163.3 * completionPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-slate-900">
                {completionPercentage}%
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Daily Completion
              </div>
              <div className="text-lg font-black text-slate-900">
                {completedCount} / {habits.length} <span className="text-xs font-normal text-slate-500">routines</span>
              </div>
              <button
                onClick={resetAllHabits}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mt-0.5"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Reset day
              </button>
            </div>
          </div>
        </div>

        {/* Coach Tip Bar */}
        <div className="mt-5 p-3.5 rounded-xl bg-lime-50/70 border border-lime-200/80 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-lime-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-lime-900">Circadian Science Tip: </span>
            {scheduleMeta.coachTip}
          </div>
        </div>
      </div>

      {/* AI Schedule Customizer Accordion */}
      <div className="neu-card rounded-3xl p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-lime-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              AI Daily Schedule Customizer
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Tailor timetable to your sport & lifestyle
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          {/* Sport Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Primary Sport (200+ Games)</label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="neu-input w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-800 bg-[#eef2f6]"
            >
              {ALL_GAMES_DATABASE.slice(0, 50).map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Occupation */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Daily Context / Work</label>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="neu-input w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-800 bg-[#eef2f6]"
            >
              <option value="Student / Academic Focus">Student (University / High School)</option>
              <option value="Hybrid / Office Desk Professional">Desk Professional / Hybrid</option>
              <option value="Full-Time Competitive Athlete">Full-Time Competitive Athlete</option>
              <option value="Trades / High Physical Labor">Physical Labor / On-Feet</option>
            </select>
          </div>

          {/* Wake Time */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Wake Time</label>
            <input
              type="text"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="neu-input w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-800 bg-[#eef2f6]"
              placeholder="e.g. 06:30 AM"
            />
          </div>

          {/* Training Window */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Sport Training Time</label>
            <input
              type="text"
              value={trainingTime}
              onChange={(e) => setTrainingTime(e.target.value)}
              className="neu-input w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-800 bg-[#eef2f6]"
              placeholder="e.g. 05:00 PM"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerateAiSchedule}
              disabled={isAiGenerating}
              className="neu-btn-primary w-full rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isAiGenerating ? 'Synthesizing...' : 'Generate Schedule'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Routine Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-700" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Today's 24-Hour Circadian Schedule
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Click any habit to mark done
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {habits.map((habit) => {
            const isCompleted = habit.completed;

            let categoryColor = 'text-blue-700 bg-blue-100/70';
            if (habit.category === 'Morning') categoryColor = 'text-amber-700 bg-amber-100/70';
            if (habit.category === 'Training') categoryColor = 'text-lime-700 bg-lime-100/70';
            if (habit.category === 'Nutrition') categoryColor = 'text-emerald-700 bg-emerald-100/70';
            if (habit.category === 'Sleep' || habit.category === 'Recovery') categoryColor = 'text-purple-700 bg-purple-100/70';

            return (
              <div
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={`neu-card rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 select-none ${
                  isCompleted ? 'opacity-85 border-lime-500/50 bg-[#e8eef5]' : 'hover:scale-[1.008]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox Icon */}
                    <div className="pt-0.5 text-lime-700">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 fill-lime-600 text-white" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white/70 px-2 py-0.5 rounded-md shadow-inner border border-slate-200">
                          {habit.time}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${categoryColor}`}>
                          {habit.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {habit.durationMinutes} mins
                        </span>
                      </div>

                      <h3 className={`text-sm sm:text-base font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                        {habit.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {habit.description}
                      </p>

                      {/* Scientific & Hydration Badges */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-200/60 px-2.5 py-1 rounded-md">
                          <Activity className="h-3 w-3 text-slate-600" />
                          <span className="font-semibold">Physiological:</span> {habit.physiologicalBenefit}
                        </span>
                        {habit.hydrationCues && (
                          <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-100/70 px-2.5 py-1 rounded-md">
                            <Droplet className="h-3 w-3 text-blue-600" />
                            {habit.hydrationCues}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Speech Coaching Audio Button */}
                  <div className="self-end sm:self-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakCue(`${habit.title}. ${habit.description}`);
                      }}
                      className="neu-btn p-2 rounded-xl text-slate-600 hover:text-lime-700"
                      title="Audio voice cue"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
