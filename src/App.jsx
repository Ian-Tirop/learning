import { Route, Routes } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Blog } from './pages/Blog'
import { BlogPost } from './pages/BlogPost'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Submit } from './pages/Submit'
import { Login } from './pages/admin/Login'
import { AccountSignup } from './pages/account/AccountSignup'
import { AccountLogin } from './pages/account/AccountLogin'
import { Profile } from './pages/account/Profile'
import { NotFound } from './pages/NotFound'
import { WriteDashboard } from './pages/write/WriteDashboard'
import { PostEditor } from './pages/write/PostEditor'
import { ChatWidget } from './components/ChatWidget'
import { AdminProvider } from './context/AdminContext'
import { AccountProvider } from './context/AccountContext'
import './App.css'

function App() {
  return (
    <AdminProvider>
      <AccountProvider>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Nav />
        <main className="site-main" id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/submit/edit/:slug" element={<Submit />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/account/signup" element={<AccountSignup />} />
            <Route path="/account/login" element={<AccountLogin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/write" element={<WriteDashboard />} />
            <Route path="/write/new" element={<PostEditor />} />
            <Route path="/write/:slug" element={<PostEditor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <ChatWidget />
      </AccountProvider>
    </AdminProvider>
  )
}

export default App
