import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Volume2, 
  RefreshCw,
  User
} from 'lucide-react';
import { AthleteProfile, CoachMessage } from '../types';
import { speakCue } from '../utils/audioCoach';

interface CoachConsultViewProps {
  athlete: AthleteProfile;
}

export const CoachConsultView: React.FC<CoachConsultViewProps> = ({ athlete }) => {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Welcome, ${athlete.name}. I'm Coach Techo. I analyze your metabolic data, periodization phases, and biomechanical form. Currently reviewing your ${athlete.currentMesocycle} block. What tactical adjustments, race pacing questions, or recovery strategies do you want to address today?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const presetQuestions = [
    'How do I accelerate lactate clearance between high-intensity repeats?',
    'What is the optimal carb loading protocol 48 hours before race day?',
    'How should I structure an active deload week without losing aerobic top-end?',
    'How to prevent hamstring strains during maximal velocity sprint mechanics?',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || inputQuestion;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: CoachMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/coach/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend.trim(),
          athleteContext: athlete,
          chatHistory: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Coach consult failed');
      }

      const assistantMessage: CoachMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        timestamp: 'Now',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: CoachMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'I encountered a telemetry communication error. Please try asking again in a moment.',
        timestamp: 'Now',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (msg: CoachMessage) => {
    if (isSpeakingId === msg.id) {
      setIsSpeakingId(null);
    } else {
      setIsSpeakingId(msg.id);
      speakCue(msg.content, () => setIsSpeakingId(null));
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Coach Header Profile in Neumorphic Card */}
      <div className="neu-card rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-6 shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)] border border-lime-400/20">
        <div className="relative shrink-0">
          <div className="p-1 rounded-2xl bg-[#111319] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)]">
            <img
              src="/src/assets/images/athlit_coach_avatar_1790658133388.jpg"
              alt="Coach Techo"
              referrerPolicy="no-referrer"
              className="h-20 w-20 rounded-xl object-cover border border-lime-400/50 shadow-md"
            />
          </div>
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-lime-400 border-2 border-[#161a22] shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
        </div>

        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl font-extrabold text-white drop-shadow-sm">Coach Techo</h2>
            <span className="neu-btn px-2.5 py-0.5 rounded-lg text-xs text-lime-400 font-mono font-bold">Director of Athletic Performance</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl pt-1">
            Olympic-grade training periodization, mitochondrial bioenergetics, and race execution advisor powered by Gemini 3.8 Flash.
          </p>
        </div>
      </div>

      {/* Preset Strategy Questions in Neumorphic Buttons */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Suggested Tactical Topics
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="neu-btn p-3.5 text-left rounded-2xl text-xs text-neutral-300 hover:text-white transition-all line-clamp-1 font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Chat Dialogue Container in Neumorphic Enclosure */}
      <div className="neu-card rounded-3xl flex flex-col h-[540px] overflow-hidden shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)] border border-black/40">
        
        {/* Messages Feed */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 scrollbar-thin">
          {messages.map((msg) => {
            const isCoach = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isCoach ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCoach
                      ? 'neu-btn-primary font-mono'
                      : 'neu-btn text-white'
                  }`}
                >
                  {isCoach ? 'AI' : <User className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isCoach
                      ? 'neu-inset text-neutral-200 border border-black/50'
                      : 'neu-btn-primary text-neutral-950 font-semibold'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {isCoach && (
                    <div className="mt-3 pt-2.5 border-t border-black/40 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Coach Techo · Sports Science</span>
                      <button
                        onClick={() => handleSpeak(msg)}
                        className={`neu-btn px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                          isSpeakingId === msg.id ? 'text-lime-400 font-bold' : 'hover:text-white'
                        }`}
                      >
                        <Volume2 className="h-3.5 w-3.5 text-lime-400" />
                        <span>{isSpeakingId === msg.id ? 'Playing...' : 'Audio Coach'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="neu-btn-primary h-9 w-9 rounded-xl font-mono flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div className="neu-inset rounded-2xl p-4 text-xs text-neutral-400 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-lime-400" />
                <span>Coach Techo is formulating tactical recommendations...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form with Neumorphic Well */}
        <div className="p-4 border-t border-black/40 bg-[#12141a]/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask about workout pacing, lactate thresholds, carb loading, or deload phases..."
              className="neu-inset flex-1 rounded-2xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuestion.trim()}
              className="neu-btn-primary rounded-2xl p-3.5 disabled:opacity-40"
              title="Send question to Coach"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
