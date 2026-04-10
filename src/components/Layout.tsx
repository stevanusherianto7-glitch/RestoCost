import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ChefHat, UtensilsCrossed, Users } from 'lucide-react';
import clsx from 'clsx';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const navItems = [
    { name: 'ERP Engine', href: '/erp', icon: LayoutDashboard },
    { name: 'Bahan Baku', href: '/ingredients', icon: UtensilsCrossed },
    { name: 'Resep Menu', href: '/recipes', icon: ChefHat },
    { name: 'Karyawan', href: '/employees', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 fixed h-full hidden md:block shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8" />
            PSRestoCost
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all',
                  isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-10 p-4 flex items-center justify-between">
         <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            PSRestoCost
          </h1>
          {/* Simple mobile nav could go here, for now just links */}
          <div className="flex gap-4">
             <Link to="/ingredients" className="text-gray-600"><UtensilsCrossed /></Link>
             <Link to="/recipes" className="text-gray-600"><ChefHat /></Link>
             <Link to="/employees" className="text-gray-600"><Users /></Link>
          </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-16 md:mt-0">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
