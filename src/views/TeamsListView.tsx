import React, { useState, useEffect } from 'react';
import { Team } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Users, Plus, Search, Shield, Copy, Check, ExternalLink, X, Loader2 } from 'lucide-react';

interface TeamsListViewProps {
  onSelectTeam: (teamId: number) => void;
}

export const TeamsListView: React.FC<TeamsListViewProps> = ({ onSelectTeam }) => {
  const { user, token, refreshUser, openAuthModal } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setErrorMsg('Team name is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: teamName.trim(),
          logoUrl: logoUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setTeamName('');
        setLogoUrl('');
        await fetchTeams();
        await refreshUser();
        onSelectTeam(data.id);
      } else {
        setErrorMsg(data.error || 'Failed to create team');
      }
    } catch (err: any) {
      setErrorMsg('Network error while creating team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.teamCode.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Permanent Teams Directory</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Browse all registered PUBG MOBILE squads, review verified lineups, or establish your new team roster.
          </p>
        </div>

        <button
          id="btn-create-new-team"
          onClick={() => {
            if (!user) {
              openAuthModal('signin');
              return;
            }
            setShowCreateModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition shadow-md shadow-amber-500/20 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by team name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-neutral-400 text-xs font-mono">Loading teams directory...</div>
      ) : filteredTeams.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 sm:p-12 text-center space-y-3">
          <Shield className="w-10 h-10 mx-auto text-neutral-500" />
          <h3 className="text-base font-bold text-white font-mono uppercase">No teams registered yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery ? 'No teams match your search query.' : 'Be the first captain to establish and register a permanent PUBG MOBILE squad!'}
          </p>
          {!user ? (
            <button
              onClick={() => openAuthModal('signin')}
              className="mt-2 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase px-4 py-2 rounded-lg"
            >
              Sign In to Create Team
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Create Team Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => onSelectTeam(team.id)}
              className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-xl p-5 space-y-4 cursor-pointer transition shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center font-black text-amber-400 text-lg border border-neutral-700 shadow-inner group-hover:border-amber-500/50 transition">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      team.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white uppercase font-mono group-hover:text-amber-400 transition">
                      {team.name}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      Captain: {team.captainName || 'Verified Captain'}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                    team.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  {team.status}
                </span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase block font-sans">Team Code</span>
                  <span className="text-amber-400 font-bold tracking-wider">{team.teamCode}</span>
                </div>
                <button
                  onClick={(e) => copyCode(team.teamCode, e)}
                  className="p-1 text-neutral-400 hover:text-white transition"
                  title="Copy Team Code"
                >
                  {copiedCode === team.teamCode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-850">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  {team.memberCount ?? 0} / {team.maxPlayers} Players
                </span>
                <span className="text-amber-400 font-semibold group-hover:underline flex items-center gap-1">
                  <span>View Roster</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase font-mono flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Create Permanent Team
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <p className="text-neutral-400">
                You will be set as the Team Captain. You will receive a unique 6-character Team Code and invite link
                to share with your squad players.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NOVA ESPORTS"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder-neutral-400 text-xs font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Team Logo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-white px-3 py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase tracking-wider px-5 py-2.5 rounded-lg transition"
                >
                  {isSubmitting ? 'Creating Team...' : 'Create & Get Invite Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
