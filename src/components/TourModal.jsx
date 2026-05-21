import { useState } from 'react';

const STEPS = [
  {
    icon: '✦',
    color: '#F97316',
    title: 'Welcome to KhalsaGraph',
    body: 'A living constellation of 5,548 shabads from Sri Guru Granth Sahib Ji — mapped by raag, writer, and virtue. Each glowing dot is one shabad.',
  },
  {
    icon: '◎',
    color: '#A78BFA',
    title: 'Navigate by Raag',
    body: 'At the overview zoom level, coloured labels mark each Raag cluster. Click any label — "Raag Asa", "Raag Sri" — to zoom into that cluster and see its shabads enlarge.',
  },
  {
    icon: '⚡',
    color: '#60A5FA',
    title: 'Search by feeling or name',
    body: 'Type a feeling, virtue, concept, or raag name in the search bar. Keyword matches appear instantly; if fewer than 2 are found, AI semantic search activates automatically.',
  },
  {
    icon: '◆',
    color: '#A78BFA',
    title: 'Open a Shabad',
    body: 'Click any dot to open the full shabad — Gurmukhi, transliteration, and English translation side by side. Connected shabads glow and show their similarity percentage.',
  },
  {
    icon: '✦',
    color: '#F97316',
    title: 'Reflect with AI',
    body: 'In the side panel, tap "Reflect with Ode2Socrates" for a philosophical reading of the shabad and three daily virtues to bring its teaching into your actions.',
  },
];

export default function TourModal({ onClose }) {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      <div className="relative w-full max-w-md fade-in" style={{
        background: 'rgba(4,7,18,0.99)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '1.25rem',
        boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 80px rgba(139,92,246,0.08)',
      }}>
        {/* Progress dots */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex gap-2 items-center">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? '22px' : '7px',
                  height: '7px',
                  background: i === step ? cur.color : i < step ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)',
                }} />
            ))}
          </div>
          <button onClick={onClose}
            className="text-slate-600 hover:text-slate-300 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="text-4xl mb-5" style={{ color: cur.color }}>{cur.icon}</div>
          <h2 className="text-white text-xl font-semibold mb-3 leading-snug">{cur.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{cur.body}</p>
        </div>

        {/* Step label */}
        <div className="px-6 pb-1">
          <span className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between px-6 pb-6 pt-3">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="text-sm text-slate-600 hover:text-slate-300 disabled:opacity-0 transition-colors px-3 py-2">
            ← Back
          </button>

          {isLast ? (
            <button onClick={onClose}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">
              Start exploring →
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)}
              className="btn-purple px-6 py-2.5 rounded-xl text-sm font-semibold">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
