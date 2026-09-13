import React, { useState, useEffect } from 'react';
import { EsportsEvent, Team, TeamMemberWithPlayer } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { X, CheckSquare, Square, Shield, AlertCircle, ArrowRight, Users, Loader2 } from 'lucide-react';

interface RegisterModalProps {
  event: EsportsEvent;
  onClose: () => void;
  onSuccess: (registrationId: number, isFree: boolean) => void;
  onNavigateToTeams: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  event,
  onClose,
  onSuccess,
  onNavigateToTeams,
}) => {
  const { user, captainedTeams, token } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    captainedTeams.length > 0 ? captainedTeams[0].id : null
  );
  const [members, setMembers] = useState<TeamMemberWithPlayer[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState<boolean>(false);

  // When selected team changes, fetch team's active members
  useEffect(() => {
    if (!selectedTeamId || !token) return;

    const fetchLineupOptions = async () => {
      setIsLoadingMembers(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/events/${event.id}/team-lineup-options?teamId=${selectedTeamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setMembers(data.members || []);
          setAlreadyRegistered(data.alreadyRegistered);
          // Default pre-select the first 4 players
          const initialIds = (data.members || []).slice(0, event.playersPerTeam || 4).map((m: any) => m.player.id);
          setSelectedPlayerIds(initialIds);
        } else {
          setErrorMsg(data.error || 'Failed to load team roster');
        }
      } catch (err: any) {
        setErrorMsg('Network error while loading roster');
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchLineupOptions();
  }, [selectedTeamId, event.id, token, event.playersPerTeam]);

  const togglePlayer = (playerId: number) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
    } else {
      const maxAllowed = (event.playersPerTeam || 4) + (event.substitutesAllowed || 1);
      if (selectedPlayerIds.length >= maxAllowed) {
        setErrorMsg(`Maximum lineup size is ${maxAllowed} players (including substitutes)`);
        return;
      }
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
      setErrorMsg(null);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!selectedTeamId) {
      setErrorMsg('Please select a team');
      return;
    }
    const required = event.playersPerTeam || 4;
    if (selectedPlayerIds.length < required) {
      setErrorMsg(`You must select at least ${required} players for the starting lineup.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamId: selectedTeamId,
          selectedPlayerIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(data.registration.id, data.isFree);
      } else {
        setErrorMsg(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setErrorMsg('Server connection failed while registering');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredCount = event.playersPerTeam || 4;
  const maxLimit = requiredCount + (event.substitutesAllowed || 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">
              Event Registration
            </span>
            <h2 className="text-base sm:text-lg font-black text-white uppercase font-mono truncate max-w-sm">
              {event.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Event Entry Fee Summary */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Entry Fee:</span>
            <span className="font-mono font-bold text-sm text-amber-400">
              {event.entryFee === 0 ? 'FREE ENTRY' : `Rs. ${event.entryFee}`}
            </span>
          </div>

          {/* Step 1: Select Team */}
          {captainedTeams.length === 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-center space-y-3">
              <Shield className="w-6 h-6 mx-auto text-amber-400" />
              <div>
                <p className="font-bold text-neutral-200">No Captained Teams Found</p>
                <p className="text-neutral-400 text-[11px] mt-1">
                  You must be the captain of a team to register for this scrim/tournament.
                </p>
              </div>
              <button
                onClick={onNavigateToTeams}
                className="bg-amber-500 text-neutral-950 font-bold text-xs uppercase px-4 py-2 rounded-lg"
              >
                Create Team Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Select Team
                </label>
                <select
                  value={selectedTeamId || ''}
                  onChange={(e) => setSelectedTeamId(parseInt(e.target.value, 10))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
                >
                  {captainedTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Code: {t.teamCode})
                    </option>
                  ))}
                </select>
              </div>

              {alreadyRegistered && (
                <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-lg text-amber-300">
                  ⚠️ This team is already registered for this event. You cannot register twice.
                </div>
              )}

              {/* Step 2: Lineup Selection (CRITICAL REPEAT REGISTRATION FEATURE) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Active Lineup</span>
                  </label>
                  <span className="font-mono text-neutral-400 text-[10px]">
                    Selected: <strong className="text-amber-400">{selectedPlayerIds.length}</strong> / {maxLimit} (Min {requiredCount})
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400">
                  Select the {requiredCount} starter players (+ optional sub) from your permanent team roster:
                </p>

                {isLoadingMembers ? (
                  <div className="py-6 text-center text-neutral-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-1" />
                    <span>Loading team players...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="bg-neutral-950 p-4 rounded-lg text-center text-neutral-400 border border-neutral-800">
                    Your team currently has no players joined. Share your team code/link with your squad members first!
                  </div>
                ) : (
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 divide-y divide-neutral-850 max-h-48 overflow-y-auto">
                    {members.map((m) => {
                      const isSelected = selectedPlayerIds.includes(m.player.id);
                      return (
                        <div
                          key={m.player.id}
                          onClick={() => togglePlayer(m.player.id)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-amber-500/10 text-amber-200' : 'hover:bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-400" />
                            )}
                            <div>
                              <p className="font-bold font-mono text-xs">{m.player.pubgName}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">UID: {m.player.pubgUid}</p>
                            </div>
                          </div>

                          <span className="text-[10px] uppercase font-semibold text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded">
                            {m.role}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-neutral-400 hover:text-white px-4 py-2"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-registration"
            onClick={handleRegisterSubmit}
            disabled={
              isSubmitting ||
              alreadyRegistered ||
              captainedTeams.length === 0 ||
              selectedPlayerIds.length < requiredCount
            }
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
              !isSubmitting && !alreadyRegistered && selectedPlayerIds.length >= requiredCount
                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <span>Confirm & Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
