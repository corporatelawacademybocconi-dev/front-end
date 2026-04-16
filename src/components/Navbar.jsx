import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

const NAV_LINKS = [
  { to: '/',         label: 'Dashboard' },
  { to: '/projects', label: 'Projects'  },
  { to: '/contacts', label: 'Contacts'  },
  { to: '/goals',    label: 'Goals'     },
  { to: '/money',    label: 'Money'     },
]

export default function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={s.nav}>
      <span style={s.brand}>CLA ERP</span>

      <div style={s.links}>
        {NAV_LINKS.map(({ to, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              style={{ ...s.link, ...(active ? s.linkActive : {}) }}
            >
              {label}
              {active && <span style={s.activeDot} />}
            </Link>
          )
        })}
      </div>

      <button style={s.logout} onClick={handleLogout}>
        Sign out
      </button>
    </nav>
  )
}

const s = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '60px',
    background: '#fff',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  brand: {
    fontWeight: '800',
    fontSize: '17px',
    color: '#6366f1',
    letterSpacing: '-0.02em',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  link: {
    textDecoration: 'none',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    padding: '6px 14px',
    borderRadius: '8px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'color 0.15s, background 0.15s',
  },
  linkActive: {
    color: '#6366f1',
    background: '#eef2ff',
  },
  activeDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: '#6366f1',
    display: 'block',
  },
  logout: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '7px 16px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#64748b',
    fontWeight: '500',
    transition: 'all 0.15s',
  },
}
