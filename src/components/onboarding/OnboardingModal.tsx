import { useState, useCallback } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { StepIndicator } from './StepIndicator'
import { OnboardingStepWelcome } from './OnboardingStepWelcome'
import { OnboardingStepHowItWorks } from './OnboardingStepHowItWorks'

const STEPS = [
  { title: 'Welcome to Panopto Folio', component: OnboardingStepWelcome },
  { title: 'How It Works', component: OnboardingStepHowItWorks },
]

interface OnboardingModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export function OnboardingModal({ isOpen, onDismiss }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1

  const handleNext = useCallback(() => {
    if (isLast) {
      onDismiss()
    } else {
      setStep((s) => s + 1)
    }
  }, [isLast, onDismiss])

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft' && step > 0) handleBack()
    },
    [handleNext, handleBack, step],
  )

  const StepContent = STEPS[step].component

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDismiss}
      title={STEPS[step].title}
      size="lg"
    >
      <div onKeyDown={handleKeyDown} aria-live="polite">
        <StepContent />
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <StepIndicator totalSteps={STEPS.length} currentStep={step} />

        <div className="flex gap-2">
          {!isLast && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Skip
            </Button>
          )}
          {step > 0 && (
            <Button variant="secondary" size="sm" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleNext}>
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
