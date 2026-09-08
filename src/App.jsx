import { Route, Routes, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Blog } from './pages/Blog'
import { BlogPost } from './pages/BlogPost'
import { Topics } from './pages/Topics'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Submit } from './pages/Submit'
import { Login } from './pages/admin/Login'
import { Security } from './pages/admin/Security'
import { AccountSignup } from './pages/account/AccountSignup'
import { AccountLogin } from './pages/account/AccountLogin'
import { ForgotPassword } from './pages/account/ForgotPassword'
import { ResetPassword } from './pages/account/ResetPassword'
import { Profile } from './pages/account/Profile'
import { NotFound } from './pages/NotFound'
import { WriteDashboard } from './pages/write/WriteDashboard'
import { PostEditor } from './pages/write/PostEditor'
import { ChatWidget } from './components/ChatWidget'
import { AdminProvider } from './context/AdminContext'
import { AccountProvider } from './context/AccountContext'
import { ToastProvider } from './context/ToastContext'
import './App.css'

// Keyed by pathname so each route mount gets a fresh fade-in — a cheap,
// dependency-free stand-in for a proper route-transition library.
function PageTransition({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  )
}

function App() {
  return (
    <AdminProvider>
      <AccountProvider>
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Nav />
          <main className="site-main" id="main-content" tabIndex={-1}>
            <PageTransition>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/topics" element={<Topics />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/submit" element={<Submit />} />
                <Route path="/submit/edit/:slug" element={<Submit />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin/security" element={<Security />} />
                <Route path="/account/signup" element={<AccountSignup />} />
                <Route path="/account/login" element={<AccountLogin />} />
                <Route path="/account/forgot-password" element={<ForgotPassword />} />
                <Route path="/account/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/write" element={<WriteDashboard />} />
                <Route path="/write/new" element={<PostEditor />} />
                <Route path="/write/:slug" element={<PostEditor />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </main>
          <Footer />
          <ChatWidget />
        </ToastProvider>
      </AccountProvider>
    </AdminProvider>
  )
}

export default App
