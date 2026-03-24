import panoptoLogo from '../../assets/panopto-logo.svg'

const terms = [
  {
    icon: '📚',
    name: 'Folio',
    accent: 'bg-primary',
    iconBg: 'bg-primary-tint',
    def: 'Your top-level subject or course — the home for everything you study.',
  },
  {
    icon: '📁',
    name: 'Study Set',
    accent: 'bg-[#F59E0B]',
    iconBg: 'bg-[#FFFBEB]',
    def: 'A curated group of Learning Materials within a Folio.',
  },
  {
    icon: '🎓',
    name: 'Learning Material',
    accent: 'bg-[#38BDF8]',
    iconBg: 'bg-[#F0F9FF]',
    def: 'A PDF, video, or Panopto recording you upload as source content.',
  },
  {
    icon: '💡',
    name: 'Knowledge Touchpoint',
    accent: 'bg-forest-mid',
    iconBg: 'bg-primary-tint',
    def: 'An AI-generated summary segment with citations — the atomic unit of study.',
  },
  {
    icon: '⚡',
    name: 'Study Aid',
    accent: 'bg-[#7C3AED]',
    iconBg: 'bg-[#F5F3FF]',
    def: 'Flashcards, Quizzes, or Mind Maps — generated at any level.',
  },
]

export function OnboardingStepWelcome() {
  return (
    <div>
      {/* Hero header — matches EmptyDashboard */}
      <div
        className="mb-6 flex flex-col items-center rounded-xl px-6 py-8"
        style={{ background: 'linear-gradient(180deg, #FBFEFB 0%, #F1FDF8 100%)' }}
      >
        <img
          src={panoptoLogo}
          alt="Panopto Folio"
          className="mb-4 h-8"
        />
        <h3
          className="mb-2 text-center text-text-primary"
          style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.04em' }}
        >
          Welcome to Panopto Folio
        </h3>
        <p className="text-center text-sm text-text-secondary">
          Your AI-powered study companion. Here are the key concepts you'll use.
        </p>
      </div>

      {/* Vocab cards grid — matches architecture page */}
      <dl className="grid grid-cols-5 gap-3">
        {terms.map((t) => (
          <div
            key={t.name}
            className="relative overflow-hidden rounded-xl border border-border bg-background p-4"
          >
            {/* Colored top border */}
            <div
              className={['absolute inset-x-0 top-0 h-[3px]', t.accent].join(' ')}
              aria-hidden="true"
            />
            {/* Icon */}
            <div
              className={[
                'mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] text-lg',
                t.iconBg,
              ].join(' ')}
              aria-hidden="true"
            >
              {t.icon}
            </div>
            <dt className="mb-1 text-sm font-bold tracking-tight text-text-primary">
              {t.name}
            </dt>
            <dd className="text-sm leading-relaxed text-text-secondary">
              {t.def}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
