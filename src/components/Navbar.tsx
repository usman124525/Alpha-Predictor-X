import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Shield,
  Trophy,
  Users,
  Swords,
  User as UserIcon,
  LogIn,
  LogOut,
  Menu,
  X,
  Crown,
  ChevronDown,
  UserPlus,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string, param?: any) => void;
  orgName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, orgName = 'Alpha Predictor X' }) => {
  const { user, player, isAdmin, isCaptain, logout, openAuthModal, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo */}
          <div
            id="nav-brand"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-neutral-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black tracking-wider uppercase text-white font-mono">
                  {orgName}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded font-mono">
                  PUBG MOBILE
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-neutral-400 font-mono tracking-wide uppercase hidden xs:block">
                Competitive Esports Platform
              </p>
            </div>
          </div>

          {/* Desktop & Large Tablet Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            <button
              id="nav-home"
              onClick={() => handleNav('home')}
              className={`px-3 py-2 rounded-lg text-xs lg:text-sm font-bold font-mono tracking-wider transition ${
                currentTab === 'home'
                  ? 'bg-neutral-800 text-amber-400 shadow-inner'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              HOME
            </button>
            <button
              id="nav-scrims"
              onClick={() => handleNav('scrims')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-bold font-mono tracking-wider transition ${
                currentTab === 'scrims'
                  ? 'bg-neutral-800 text-amber-400 shadow-inner'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Swords className="w-4 h-4 text-amber-400" />
              SCRIMS
            </button>
            <button
              id="nav-tournaments"
              onClick={() => handleNav('tournaments')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-bold font-mono tracking-wider transition ${
                currentTab === 'tournaments'
                  ? 'bg-neutral-800 text-amber-400 shadow-inner'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              TOURNAMENTS
            </button>
            <button
              id="nav-teams"
              onClick={() => handleNav('teams')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-bold font-mono tracking-wider transition ${
                currentTab === 'teams'
                  ? 'bg-neutral-800 text-amber-400 shadow-inner'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              TEAMS
            </button>
            {isAdmin && (
              <button
                id="nav-admin"
                onClick={() => handleNav('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-bold font-mono tracking-wider transition border ${
                  currentTab === 'admin'
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                    : 'text-amber-300 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'
                }`}
              >
                <Crown className="w-4 h-4" />
                ADMIN
              </button>
            )}
          </nav>

          {/* User Auth Section (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  id="nav-user-dropdown-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    userDropdownOpen
                      ? 'border-amber-400 bg-neutral-900 text-white shadow-md'
                      : 'border-neutral-800 bg-neutral-900/80 text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-black text-xs flex items-center justify-center">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="leading-tight font-bold text-white max-w-[120px] truncate">{user.name}</p>
                    <span
                      className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded inline-block ${
                        isAdmin
                          ? 'bg-amber-500/20 text-amber-300'
                          : isCaptain
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {isAdmin ? 'ADMIN' : isCaptain ? 'CAPTAIN' : 'PLAYER'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2 border-b border-neutral-800">
                      <p className="font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                      {player?.pubgName && (
                        <p className="text-[10px] text-amber-400 font-mono mt-1">
                          IGN: {player.pubgName}
                        </p>
                      )}
                    </div>

                    <button
                      id="nav-dropdown-profile"
                      onClick={() => handleNav('profile')}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-800 text-neutral-200 hover:text-white transition"
                    >
                      <UserIcon className="w-4 h-4 text-amber-400" />
                      <span>In-Game Profile & UID</span>
                    </button>

                    <button
                      id="nav-dropdown-teams"
                      onClick={() => handleNav('teams')}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-800 text-neutral-200 hover:text-white transition"
                    >
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>My Teams & Rosters</span>
                    </button>

                    {isAdmin && (
                      <button
                        id="nav-dropdown-admin"
                        onClick={() => handleNav('admin')}
                        className="w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-800 text-amber-300 font-semibold transition"
                      >
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Admin Command Center</span>
                      </button>
                    )}

                    <div className="border-t border-neutral-800 my-1" />

                    <button
                      id="nav-dropdown-logout"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-signin"
                  onClick={() => openAuthModal('signin')}
                  disabled={isLoading}
                  className="text-neutral-200 hover:text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg hover:bg-neutral-900 transition"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-signup"
                  onClick={() => openAuthModal('signup')}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition shadow-md shadow-amber-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <button
                onClick={() => openAuthModal('signin')}
                className="text-amber-400 font-bold text-xs uppercase tracking-wider px-2.5 py-1.5 rounded border border-amber-500/30 bg-amber-500/10"
              >
                Sign In
              </button>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950/98 border-b border-neutral-800 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          {/* User badge on mobile */}
          {user && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-xs leading-tight">{user.name}</p>
                  <p className="text-[10px] text-neutral-400">{user.email}</p>
                </div>
              </div>
              <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                {user.role}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold uppercase tracking-wider">
            <button
              onClick={() => handleNav('home')}
              className={`p-3 rounded-xl text-left transition flex items-center gap-2 ${
                currentTab === 'home'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <span>HOME</span>
            </button>
            <button
              onClick={() => handleNav('scrims')}
              className={`p-3 rounded-xl text-left transition flex items-center gap-2 ${
                currentTab === 'scrims'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>SCRIMS</span>
            </button>
            <button
              onClick={() => handleNav('tournaments')}
              className={`p-3 rounded-xl text-left transition flex items-center gap-2 ${
                currentTab === 'tournaments'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>TOURNAMENTS</span>
            </button>
            <button
              onClick={() => handleNav('teams')}
              className={`p-3 rounded-xl text-left transition flex items-center gap-2 ${
                currentTab === 'teams'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>TEAMS</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-2">
            <button
              onClick={() => handleNav('profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                currentTab === 'profile'
                  ? 'bg-neutral-800 text-amber-400'
                  : 'bg-neutral-900/50 text-neutral-300 hover:bg-neutral-850'
              }`}
            >
              <UserIcon className="w-4 h-4 text-amber-400" />
              <span>Player Profile & In-Game UID</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
                  currentTab === 'admin'
                    ? 'bg-amber-500 text-neutral-950 border-amber-400'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Admin Command Center</span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-850 mt-2">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user.email})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signin');
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signup');
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-2.5 rounded-xl text-xs uppercase"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
