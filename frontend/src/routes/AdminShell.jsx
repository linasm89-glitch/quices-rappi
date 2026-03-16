import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import RappiLogo from '../components/ui/RappiLogo.jsx'
import { ToastProvider } from '../components/ui/Toast.jsx'
import ConnectionBanner from '../components/ui/ConnectionBanner.jsx'

// ─── Sidebar nav items ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Sesiones', end: true },
]

function SidebarLink({ to, icon: Icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold
        transition-all duration-150
        ${isActive
          ? 'bg-orange-50 text-[#FF441F]'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

// ─── AdminShell ─────────────────────────────────────────────────────────────
export default function AdminShell() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">

        <ConnectionBanner />

        {/* ── Top Navbar ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

            {/* Left: hamburger (mobile) + logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Abrir menú"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2.5">
                <RappiLogo size={32} />
                <div className="hidden sm:block">
                  <p className="text-sm font-extrabold text-gray-900 leading-none">The Training Hour</p>
                  <p className="text-xs text-gray-400 font-medium leading-none mt-0.5">Administrador</p>
                </div>
              </div>
            </div>

            {/* Right: user info + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end leading-none">
                <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-400 mt-0.5">{user?.email}</span>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-[#FF441F]">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
                title="Cerrar sesión"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 py-6 gap-6">

          {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 gap-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">
              Navegación
            </p>
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </aside>

          {/* ── Mobile Sidebar Overlay ────────────────────────────────────── */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-xl lg:hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <RappiLogo size={28} />
                      <span className="font-extrabold text-gray-900 text-sm">Training Hour</span>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <nav className="flex flex-col gap-1 p-3 flex-1">
                    {NAV_ITEMS.map((item) => (
                      <SidebarLink
                        key={item.to}
                        {...item}
                        onClick={() => setSidebarOpen(false)}
                      />
                    ))}
                  </nav>
                  <div className="p-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* ── Main Content ──────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
