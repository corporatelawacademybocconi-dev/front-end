import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>Personal ERP</span>
      <div style={styles.links}>
        <Link style={styles.link} to="/">Dashboard</Link>
        <Link style={styles.link} to="/projects">Projects</Link>
        <Link style={styles.link} to="/contacts">Contacts</Link>
        <Link style={styles.link} to="/goals">Goals</Link>
        <button style={styles.logout} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '60px',
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
  },
  brand: {
    fontWeight: '700',
    fontSize: '16px',
    color: '#6366f1',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  link: {
    textDecoration: 'none',
    color: '#444',
    fontSize: '14px',
  },
  logout: {
    background: 'none',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#444',
  },
}