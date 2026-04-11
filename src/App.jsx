import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Contacts from './pages/Contacts'
import Goals from './pages/Goals'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <div style={{ padding: '32px' }}>{children}</div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />
        <Route path="/projects" element={
          <PrivateRoute>
            <Layout><Projects /></Layout>
          </PrivateRoute>
        } />
        <Route path="/contacts" element={
          <PrivateRoute>
            <Layout><Contacts /></Layout>
          </PrivateRoute>
        } />
        <Route path="/goals" element={
          <PrivateRoute>
            <Layout><Goals /></Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}