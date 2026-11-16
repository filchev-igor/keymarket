import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import Spinner from './Spinner'

/** Wraps pages that need a signed-in user (checkout, orders). Guests are sent to sign in and then come back. */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading)
    return (
      <div className="container">
        <Spinner centered />
      </div>
    )
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return children
}

export default RequireAuth
