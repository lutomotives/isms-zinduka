import React, { useMemo, useState } from 'react';
import { StepWizard } from '../../components/common/StepWizard.jsx';

function bigInputProps() {
  return {
    style: {
      width: '100%',
      padding: 14,
      fontSize: 18,
      borderRadius: 12,
      border: '1px solid #d1d5db'
    }
  };
}

export function StudentEntry() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    class_name: '',
    gender: '',
    guardian_name: '',
    guardian_phone: ''
  });
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(
    () => [
      {
        key: 'name',
        title: 'Jina la mwanafunzi',
        help: 'Andika jina la kwanza na jina la mwisho.',
        render: () => (
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Jina la kwanza</div>
              <input
                {...bigInputProps()}
                value={form.first_name}
                onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))}
                placeholder="Mfano: Amina"
                inputMode="text"
                autoComplete="off"
              />
            </label>
            <label>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Jina la mwisho</div>
              <input
                {...bigInputProps()}
                value={form.last_name}
                onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))}
                placeholder="Mfano: Otieno"
                inputMode="text"
                autoComplete="off"
              />
            </label>
          </div>
        )
      },
      {
        key: 'class',
        title: 'Darasa',
        help: 'Chagua au andika darasa.',
        render: () => (
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Darasa</div>
              <input
                {...bigInputProps()}
                value={form.class_name}
                onChange={(e) => setForm((s) => ({ ...s, class_name: e.target.value }))}
                placeholder="Mfano: Grade 4"
                inputMode="text"
                autoComplete="off"
              />
            </label>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Jinsia</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { v: 'F', label: 'Msichana' },
                  { v: 'M', label: 'Mvulana' },
                  { v: 'O', label: 'Nyingine' }
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, gender: opt.v }))}
                    style={{
                      padding: 16,
                      fontSize: 18,
                      borderRadius: 12,
                      border: form.gender === opt.v ? '2px solid #111827' : '1px solid #d1d5db',
                      background: '#ffffff',
                      textAlign: 'left'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      },
      {
        key: 'guardian',
        title: 'Mzazi / Mlezi',
        help: 'Hii namba itasaidia kutuma taarifa (SMS) na malipo.',
        render: () => (
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Jina la Mzazi</div>
              <input
                {...bigInputProps()}
                value={form.guardian_name}
                onChange={(e) => setForm((s) => ({ ...s, guardian_name: e.target.value }))}
                placeholder="Mfano: Mary Achieng"
                inputMode="text"
                autoComplete="off"
              />
            </label>
            <label>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Namba ya Simu</div>
              <input
                {...bigInputProps()}
                value={form.guardian_phone}
                onChange={(e) => setForm((s) => ({ ...s, guardian_phone: e.target.value }))}
                placeholder="Mfano: 0700 000 021"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
          </div>
        )
      },
      {
        key: 'confirm',
        title: 'Thibitisha',
        help: 'Kagua taarifa kisha hifadhi.',
        render: () => (
          <div style={{ display: 'grid', gap: 10, fontSize: 18 }}>
            <div>
              <strong>Jina:</strong> {form.first_name} {form.last_name}
            </div>
            <div>
              <strong>Darasa:</strong> {form.class_name || '-'}
            </div>
            <div>
              <strong>Jinsia:</strong> {form.gender || '-'}
            </div>
            <div>
              <strong>Mzazi:</strong> {form.guardian_name || '-'}
            </div>
            <div>
              <strong>Simu:</strong> {form.guardian_phone || '-'}
            </div>
            <button
              type="button"
              onClick={() => {
                // In the next iteration this will call the offline-first local queue / API-light client
                alert('Imehifadhiwa (demo).');
              }}
              style={{
                marginTop: 12,
                padding: 16,
                fontSize: 18,
                borderRadius: 12,
                border: '1px solid #065f46',
                background: '#065f46',
                color: '#ffffff'
              }}
            >
              Hifadhi
            </button>
          </div>
        )
      }
    ],
    [form]
  );

  const canNext = (() => {
    if (steps[stepIndex].key === 'name') return form.first_name.trim() && form.last_name.trim();
    if (steps[stepIndex].key === 'class') return form.class_name.trim() && form.gender;
    if (steps[stepIndex].key === 'guardian') return form.guardian_name.trim() && form.guardian_phone.trim();
    return true;
  })();

  return (
    <StepWizard
      steps={steps}
      stepIndex={stepIndex}
      canNext={canNext}
      onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
      onNext={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
    />
  );
}

export default StudentEntry;
