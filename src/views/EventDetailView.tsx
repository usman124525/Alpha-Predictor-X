import React, { useState, useEffect } from 'react';
import { EsportsEvent, EventRegistration, MatchResult } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  Clock3,
  XCircle,
  FileText,
  Swords,
  ChevronLeft,
} from 'lucide-react';

interface EventDetailViewProps {
  eventId: number;
  onBack: () => void;
  onRegisterTeam: (event: EsportsEvent) => void;
  onPayForRegistration: (registrationId: number, event: EsportsEvent) => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  eventId,
  onBack,
  onRegisterTeam,
  onPayForRegistration,
}) => {
  const { user, isAdmin, token } = useAuth();
  const [event, setEvent] = useState<EsportsEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [resultsList, setResultsList] = useState<MatchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'teams' | 'results'>('info');
  const [isLoading, setIsLoading] = useState(true);

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        setRegistrations(data.registrations || []);
      }
    } catch (e) {
      console.error('Failed to load event:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/results`);
      if (res.ok) {
        const data = await res.json();
        setResultsList(data || []);
      }
    } catch (e) {
      console.error('Failed to load results:', e);
    }
  };

  useEffect(() => {
    fetchEventDetails();
    fetchResults();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-neutral-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider">Loading Event Details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-3">
        <p className="text-red-400 font-bold">Event not found.</p>
        <button
          onClick={onBack}
          className="bg-neutral-800 text-neutral-200 px-4 py-2 rounded text-xs"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const confirmedCount = registrations.filter((r) => r.registrationStatus === 'CONFIRMED').length;
  const isFull = confirmedCount >= event.maxTeams;
  const isRegistrationOpen = event.status === 'Registration Open' && !isFull;

  // Check if current user has a team registered
  const userRegistration = registrations.find((r) => r.registeredBy === user?.id);
  const isUserConfirmed = userRegistration?.registrationStatus === 'CONFIRMED';
  const canSeeRoom = isAdmin || isUserConfirmed;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>

      {/* Main Event Header Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded">
                {event.type.toUpperCase()}
              </span>
              <span className="text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded">
                {event.mode}
              </span>
              <span className="text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded">
                Map: {event.map}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border ${
                  event.status === 'Registration Open'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {event.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white font-mono uppercase tracking-tight">
              {event.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300 font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                {event.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                {event.startTime}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                💰 {event.entryFee === 0 ? 'FREE' : `Rs. ${event.entryFee}`}
              </span>
            </div>
          </div>

          {/* Registration CTA & Status Banner */}
          <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 sm:w-80 shrink-0 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Confirmed Slots</span>
              <span className="font-bold text-white font-mono text-sm">
                {confirmedCount} / {event.maxTeams}
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${Math.min(100, (confirmedCount / event.maxTeams) * 100)}%` }}
              />
            </div>

            {/* Registration Status for current user */}
            {userRegistration ? (
              <div className="space-y-2 pt-1">
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    userRegistration.registrationStatus === 'CONFIRMED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : userRegistration.registrationStatus === 'PENDING_PAYMENT'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {userRegistration.registrationStatus === 'CONFIRMED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : userRegistration.registrationStatus === 'PENDING_PAYMENT' ? (
                      <Clock3 className="w-4 h-4 text-amber-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <div>
                      <p className="font-bold">
                        {userRegistration.registrationStatus === 'CONFIRMED'
                          ? `Confirmed Slot #${userRegistration.slotNumber}`
                          : userRegistration.registrationStatus === 'PENDING_PAYMENT'
                          ? 'Payment Pending Verification'
                          : 'Payment Rejected'}
                      </p>
                      <p className="text-[10px] opacity-80">{userRegistration.teamNameSnapshot}</p>
                    </div>
                  </div>
                </div>

                {userRegistration.registrationStatus !== 'CONFIRMED' && event.entryFee > 0 && (
                  <button
                    onClick={() => onPayForRegistration(userRegistration.id, event)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase py-2.5 rounded-lg transition tracking-wide"
                  >
                    Submit / Resubmit Payment Proof
                  </button>
                )}
              </div>
            ) : (
              <button
                id="btn-register-team-detail"
                onClick={() => onRegisterTeam(event)}
                disabled={!isRegistrationOpen}
                className={`w-full py-3 rounded-lg font-black text-xs uppercase tracking-wider transition ${
                  isRegistrationOpen
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                    : 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isFull ? 'All Slots Filled' : !isRegistrationOpen ? 'Registration Closed' : 'Register Team Now'}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 px-4 sm:px-8 text-xs font-bold uppercase tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-4 border-b-2 transition shrink-0 ${
              activeTab === 'info'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Match Info & Rules
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-3.5 px-4 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'teams'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Registered Teams</span>
            <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded text-[10px]">
              {registrations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`py-3.5 px-4 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'results'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Results & Standings</span>
            {resultsList.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded text-[10px]">
                {resultsList.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Match Info & Room Details */}
        {activeTab === 'info' && (
          <div className="p-6 sm:p-8 space-y-8">
            {/* Room Credentials Security Section (Requirement #43) */}
            <div
              className={`p-5 rounded-xl border ${
                canSeeRoom && (event.roomId || event.roomPassword)
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-neutral-950 border-neutral-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    canSeeRoom && (event.roomId || event.roomPassword)
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {canSeeRoom && (event.roomId || event.roomPassword) ? (
                    <Unlock className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Custom Room Information
                    </h3>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                      {canSeeRoom ? 'Unlocked for Confirmed Team / Admin' : 'Locked'}
                    </span>
                  </div>

                  {canSeeRoom && (event.roomId || event.roomPassword) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-emerald-500/20 text-xs font-mono">
                      <div className="bg-neutral-900/80 p-3 rounded border border-emerald-500/20">
                        <span className="text-[10px] text-neutral-400 uppercase block">Room ID</span>
                        <span className="text-base font-black text-emerald-300 tracking-wider">
                          {event.roomId || 'TBA'}
                        </span>
                      </div>
                      <div className="bg-neutral-900/80 p-3 rounded border border-emerald-500/20">
                        <span className="text-[10px] text-neutral-400 uppercase block">Password</span>
                        <span className="text-base font-black text-emerald-300 tracking-wider">
                          {event.roomPassword || 'TBA'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 mt-1">
                      Room ID and Password will be posted 15 minutes before match start and are only accessible by
                      teams with <span className="text-amber-400 font-semibold">CONFIRMED</span> slots.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Prize Pool & Format */}
            {event.prizeInfo && (
              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Trophy className="w-4 h-4" />
                  Prize Pool & Distribution
                </h3>
                <p className="text-sm text-neutral-200 font-medium whitespace-pre-line">{event.prizeInfo}</p>
              </div>
            )}

            {/* Rules & Requirements */}
            <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-2">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-amber-400" />
                Tournament & Scrim Rules
              </h3>
              <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-900/50 p-4 rounded-lg border border-neutral-850 font-sans">
                {event.rules ||
                  '1. All players must be registered with valid PUBG Mobile UID.\n2. Emulators, iPads, and triggers are barred.\n3. POV recording mandatory on request.'}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Registered Teams & Lineups */}
        {activeTab === 'teams' && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-3">
              <span>Slot Assignment & Team Roster</span>
              <span>Showing {registrations.length} Teams</span>
            </div>

            {registrations.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                No teams registered yet. Be the first to register!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {registrations.map((reg, idx) => (
                  <div
                    key={reg.id}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center font-black text-amber-400 font-mono text-sm border border-neutral-700">
                          {reg.slotNumber ? `#${reg.slotNumber}` : idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-sm text-white uppercase font-mono">
                            {reg.teamNameSnapshot}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          reg.registrationStatus === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : reg.registrationStatus === 'PENDING_PAYMENT'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}
                      >
                        {reg.registrationStatus.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Lineup Players */}
                    {reg.lineup && reg.lineup.length > 0 && (
                      <div className="bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-850 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Selected Lineup ({reg.lineup.length} Players)
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          {reg.lineup.map((p) => (
                            <div key={p.id} className="truncate text-neutral-300 font-mono">
                              • {p.pubgNameSnapshot}{' '}
                              {p.lineupRole === 'substitute' && (
                                <span className="text-[9px] text-amber-400">(Sub)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Match Results & Standings */}
        {activeTab === 'results' && (
          <div className="p-6 sm:p-8 space-y-4">
            {resultsList.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 text-xs">
                Official standings and match results have not been posted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300 border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[10px]">
                      <th className="py-2.5 px-3">Pos</th>
                      <th className="py-2.5 px-3">Team</th>
                      <th className="py-2.5 px-3 text-center">Placement</th>
                      <th className="py-2.5 px-3 text-center">Kills</th>
                      <th className="py-2.5 px-3 text-center font-bold text-amber-400">Total Pts</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {resultsList.map((res) => (
                      <tr key={res.id} className="hover:bg-neutral-850/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">#{res.position}</td>
                        <td className="py-2.5 px-3 font-semibold text-white uppercase font-mono">
                          {res.teamNameSnapshot}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{res.placementPoints}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{res.kills}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-amber-400 text-sm">
                          {res.totalPoints}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400 text-[11px]">{res.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
