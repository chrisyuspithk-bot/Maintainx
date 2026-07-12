import { NavLink, Outlet } from 'react-router-dom';
import { API_BASE, CURRENT_USER } from '../api/client';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '\u25C9', end: true },
  { to: '/suppliers', label: 'Suppliers', icon: '\uD83C\uDFE2' },
  { to: '/parts', label: 'Parts Catalog', icon: '\uD83D\uDCE6' },
  { to: '/inventory', label: 'Inventory', icon: '\uD83D\uDCCA' },
  { to: '/pos', label: 'Purchase Orders', icon: '\uD83D\uDCDD' },
  { to: '/approvals', label: 'Approvals Queue', icon: '\u2705' },
  { to: '/projects', label: 'Projects', icon: '\uD83D\uDCC1' },
  { to: '/maintenance', label: 'Maintenance', icon: '\uD83D\uDD27' },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-white font-bold text-xl tracking-tighter">S</div>
            <div>
              <div className="font-semibold text-xl tracking-tight">SPIT MaintainX</div>
              <div className="text-[10px] text-slate-500 -mt-1">Maintenance {'\u2022'} Inventory {'\u2022'} Procurement</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">{API_BASE}</div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {CURRENT_USER}
            </div>
            <button onClick={() => window.location.reload()} className="text-xs px-3 py-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 text-slate-600">
              {'\u21BB'} Refresh
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto flex">
        <aside className="w-64 border-r bg-white min-h-[calc(100vh-4rem)] p-3">
          <nav className="space-y-1 text-sm">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-all ${
                    isActive ? 'bg-sky-50 text-sky-700 font-medium shadow-sm' : 'hover:bg-slate-50 text-slate-700'
                  }`}
              >
                <span className="text-lg w-5">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 px-4 text-[10px] text-slate-400">Phase 1{'\u2013'}4 {'\u2022'} Cloudflare Workers + Neon</div>
        </aside>
        <main className="flex-1 p-8 max-w-[1100px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
