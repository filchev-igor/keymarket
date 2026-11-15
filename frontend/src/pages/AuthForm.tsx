import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../auth'

/** One form for both sign in and register. */
export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/'
  const isRegister = mode === 'register'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setBusy(true)
    try {
      if (isRegister) await register(name, email, password)
      else await login(email, password)
      navigate(next, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      if (err instanceof ApiError) setFieldErrors(err.errors)
      setBusy(false)
    }
  }

  const fieldError = (field: string) => fieldErrors[field]?.map((m) => <span key={m} className="error small">{m}</span>)

  return (
    <div className="container narrow">
      <form onSubmit={submit} className="panel">
        <h1>{isRegister ? 'Create account' : 'Sign in'}</h1>
        {isRegister && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            {fieldError('name')}
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          {fieldError('email')}
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          {isRegister && <span className="muted small">At least 8 characters</span>}
          {fieldError('password')}
        </label>
        {error && Object.keys(fieldErrors).length === 0 && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>{isRegister ? 'Create account' : 'Sign in'}</button>
        <p className="muted">
          {isRegister ? (
            <>Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></>
          ) : (
            <>New here? <Link to={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link></>
          )}
        </p>
        {!isRegister && <p className="muted small">Demo account: demo@keymarket.test / demo1234</p>}
      </form>
    </div>
  )
}
