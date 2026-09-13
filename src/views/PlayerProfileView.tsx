import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Shield, Check, AlertCircle, Users, LogIn } from 'lucide-react';

interface PlayerProfileViewProps {
  onSelectTeam: (teamId: number) => void;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({ onSelectTeam }) => {
  const { user, player, teams, token, refreshUser, openAuthModal } = useAuth();
  const [pubgName, setPubgName] = useState(player?.pubgName || '');
  const [pubgUid, setPubgUid] = useState(player?.pubgUid || '');
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (player) {
      setPubgName(player.pubgName || '');
      setPubgUid(player.pubgUid || '');
    }
  }, [player]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <User className="w-7 h-7 text-amber-400" />
        </div>
        <h2 className="text-xl font-black text-white font-mono uppercase">Authentication Required</h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Please sign in with your email or Google account to configure your official PUBG MOBILE in-game identity and register for scrims.
        </p>
        <button
          onClick={() => openAuthModal('signin')}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In / Create Account</span>
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubgName.trim() || !pubgUid.trim()) {
      setErrorMsg('Both PUBG In-Game Name and PUBG UID are required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/player-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pubgName: pubgName.trim(),
          pubgUid: pubgUid.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        await refreshUser();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setErrorMsg('Network error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinTeamCode.trim()) return;

    setIsJoining(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamCode: joinTeamCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setJoinTeamCode('');
        await refreshUser();
        onSelectTeam(data.teamId);
      } else {
        setErrorMsg(data.error || 'Failed to join team');
      }
    } catch (err: any) {
      setErrorMsg('Network error while joining team');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
          <User className="w-6 h-6 text-amber-400 shrink-0" />
          <span>Player Profile & In-Game Credentials</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Configure your official PUBG MOBILE in-game identity for verification in competitive tournament lobbies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: PUBG Mobile Identity Form */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
              In-Game Identity
            </h2>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono uppercase">
              {user.role}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>PUBG Mobile profile updated successfully!</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Account Email
              </label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full bg-neutral-950/50 border border-neutral-850 rounded-lg p-2.5 text-neutral-400 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                PUBG In-Game Name (IGN) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ALPHA・BILAL"
                value={pubgName}
                onChange={(e) => setPubgName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder-neutral-400 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Enter your exact in-game name including clan tags, special symbols, and spacing.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                PUBG UID (Character ID) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5129384712"
                value={pubgUid}
                onChange={(e) => setPubgUid(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder-neutral-400 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                9 to 11 digit unique player number shown in your PUBG Mobile basic profile.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase tracking-wider px-6 py-2.5 rounded-lg transition text-xs shadow-md shadow-amber-500/20"
              >
                {isSaving ? 'Saving Profile...' : 'Save In-Game Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Team Memberships & Quick Code Join */}
        <div className="space-y-6">
          {/* Quick Join Team by Code */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              Join a Team via Code
            </h3>
            <p className="text-[11px] text-neutral-400">
              Got an invite code from your clan captain? Enter it here to join:
            </p>

            <form onSubmit={handleJoinByCode} className="space-y-2 text-xs">
              <input
                type="text"
                maxLength={8}
                placeholder="6-character code"
                value={joinTeamCode}
                onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder-neutral-400 text-xs font-mono uppercase tracking-widest text-center font-bold focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isJoining || !joinTeamCode.trim()}
                className="w-full bg-neutral-800 hover:bg-neutral-750 text-neutral-100 border border-neutral-700 font-bold py-2 rounded-lg transition uppercase tracking-wider text-xs"
              >
                {isJoining ? 'Joining Squad...' : 'Join Squad'}
              </button>
            </form>
          </div>

          {/* Current Teams */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              My Teams ({teams.length})
            </h3>

            {teams.length === 0 ? (
              <p className="text-xs text-neutral-400 leading-relaxed">
                You are not a member of any teams yet. Create a team or join using an invite code from your captain.
              </p>
            ) : (
              <div className="space-y-2">
                {teams.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTeam(t.id)}
                    className="p-3 bg-neutral-950 hover:bg-neutral-850 rounded-xl border border-neutral-800 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <h4 className="font-bold text-white font-mono uppercase text-xs">{t.name}</h4>
                      <span className="text-[10px] text-amber-400 font-mono">Code: {t.teamCode}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">View Roster →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
