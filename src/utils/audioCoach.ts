/**
 * Athletic Audio Cues Voice Synthesizer
 * Provides crisp audio cues for workouts and pacing
 */

export function speakCue(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser environment');
    onEnd?.();
    return;
  }

  // Cancel any lingering utterances
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05; // Slightly athletic crisp pace
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find a clear, articulate English voice
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
