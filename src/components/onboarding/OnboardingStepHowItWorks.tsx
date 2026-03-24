const levels = [
  { name: 'Folio', icon: '📚', indent: 0 },
  { name: 'Study Set', icon: '📁', indent: 1 },
  { name: 'Learning Material', icon: '🎓', indent: 2 },
  { name: 'Knowledge Touchpoint', icon: '💡', indent: 3 },
]

const modalities = ['Flashcards', 'Quiz', 'Mind Map']

const modPillClass: Record<string, string> = {
  Flashcards: 'bg-[#EDE9FE] text-[#5B21B6]',
  Quiz: 'bg-[#FCE7F3] text-[#9D174D]',
  'Mind Map': 'bg-[#DBEAFE] text-[#1E40AF]',
}

export function OnboardingStepHowItWorks() {
  return (
    <div>
      {/* Hierarchy */}
      <div className="mb-5 rounded-xl bg-primary-tint p-5">
        <div className="flex flex-col gap-2">
          {levels.map((lvl) => (
            <div key={lvl.name} className="flex items-center gap-2">
              {/* Indent */}
              {lvl.indent > 0 && (
                <div
                  style={{ width: lvl.indent * 24 }}
                  className="shrink-0 border-l border-forest/15"
                />
              )}
              {/* Node */}
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-sm">
                <span aria-hidden="true">{lvl.icon}</span>
                <span className="text-sm font-semibold text-text-primary">
                  {lvl.name}
                </span>
                {/* Modality pills */}
                <div className="ml-auto flex gap-1">
                  {modalities.map((m) => (
                    <span
                      key={m}
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        modPillClass[m],
                      ].join(' ')}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key insight */}
      <div className="rounded-lg border border-primary/20 bg-primary-tint px-4 py-3">
        <p className="text-sm font-medium text-forest-mid">
          Study aids can be generated at{' '}
          <strong className="text-forest">every level</strong> — scope
          determines the breadth, from a single Knowledge Touchpoint to an
          entire Folio.
        </p>
      </div>
    </div>
  )
}
