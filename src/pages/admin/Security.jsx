import { Navigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import { SecurityPanel } from './SecurityPanel'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import '../write/Write.css'

export function Security() {
  useDocumentTitle('Security — Ian Tirop')
  useMetaRobots()
  const { isAdmin, loading: authLoading } = useAdmin()

  if (!authLoading && !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <section className="container write-page">
      <div className="write-header">
        <div>
          <p className="eyebrow">Write</p>
          <h1>Security</h1>
        </div>
      </div>

      <SecurityPanel />
    </section>
  )
}
