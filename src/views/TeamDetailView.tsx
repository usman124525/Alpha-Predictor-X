import React, { useState, useEffect } from 'react';
import { Team, TeamMemberWithPlayer, EsportsEvent, EventRegistration } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Users,
  Shield,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Share2,
  ChevronLeft,
  Edit2,
  History,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TeamDetailViewProps {
  teamId: number;
  onBack: () => void;
  onViewEvent: (event: EsportsEvent) => void;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({ teamId, onBack, onViewEvent }) => {
  const { user, player, isAdmin, token, refreshUser } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMemberWithPlayer[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'history'>('roster');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual Add Player dialog
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addPubgName, setAddPubgName] = useState('');
  const [addPubgUid, setAddPubgUid] = useState('');
  const [addRole, setAddRole] = useState<'member' | 'substitute'>('member');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTeamDetails = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error('Failed to load team:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
    fetchHistory();
  }, [teamId]);

  const isCaptain = team?.captainUserId === user?.id;
  const canManage = isCaptain || isAdmin;

  const copyInviteLink = () => {
    if (!team) return;
    const url = `${window.location.origin}/#join=${team.inviteToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.teamCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this player from the team?')) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchTeamDetails();
        await refreshUser();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to remove member');
      }
    } catch (e) {
      alert('Network error removing member');
    }
  };

  const handleJoinSelf = async () => {
    if (!team || !token) return;
    setIsAdding(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamCode: team.teamCode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await fetchTeamDetails();
        await refreshUser();
      } else {
        setErrorMsg(data.error || 'Failed to join team');
      }
    } catch (e) {
      setErrorMsg('Failed to join team');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-3">
        <p className="text-red-400 font-bold">Team not found.</p>
        <button onClick={onBack} className="bg-neutral-800 text-neutral-200 px-4 py-2 rounded text-xs">
          Return to Teams Directory
        </button>
      </div>
    );
  }

  const isUserAlreadyInTeam = members.some((m) => m.player.userId === user?.id);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Teams</span>
      </button>

      {/* Team Header Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-amber-400 text-3xl font-mono shadow-xl overflow-hidden shrink-0">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                team.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    team.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  {team.status}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">ID #{team.id}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase tracking-tight">
                {team.name}
              </h1>

              <p className="text-xs text-neutral-400 font-mono">
                Captain: <strong className="text-white">{team.captainName || 'Team Captain'}</strong>
              </p>
            </div>
          </div>

          {/* Quick Actions / Join */}
          <div className="flex flex-wrap items-center gap-2">
            {!isUserAlreadyInTeam && user && (
              <button
                onClick={handleJoinSelf}
                disabled={isAdding}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <UserPlus className="w-4 h-4" />
                Join This Team
              </button>
            )}

            <button
              onClick={copyInviteLink}
              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-bold text-xs uppercase px-3.5 py-2.5 rounded-lg transition flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Team Code & Invite Banner */}
        <div className="bg-neutral-950 px-6 sm:px-8 py-3.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-neutral-400 uppercase text-[11px] font-sans font-semibold">
              Permanent Team Code:
            </span>
            <span className="text-amber-400 font-black text-sm tracking-widest bg-neutral-900 border border-neutral-800 px-3 py-1 rounded">
              {team.teamCode}
            </span>
            <button
              onClick={copyCode}
              className="text-neutral-400 hover:text-white transition"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-neutral-400 text-[11px] font-sans">
            Roster Capacity: <strong className="text-white">{members.length}</strong> / {team.maxPlayers} players
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 px-4 sm:px-8 text-xs font-bold uppercase tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3.5 px-4 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'roster'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Permanent Roster</span>
            <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded text-[10px]">
              {members.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-4 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Event History & Lineups</span>
            {history.length > 0 && (
              <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded text-[10px]">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Roster */}
        {activeTab === 'roster' && (
          <div className="p-4 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300 border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Player</th>
                    <th className="py-2.5 px-3">PUBG In-Game Name</th>
                    <th className="py-2.5 px-3">PUBG UID</th>
                    <th className="py-2.5 px-3">Squad Role</th>
                    <th className="py-2.5 px-3">Joined Date</th>
                    {canManage && <th className="py-2.5 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {members.map((m) => (
                    <tr key={m.membershipId} className="hover:bg-neutral-850/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-amber-400 text-xs uppercase font-mono">
                            {m.player.pubgName.slice(0, 1)}
                          </div>
                          <span className="font-semibold text-white">{m.player.pubgName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">{m.player.pubgName}</td>
                      <td className="py-3 px-3 font-mono text-neutral-300">{m.player.pubgUid}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            m.role === 'captain'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-400 text-[11px]">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="py-3 px-3 text-right">
                          {m.role !== 'captain' && (
                            <button
                              onClick={() => handleRemoveMember(m.membershipId)}
                              className="text-neutral-500 hover:text-red-400 p-1 rounded transition"
                              title="Remove Player from Team"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* How to add teammates note */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-1">
              <p className="font-bold text-neutral-200">💡 How to invite squad members:</p>
              <p>
                1. Share your 6-character team code <strong className="text-amber-400 font-mono">{team.teamCode}</strong> or click the <strong>Copy Invite Link</strong> button.
              </p>
              <p>
                2. When players visit the link or enter the code, they will instantly join your permanent team roster.
              </p>
              <p>
                3. When you register for Scrim #1 or Scrim #2, your saved players appear immediately in the lineup selection!
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Event Participation History & Lineups */}
        {activeTab === 'history' && (
          <div className="p-6 sm:p-8 space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 text-xs">
                No past event participation recorded for this team yet.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((reg) => (
                  <div
                    key={reg.id}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <h4 className="font-black text-white font-mono uppercase text-sm">
                          {reg.eventName}
                        </h4>
                        <span className="text-[10px] text-neutral-400">({reg.eventType})</span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          reg.registrationStatus === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {reg.registrationStatus}
                      </span>
                    </div>

                    {/* Snapshot of Lineup used for this event */}
                    {reg.lineup && reg.lineup.length > 0 && (
                      <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Active Lineup for this match ({reg.lineup.length} Players):
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {reg.lineup.map((p: any) => (
                            <div key={p.id} className="text-neutral-300 font-mono text-[11px] truncate">
                              • {p.pubgNameSnapshot}
                              {p.lineupRole === 'substitute' && (
                                <span className="text-[9px] text-amber-400 ml-1">(Sub)</span>
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
      </div>
    </div>
  );
};
