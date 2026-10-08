export type SportDiscipline = 
  | 'Running'
  | 'Hyrox & Functional'
  | 'Strength & Powerlifting'
  | 'Cycling'
  | 'Triathlon & Endurance'
  | 'Sprints & Plyometrics';

export interface WarmupItem {
  name: string;
  durationOrReps: string;
  cue: string;
}

export interface MainBlockItem {
  title: string;
  intensity: string;
  sets: string;
  intervalsOrReps: string;
  restInterval: string;
  coachingCues: string[];
}

export interface CooldownItem {
  exercise: string;
  duration: string;
  purpose: string;
}

export interface WorkoutPlan {
  workoutName: string;
  sport: string;
  targetRPE: number;
  targetHeartRateZone: string;
  estimatedCaloricBurn: number;
  physiologicalAdaptation: string;
  warmup: WarmupItem[];
  mainBlocks: MainBlockItem[];
  cooldown: CooldownItem[];
  audioCoachCues: string[];
  nutritionHydrationAdvice: string;
  adaptationRationale?: string;
}

export interface KineticChainCheck {
  headAndSpine: string;
  hipAndPelvis: string;
  kneeTracking: string;
  ankleAndFoot: string;
  barOrLimbPath: string;
}

export interface FormFault {
  fault: string;
  severity: 'Low' | 'Medium' | 'High';
  biomechanicalConsequence: string;
}

export interface CorrectivePrescription {
  drillName: string;
  protocol: string;
  targetDeficit: string;
}

export interface FormAnalysisResult {
  exerciseAnalyzed: string;
  formScore: number;
  movementEfficiencyTier: string;
  kineticChainCheck: KineticChainCheck;
  identifiedFaults: FormFault[];
  strengths: string[];
  immediateCues: string[];
  correctivePrescription: CorrectivePrescription;
}

export interface RecoveryProtocol {
  timing: string;
  intervention: string;
  physiologicalMechanism: string;
}

export interface ReadinessResult {
  readinessScore: number;
  readinessStatus: string;
  autonomicStatus: string;
  maxIntensityRecommended: string;
  volumeAdjustmentPercent: number;
  acwrSafetyAssessment: string;
  keyPhysiologicalFindings: string[];
  recoveryProtocols: RecoveryProtocol[];
  nutritionHydrationTiming: string;
}

export type RpeScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface TrainingLogEntry {
  id: string;
  date: string;
  title: string;
  sport: SportDiscipline;
  durationMinutes: number;
  avgHeartRate: number;
  maxHeartRate: number;
  distanceKm?: number;
  /**
   * Rate of Perceived Exertion (RPE) on a standardized 1-10 Borg CR10 scale.
   * 1 = Minimal exertion / Rest
   * 2-3 = Easy / Active Recovery
   * 4-5 = Moderate / Aerobic Base
   * 6-7 = Vigorous / Tempo
   * 8 = Hard / Lactate Threshold
   * 9 = Very Hard / VO2 Max Surge
   * 10 = Maximal / All-Out Failure
   */
  rpe: number;
  trimpLoad: number;
  notes: string;
}

export interface AthleteProfile {
  name: string;
  primarySport: SportDiscipline;
  vo2MaxEstimate: number;
  restingHeartRate: number;
  maxHeartRate: number;
  lactateThresholdHR: number;
  experienceLevel: string;
  currentMesocycle: string;
}

export interface FormPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  keyAngles: { label: string; normalRange: string };
  commonFaults: string[];
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
