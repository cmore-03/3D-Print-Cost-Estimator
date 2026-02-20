import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard,
  Package,
  Printer,
  Calculator,
  Menu,
  X,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Spools', icon: Package, page: 'Spools' },
  { name: 'Prints', icon: Printer, page: 'Prints' },
  { name: 'Calculator', icon: Calculator, page: 'CostCalculator' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try {
          const userData = await base44.auth.me();
          setUser(userData);
        } catch (e) {
          // User not authenticated
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const hideSidebar = ['AddSpool', 'AddPrint', 'SpoolDetail'].includes(currentPageName);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <style>{`
        :root {
          --background: 222 47% 6%;
          --foreground: 210 40% 98%;
          --card: 222 47% 8%;
          --card-foreground: 210 40% 98%;
          --popover: 222 47% 8%;
          --popover-foreground: 210 40% 98%;
          --primary: 187 92% 55%;
          --primary-foreground: 222 47% 6%;
          --secondary: 217 33% 17%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217 33% 17%;
          --muted-foreground: 215 20% 55%;
          --accent: 217 33% 17%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 63% 55%;
          --destructive-foreground: 210 40% 98%;
          --border: 217 33% 17%;
          --input: 217 33% 17%;
          --ring: 187 92% 55%;
          --radius: 0.75rem;
        }
        body { background: #0a0e1a; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>

      {/* Mobile header */}
      {!hideSidebar && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">PrintCost</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-slate-400">
                    {user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleLogin} className="text-slate-400 hover:text-white">
                <LogIn className="w-4 h-4 mr-1" />
                Login
              </Button>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-400">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Mobile menu overlay */}
      {mobileOpen && !hideSidebar && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="bg-[#0c1021] w-64 h-full p-6 pt-20 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map(item => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  currentPageName === item.page
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        {!hideSidebar && (
          <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-[#0c1021]/80 backdrop-blur-xl border-r border-white/[0.04] z-30">
            <div className="p-6 pb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Printer className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">PrintCost</span>
              </div>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    currentPageName === item.page
                      ? "bg-cyan-500/10 text-cyan-400 shadow-sm shadow-cyan-500/5"
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-3">
              {isAuthenticated ? (
                <div className="mx-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{user?.full_name || 'User'}</p>
                      <p className="text-[10px] text-slate-600 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7"
                  >
                    <LogOut className="w-3 h-3 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="mx-3">
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm h-9"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </div>
              )}
              <div className="p-4 mx-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">PrintCost v1.0</p>
                <p className="text-[10px] text-slate-700 mt-0.5">3D Print Cost Estimator</p>
              </div>
            </div>
            </aside>
            )}

        {/* Main */}
        <main className={cn(
          "flex-1 min-h-screen",
          !hideSidebar ? "lg:ml-56 pt-16 lg:pt-0" : ""
        )}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
