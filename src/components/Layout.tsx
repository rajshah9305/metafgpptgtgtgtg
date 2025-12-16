import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Monitor, Settings, Menu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from "sonner";


interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Output', href: '/output', icon: Monitor },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const currentPage = navigation.find(item => item.href === location.pathname)?.name || 'Dashboard';

  const NavLinkItem = ({ item, mobile = false }: { item: NavItem; mobile?: boolean }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        to={item.href}
        onClick={() => mobile && setIsMobileOpen(false)}
        className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all focus-ring ${
          isActive
            ? 'bg-orange-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600'
        }`}
      >
        <div className={`p-2 rounded-md transition-all ${
          isActive ? 'bg-white/20' : 'group-hover:bg-orange-50'
        }`}>
          <Icon className={`h-4 w-4 transition-all ${
            isActive ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'
          }`} />
        </div>
        <span className={`text-sm font-medium transition-all ${
          isActive ? 'text-white' : 'text-gray-700 group-hover:text-orange-600'
        }`}>{item.name}</span>
        {isActive && (
          <div className="ml-auto">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-6 py-4 fixed top-0 left-0 right-0 z-30 flex items-center justify-between shadow-sm backdrop-blur-lg bg-white/95">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-h5 font-bold text-gray-900">Raj AI</span>
            <p className="text-caption text-orange-600 font-medium">{currentPage}</p>
          </div>
        </div>
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="btn btn-ghost btn-sm"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {isMobileOpen && (
            <div className="absolute top-12 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-600 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-h5 font-bold text-gray-900">Raj AI</span>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                {navigation.map((item) => (
                  <NavLinkItem key={item.name} item={item} mobile />
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-20 shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-3 rounded-lg shadow-sm">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-h4 font-bold text-gray-900">Raj AI</span>
              <p className="text-caption text-orange-600 font-medium">Enterprise Platform</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <div className="mb-6">
            <h3 className="text-label-sm text-gray-500 mb-3 px-4">NAVIGATION</h3>
            <div className="space-y-1">
              {navigation.map((item, index) => (
                <div key={item.name} className="animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                  <NavLinkItem item={item} />
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="status-dot bg-green-500"></div>
              <span className="text-label-sm text-gray-600">SYSTEM STATUS</span>
            </div>
            <div className="text-body-sm font-semibold text-gray-900 mb-3">All Systems Operational</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-caption text-gray-600">Performance</span>
                <span className="text-caption font-semibold text-green-600">98%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{width: '98%'}} />
              </div>
              <div className="flex items-center gap-4 pt-1">
                <div className="status-indicator">
                  <div className="status-dot bg-green-500"></div>
                  <span className="text-caption text-gray-600">API Active</span>
                </div>
                <div className="status-indicator">
                  <div className="status-dot bg-blue-500"></div>
                  <span className="text-caption text-gray-600">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0 bg-gray-50 min-h-screen">
        <div className="container py-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
      

      <Toaster />
    </div>
  );
}