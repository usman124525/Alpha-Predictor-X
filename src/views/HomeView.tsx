import React from 'react';
import { EsportsEvent, OrganizationSettings } from '../types.ts';
import { EventCard } from '../components/EventCard.tsx';
import { Swords, Trophy, Users, ShieldCheck, ArrowRight, Zap, Flame } from 'lucide-react';

interface HomeViewProps {
  events: EsportsEvent[];
  settings: OrganizationSettings | null;
  stats: {
    totalTeams: number;
    totalPlayers: number;
    totalEvents: number;
    pendingPayments: number;
  };
  onViewEvent: (event: EsportsEvent) => void;
  onRegisterEvent: (event: EsportsEvent) => void;
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  events,
  settings,
  stats,
  onViewEvent,
  onRegisterEvent,
  onNavigate,
}) => {
  const scrims = events.filter((e) => e.type === 'scrim' && e.status !== 'Archived').slice(0, 4);
  const tournaments = events.filter((e) => e.type === 'tournament' && e.status !== 'Archived').slice(0, 2);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 p-6 sm:p-10 lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-neutral-950 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Competitive PUBG MOBILE Hub
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight font-mono leading-none">
            {settings?.orgName || 'Alpha Predictor X'}
            <span className="block text-amber-400 text-2xl sm:text-4xl mt-2">
              Daily Scrims & Tournaments
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
            {settings?.description ||
              'Official esports management portal. Register permanent teams, manage squad lineups, verify entry payments manually, and battle for competitive glory across Erangel, Miramar, and Sanhok.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-view-scrims"
              onClick={() => onNavigate('scrims')}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition shadow-lg shadow-amber-500/20"
            >
              <Swords className="w-4 h-4" />
              Browse Scrims
            </button>

            <button
              id="hero-create-team"
              onClick={() => onNavigate('teams')}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-100 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg border border-neutral-700 transition"
            >
              <Users className="w-4 h-4 text-amber-400" />
              Manage Teams
            </button>
          </div>
        </div>
      </section>

      {/* Organization Metric Counters */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-xl text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.totalTeams}</p>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">Permanent Teams</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-xl text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.totalPlayers}</p>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">Verified Players</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-xl text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Swords className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.totalEvents}</p>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">Events Hosted</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-xl text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">100%</p>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">Manual Verification</p>
        </div>
      </section>

      {/* Upcoming Daily Scrims */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide font-mono">Daily Scrims</h2>
              <p className="text-xs text-neutral-400">High-tier practice matches with verified slots</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('scrims')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 group"
          >
            <span>View All Scrims</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {scrims.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-8 text-center text-neutral-400 text-sm">
            No scrims scheduled right now. Check back soon or create one from the Admin Panel.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {scrims.map((scrim) => (
              <EventCard
                key={scrim.id}
                event={scrim}
                onView={onViewEvent}
                onRegister={onRegisterEvent}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Tournaments */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide font-mono">Major Tournaments</h2>
              <p className="text-xs text-neutral-400">Prize pool tournaments with PMGC points systems</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('tournaments')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 group"
          >
            <span>View All Tournaments</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-8 text-center text-neutral-400 text-sm">
            No major tournaments open right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tournaments.map((tourney) => (
              <EventCard
                key={tourney.id}
                event={tourney}
                onView={onViewEvent}
                onRegister={onRegisterEvent}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4-Step Registration Process */}
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-black text-white uppercase tracking-wide font-mono text-center">
          How Scrim & Tournament Registration Works
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="font-bold text-neutral-200 uppercase">One-Time Team Creation</h4>
            <p className="text-neutral-400 leading-relaxed">
              Create your permanent team once. Share your unique invite link or team code with teammates.
            </p>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="font-bold text-neutral-200 uppercase">Lineup Selection</h4>
            <p className="text-neutral-400 leading-relaxed">
              For any daily scrim, your captain picks the 4 active players directly from the saved roster.
            </p>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="font-bold text-neutral-200 uppercase">Manual Payment</h4>
            <p className="text-neutral-400 leading-relaxed">
              Send entry fee to active Easypaisa/JazzCash accounts, upload transaction screenshot and TID.
            </p>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center text-xs">
              4
            </div>
            <h4 className="font-bold text-neutral-200 uppercase">Slot & Room Key</h4>
            <p className="text-neutral-400 leading-relaxed">
              Admin approves verification, confirmed slot number is assigned, and custom room ID/password unlocks.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
