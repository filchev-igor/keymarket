const STEPS = ['Cart', 'Payment', 'Receive item']

/** The three-step purchase header (cart, payment, receive item). `step` is 1-3. */
const Stepper = ({ step }: { step: 1 | 2 | 3 }) => {
  return (
    <ol className="steps" aria-label="Purchase steps" style={{ listStyle: 'none', padding: 0 }}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'active' : ''
        return (
          <li key={label} style={{ display: 'contents' }}>
            <span className={`step ${state}`} aria-current={n === step ? 'step' : undefined}>
              <span className="step-num">{n}</span>
              <span className="step-label">{label}</span>
            </span>
            {n < STEPS.length && <span className="step-line" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}

export default Stepper
