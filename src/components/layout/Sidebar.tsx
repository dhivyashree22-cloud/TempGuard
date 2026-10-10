import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  History,
  FlaskConical,
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  Layers,
} from 'lucide-react';
import { StorageProfile } from '../../types';

export type NavigationTab =
  | 'overview'
  | 'analysis'
  | 'history'
  | 'testlab'
  | 'methodology';

interface SidebarProps {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  profiles: StorageProfile[];
  selectedProfile: StorageProfile;
  onSelectProfile: (profile: StorageProfile) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  excursionCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  profiles,
  selectedProfile,
  onSelectProfile,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  excursionCount,
}) => {
  const navItems = [
    {
      id: 'overview' as NavigationTab,
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: excursionCount > 0 ? `${excursionCount}` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'analysis' as NavigationTab,
      label: 'Temperature Analysis',
      icon: <LineChart className="w-4 h-4" />,
      badge: undefined,
    },
    {
      id: 'history' as NavigationTab,
      label: 'Excursion History',
      icon: <History className="w-4 h-4" />,
      badge: undefined,
    },
    {
      id: 'testlab' as NavigationTab,
      label: 'Test Lab',
      icon: <FlaskConical className="w-4 h-4" />,
      badge: 'Interactive',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'methodology' as NavigationTab,
      label: 'Settings & Methodology',
      icon: <BookOpen className="w-4 h-4" />,
      badge: undefined,
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  const content = (
    <div className="flex flex-col h-full justify-between p-4 space-y-6">
      {/* Navigation Links */}
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
            Core Monitoring
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Storage Profile Quick Switcher */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-cyan-400" />
              Storage Profile
            </span>
            <button
              onClick={() => handleNavClick('methodology')}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              title="Edit Profile Boundaries"
            >
              <Sliders className="w-3 h-3" />
              Configure
            </button>
          </div>

          <div className="space-y-1.5">
            {profiles.map((p) => {
              const isSelected = selectedProfile.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProfile(p)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-medium truncate ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {p.name}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 shrink-0 ml-1"></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Envelope:</span>
                    <span className="text-cyan-300 font-semibold">
                      {p.minTemp.toFixed(1)}°C to {p.maxTemp.toFixed(1)}°C
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Protocol Notice Footer */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>System Status</span>
        </div>
        <p className="text-slate-400 leading-tight">
          Monitoring engine: Pure TypeScript. Deterministic interval analysis active.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-72 shrink-0 bg-slate-900/60 border-r border-slate-800/80 min-h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
