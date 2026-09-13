import React from 'react';
import { EsportsEvent } from '../types.ts';
import { Calendar, Clock, MapPin, Users, Trophy, Swords, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: EsportsEvent;
  onView: (event: EsportsEvent) => void;
  onRegister: (event: EsportsEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onView, onRegister }) => {
  const confirmed = event.confirmedCount ?? 0;
  const max = event.maxTeams || 25;
  const slotPercent = Math.min(100, Math.round((confirmed / max) * 100));
  const isFull = confirmed >= max || event.status === 'Full';
  const isOpen = event.status === 'Registration Open' && !isFull;

  const getStatusBadge = () => {
    switch (event.status) {
      case 'Registration Open':
        return isFull ? (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            SLOTS FULL
          </span>
        ) : (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            REGISTRATION OPEN
          </span>
        );
      case 'Live':
        return (
          <span className="bg-amber-500 text-neutral-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            MATCH LIVE
          </span>
        );
      case 'Completed':
        return (
          <span className="bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            COMPLETED
          </span>
        );
      case 'Registration Closed':
        return (
          <span className="bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            CLOSED
          </span>
        );
      default:
        return (
          <span className="bg-neutral-800 text-neutral-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {event.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden transition-all shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between group">
      {/* Header Bar */}
      <div className="p-5 border-b border-neutral-800/80 bg-gradient-to-r from-neutral-900 to-neutral-850">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            {event.type === 'tournament' ? (
              <span className="flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                <Trophy className="w-3 h-3" />
                Tournament
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                <Swords className="w-3 h-3" />
                Daily Scrim
              </span>
            )}
            <span className="text-[11px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded font-mono">
              {event.mode}
            </span>
          </div>

          <div>{getStatusBadge()}</div>
        </div>

        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors uppercase tracking-wide line-clamp-1 font-mono">
          {event.name}
        </h3>
      </div>

      {/* Body Info */}
      <div className="p-5 space-y-4 text-xs text-neutral-300">
        <div className="grid grid-cols-2 gap-3 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-semibold">Date</p>
              <p className="font-semibold text-neutral-200">{event.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-semibold">Start Time</p>
              <p className="font-semibold text-neutral-200">{event.startTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-semibold">Map</p>
              <p className="font-semibold text-neutral-200">{event.map}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
              Rs
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-semibold">Entry Fee</p>
              <p className="font-bold text-amber-400 font-mono">
                {event.entryFee === 0 ? 'FREE ENTRY' : `Rs. ${event.entryFee}`}
              </p>
            </div>
          </div>
        </div>

        {/* Slot Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-neutral-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              Registered Slots
            </span>
            <span className="font-mono font-bold text-neutral-200">
              {confirmed} / {max} <span className="text-neutral-400 text-[10px]">Teams</span>
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                slotPercent >= 100
                  ? 'bg-red-500'
                  : slotPercent > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${slotPercent}%` }}
            />
          </div>
        </div>

        {event.prizeInfo && (
          <div className="text-[11px] bg-amber-500/5 border border-amber-500/20 rounded p-2 text-amber-300 font-medium">
            🏆 <span className="text-neutral-300">{event.prizeInfo}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-5 pt-0 grid grid-cols-2 gap-2">
        <button
          id={`view-event-${event.id}`}
          onClick={() => onView(event)}
          className="w-full bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold py-2.5 px-3 rounded-lg transition text-center border border-neutral-700/60"
        >
          View Details
        </button>

        <button
          id={`register-event-${event.id}`}
          onClick={() => onRegister(event)}
          disabled={!isOpen}
          className={`w-full flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-3 rounded-lg transition uppercase tracking-wider ${
            isOpen
              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
              : 'bg-neutral-800 text-neutral-400 cursor-not-allowed border border-neutral-800'
          }`}
        >
          <span>Register</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
