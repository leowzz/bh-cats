import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../app/providers';

const navItems = [
  { to: '/', label: '首页' },
  { to: '/cats', label: '档案' },
  { to: '/community', label: '社区' },
  { to: '/profile', label: '我的' },
  { to: '/admin', label: '管理后台' }
];

export function AppShell() {
  const { role, logout } = useAuth();

  return (
    <div className="min-h-screen text-ink-900">
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-moss-700">Campus Cat Atlas</p>
            <h1 className="font-display text-2xl md:text-3xl">北华大学猫猫档案</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-700">
            <span>{role ? `当前身份：${role === 'admin' ? '管理员' : '普通用户'}` : '游客模式'}</span>
            {role ? (
              <button className="ghost-btn" onClick={logout} type="button">
                退出登录
              </button>
            ) : (
              <div className="flex gap-2">
                <NavLink className="ghost-btn" to="/login">
                  登录
                </NavLink>
                <NavLink className="action-btn" to="/register">
                  注册
                </NavLink>
              </div>
            )}
          </div>
        </div>
        <nav className="flex flex-wrap gap-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-ink-900 text-white' : 'bg-white/70 text-ink-900 hover:bg-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-12 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
