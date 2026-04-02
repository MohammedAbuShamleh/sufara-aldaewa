import { useNavigate, useLocation } from 'react-router-dom'
import '../../styles/theme.css'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { path: '/dashboard', label: 'لوحة التحكم' },
    { path: '/form', label: 'نموذج جديد' },
  ]

  return (
    <aside style={{
      width: '200px',
      backgroundColor: '#fff',
      padding: '1rem',
      boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
      minHeight: 'calc(100vh - 80px)'
    }}>
      <nav>
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="btn"
            style={{
              width: '100%',
              marginBottom: '0.5rem',
              textAlign: 'right',
              backgroundColor: location.pathname === item.path ? 'var(--teal)' : 'transparent',
              color: location.pathname === item.path ? '#fff' : 'var(--dark-gray)',
              border: '1px solid #ddd'
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
