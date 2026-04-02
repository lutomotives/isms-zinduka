import React from 'react';

export function StepWizard({ steps, stepIndex, onBack, onNext, canNext = true }) {
  const step = steps[stepIndex];

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          Hatua {stepIndex + 1} / {steps.length}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{step.title}</div>
        {step.help ? (
          <div style={{ fontSize: 16, marginTop: 8, lineHeight: 1.3 }}>{step.help}</div>
        ) : null}
      </div>

      <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 12 }}>
        {step.render()}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          type="button"
          onClick={onBack}
          disabled={stepIndex === 0}
          style={{
            flex: 1,
            padding: 16,
            fontSize: 18,
            borderRadius: 12,
            border: '1px solid #d1d5db',
            background: stepIndex === 0 ? '#f3f4f6' : '#ffffff'
          }}
        >
          Nyuma
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          style={{
            flex: 1,
            padding: 16,
            fontSize: 18,
            borderRadius: 12,
            border: '1px solid #111827',
            background: canNext ? '#111827' : '#9ca3af',
            color: '#ffffff'
          }}
        >
          Endelea
        </button>
      </div>
    </div>
  );
}

export default StepWizard;

