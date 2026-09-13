import React, { useState } from 'react';
import { EsportsEvent } from '../types.ts';
import { EventCard } from '../components/EventCard.tsx';
import { Search, Filter, Swords, Trophy } from 'lucide-react';

interface EventsViewProps {
  events: EsportsEvent[];
  initialType?: 'all' | 'scrim' | 'tournament';
  onViewEvent: (event: EsportsEvent) => void;
  onRegisterEvent: (event: EsportsEvent) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  initialType = 'all',
  onViewEvent,
  onRegisterEvent,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'scrim' | 'tournament'>(initialType);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = events.filter((ev) => {
    if (typeFilter !== 'all' && ev.type !== typeFilter) return false;
    if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ev.name.toLowerCase().includes(q);
      const matchMap = ev.map.toLowerCase().includes(q);
      if (!matchName && !matchMap) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
            {typeFilter === 'scrim' ? (
              <>
                <Swords className="w-6 h-6 text-sky-400" />
                <span>Daily Scrims</span>
              </>
            ) : typeFilter === 'tournament' ? (
              <>
                <Trophy className="w-6 h-6 text-amber-400" />
                <span>Tournaments</span>
              </>
            ) : (
              <span>All Esports Events</span>
            )}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Browse upcoming PUBG MOBILE scrims and tournaments. View slots, rules, and register your team.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition shrink-0 ${
              typeFilter === 'all'
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setTypeFilter('scrim')}
            className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition shrink-0 ${
              typeFilter === 'scrim'
                ? 'bg-sky-500 text-neutral-950 font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            Scrims
          </button>
          <button
            onClick={() => setTypeFilter('tournament')}
            className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition shrink-0 ${
              typeFilter === 'tournament'
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            Tournaments
          </button>
        </div>

        {/* Status Dropdown & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search event or map..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="Registration Open">Registration Open</option>
              <option value="Live">Live</option>
              <option value="Completed">Completed</option>
              <option value="Registration Closed">Registration Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <Filter className="w-8 h-8 mx-auto text-neutral-400" />
          <h3 className="text-base font-bold text-neutral-200 uppercase font-mono">No events match your criteria</h3>
          <p className="text-xs text-neutral-400">Try changing your search query or reset the status filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onView={onViewEvent}
              onRegister={onRegisterEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
};
