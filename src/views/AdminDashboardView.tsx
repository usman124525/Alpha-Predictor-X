import React, { useState, useEffect } from 'react';
import {
  EsportsEvent,
  PaymentRecord,
  PaymentMethod,
  AuditLog,
  OrganizationSettings,
  Team,
} from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Crown,
  CreditCard,
  Swords,
  Trophy,
  Users,
  Settings,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Copy,
  Eye,
  Trash2,
  Save,
  Key,
  Shield,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardViewProps {
  events: EsportsEvent[];
  settings: OrganizationSettings | null;
  onRefreshEvents: () => Promise<void>;
  onRefreshSettings: () => Promise<void>;
  onSelectTeam: (teamId: number) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  events,
  settings,
  onRefreshEvents,
  onRefreshSettings,
  onSelectTeam,
}) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'payments' | 'events' | 'methods' | 'results' | 'settings' | 'audit'
  >('payments');

  // Payments State
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Events State
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EsportsEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    type: 'scrim' as 'scrim' | 'tournament',
    name: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00 PM PKT',
    entryFee: 500,
    maxTeams: 25,
    playersPerTeam: 4,
    substitutesAllowed: 1,
    map: 'Erangel',
    mode: 'TPP Squad',
    prizeInfo: 'Winner: Rs. 5,000 | Runner-up: Rs. 2,500',
    rules: '1. Standard competitive rules.\n2. Emulators and iPads strictly banned.\n3. Screen recording on request.',
    status: 'Registration Open' as any,
  });
  const [roomModalEvent, setRoomModalEvent] = useState<EsportsEvent | null>(null);
  const [roomForm, setRoomForm] = useState({ roomId: '', roomPassword: '' });

  // Payment Methods State
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodForm, setMethodForm] = useState({
    name: 'Easypaisa',
    accountName: '',
    accountNumber: '',
    bankName: '',
    iban: '',
    instructions: 'Send money and upload screenshot proof.',
    isActive: true,
  });

  // Results State
  const [resultEventId, setResultEventId] = useState<number>(events[0]?.id || 0);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [resultTeamId, setResultTeamId] = useState<number>(0);
  const [resultForm, setResultForm] = useState({
    position: 1,
    placementPoints: 10,
    kills: 5,
    notes: '',
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    orgName: settings?.orgName || 'NOVA ESPORTS',
    tagline: settings?.tagline || '',
    description: settings?.description || '',
    contactEmail: settings?.contactEmail || '',
    contactPhone: settings?.contactPhone || '',
    whatsappUrl: settings?.whatsappUrl || '',
    discordUrl: settings?.discordUrl || '',
    generalRules: settings?.generalRules || '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (e) {
      console.error('Failed to load payments:', e);
    }
  };

  // Fetch payment methods
  const fetchMethods = async () => {
    try {
      const res = await fetch('/api/admin/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMethods(data);
      }
    } catch (e) {
      console.error('Failed to load payment methods:', e);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPayments();
      fetchMethods();
      fetchAuditLogs();
    }
  }, [token]);

  // Handle Event Registrations when resultEventId changes
  useEffect(() => {
    if (!resultEventId) return;
    const fetchRegs = async () => {
      try {
        const res = await fetch(`/api/events/${resultEventId}`);
        if (res.ok) {
          const data = await res.json();
          setEventRegistrations(data.registrations || []);
          if (data.registrations?.length > 0) {
            setResultTeamId(data.registrations[0].teamId);
          }
        }
      } catch (e) {}
    };
    fetchRegs();
  }, [resultEventId]);

  // Payment Approval Handler (Requirement #20 & #21)
  const handleApprovePayment = async (paymentId: number) => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setSelectedPayment(null);
        await fetchPayments();
        await onRefreshEvents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to approve payment');
      }
    } catch (e) {
      alert('Network error approving payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Payment Rejection Handler
  const handleRejectPayment = async (paymentId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason');
      return;
    }
    setIsProcessingPayment(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      if (res.ok) {
        setSelectedPayment(null);
        setRejectionReason('');
        await fetchPayments();
        await onRefreshEvents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reject payment');
      }
    } catch (e) {
      alert('Network error rejecting payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventForm),
      });

      if (res.ok) {
        setShowCreateEvent(false);
        setEditingEvent(null);
        await onRefreshEvents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save event');
      }
    } catch (e) {
      alert('Network error saving event');
    }
  };

  // Duplicate Event
  const handleDuplicateEvent = async (event: EsportsEvent) => {
    try {
      const res = await fetch(`/api/events/${event.id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await onRefreshEvents();
        alert('Event duplicated successfully!');
      }
    } catch (e) {
      alert('Failed to duplicate event');
    }
  };

  // Save Room Credentials (Requirement #43)
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomModalEvent) return;
    try {
      const res = await fetch(`/api/admin/events/${roomModalEvent.id}/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roomForm),
      });
      if (res.ok) {
        setRoomModalEvent(null);
        await onRefreshEvents();
      }
    } catch (e) {
      alert('Failed to update room credentials');
    }
  };

  // Save Payment Method
  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(methodForm),
      });
      if (res.ok) {
        setShowAddMethod(false);
        await fetchMethods();
      }
    } catch (e) {
      alert('Failed to save payment method');
    }
  };

  // Submit Match Result
  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultEventId || !resultTeamId) return;
    try {
      const res = await fetch(`/api/events/${resultEventId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamId: resultTeamId,
          position: resultForm.position,
          placementPoints: resultForm.placementPoints,
          kills: resultForm.kills,
          notes: resultForm.notes,
        }),
      });
      if (res.ok) {
        alert('Result recorded successfully!');
        setResultForm({ position: 2, placementPoints: 6, kills: 2, notes: '' });
      }
    } catch (e) {
      alert('Failed to record result');
    }
  };

  // Save Org Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        setSettingsSuccess(true);
        await onRefreshSettings();
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (e) {
      alert('Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'PENDING');
  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === 'ALL') return true;
    return p.status === paymentFilter;
  });

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="border-b border-neutral-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase tracking-wide flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <span>Tournament Organizer Command Center</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manual payment verification, scrim schedules, room passwords, and competitive results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
            <span>Admin:</span>
            <strong>{user?.name}</strong>
          </span>
        </div>
      </div>

      {/* Admin Subnav */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-xs font-bold uppercase tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'payments'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'bg-neutral-900 text-neutral-300 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Approvals</span>
          {pendingPayments.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {pendingPayments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'events'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'bg-neutral-900 text-neutral-300 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Manage Scrims & Tournaments</span>
        </button>

        <button
          onClick={() => setActiveTab('methods')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'methods'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'bg-neutral-900 text-neutral-300 hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Payment Methods Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'results'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'bg-neutral-900 text-neutral-300 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Post Results</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'bg-neutral-900 text-neutral-300 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Org Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'bg-neutral-900 text-neutral-300 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Tab 1: Payment Approvals (Core Feature #16-#22) */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Filter:</span>
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setPaymentFilter(st)}
                  className={`text-xs px-2.5 py-1 rounded font-semibold transition uppercase ${
                    paymentFilter === st
                      ? 'bg-neutral-800 text-amber-400 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs text-neutral-400">
              Showing {filteredPayments.length} Payment Receipts
            </span>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-neutral-400" />
              <p className="font-bold text-neutral-300">No {paymentFilter.toLowerCase()} payments to display.</p>
              <p>When captains submit transaction screenshots, they will appear here for manual verification.</p>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300 border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[10px] bg-neutral-950">
                      <th className="py-3 px-3">Team Name</th>
                      <th className="py-3 px-3">Event</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Method</th>
                      <th className="py-3 px-3">Transaction ID (TRX)</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Submitted</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-850/50">
                        <td className="py-3 px-3 font-bold text-white font-mono uppercase">
                          {p.teamNameSnapshot}
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-200">{p.eventNameSnapshot}</td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">Rs. {p.amount}</td>
                        <td className="py-3 px-3 text-neutral-300 font-medium">
                          {p.paymentMethodSnapshot.split('\n')[0]}
                        </td>
                        <td className="py-3 px-3 font-mono text-amber-300 font-bold">
                          {p.transactionId || 'None'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                              p.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : p.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-neutral-400 text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            id={`review-payment-${p.id}`}
                            onClick={() => {
                              setSelectedPayment(p);
                              setRejectionReason('');
                            }}
                            className="bg-neutral-800 hover:bg-neutral-750 text-amber-400 border border-neutral-700 px-3 py-1 rounded text-xs font-bold uppercase transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Review Modal with Full Screenshot & 1-Click Approve/Reject */}
          {selectedPayment && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-8 space-y-0">
                <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">
                      Manual Payment Verification
                    </span>
                    <h2 className="text-base font-black text-white uppercase font-mono">
                      Receipt Review: {selectedPayment.teamNameSnapshot}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-5 text-xs">
                  {/* Transaction Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 font-mono">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block font-sans">Event</span>
                      <span className="font-bold text-white truncate block">{selectedPayment.eventNameSnapshot}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block font-sans">Amount</span>
                      <span className="font-bold text-amber-400">Rs. {selectedPayment.amount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block font-sans">TRX ID</span>
                      <span className="font-bold text-amber-300 truncate block">
                        {selectedPayment.transactionId || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block font-sans">Current Status</span>
                      <span className="font-bold text-white uppercase">{selectedPayment.status}</span>
                    </div>
                  </div>

                  {/* Payment Method Snapshot used */}
                  <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 text-neutral-300">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                      Account Snapshot Paid To:
                    </span>
                    <p className="font-mono text-xs">{selectedPayment.paymentMethodSnapshot}</p>
                  </div>

                  {/* Transaction Screenshot Display */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                      Uploaded Screenshot Proof:
                    </span>
                    <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-2 flex items-center justify-center max-h-80 overflow-hidden">
                      <img
                        src={selectedPayment.screenshotUrl}
                        alt="Payment Receipt Proof"
                        className="max-h-72 max-w-full object-contain rounded-lg shadow"
                      />
                    </div>
                  </div>

                  {/* Rejection Reason Input */}
                  {selectedPayment.status === 'PENDING' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                        Rejection Reason (Required if Rejecting)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Invalid Transaction ID / Amount mismatch / Fake screenshot"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="text-xs font-semibold text-neutral-400 hover:text-white px-3 py-2"
                  >
                    Close
                  </button>

                  {selectedPayment.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectPayment(selectedPayment.id)}
                        disabled={isProcessingPayment}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition"
                      >
                        Reject Payment
                      </button>

                      <button
                        id="btn-confirm-approve-payment"
                        onClick={() => handleApprovePayment(selectedPayment.id)}
                        disabled={isProcessingPayment}
                        className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Confirm Slot</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manage Events & Scrims */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase font-mono">
              Events Directory ({events.length})
            </h2>

            <button
              onClick={() => {
                setEditingEvent(null);
                setEventForm({
                  type: 'scrim',
                  name: '',
                  date: new Date().toISOString().split('T')[0],
                  startTime: '08:00 PM PKT',
                  entryFee: 500,
                  maxTeams: 25,
                  playersPerTeam: 4,
                  substitutesAllowed: 1,
                  map: 'Erangel',
                  mode: 'TPP Squad',
                  prizeInfo: 'Winner: Rs. 5,000 | Runner-up: Rs. 2,500',
                  rules: '1. Standard competitive rules.\n2. Screen recording on request.',
                  status: 'Registration Open',
                });
                setShowCreateEvent(true);
              }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase px-4 py-2.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Create Scrim / Tournament
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                      {ev.type}
                    </span>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">{ev.mode}</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">Map: {ev.map}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                      {ev.status}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-white uppercase font-mono">{ev.name}</h3>

                  <p className="text-xs text-neutral-400 font-mono">
                    Date: {ev.date} at {ev.startTime} • Fee: Rs. {ev.entryFee} • Confirmed: {ev.confirmedCount || 0} / {ev.maxTeams} Teams
                  </p>
                </div>

                {/* Actions: Room ID / Duplicate / Edit */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setRoomModalEvent(ev);
                      setRoomForm({
                        roomId: ev.roomId || '',
                        roomPassword: ev.roomPassword || '',
                      });
                    }}
                    className="bg-neutral-800 hover:bg-neutral-750 text-amber-300 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Room Key
                  </button>

                  <button
                    onClick={() => handleDuplicateEvent(ev)}
                    className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition flex items-center gap-1.5"
                    title="1-Click Duplicate Event"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>

                  <button
                    onClick={() => {
                      setEditingEvent(ev);
                      setEventForm({
                        type: ev.type,
                        name: ev.name,
                        date: ev.date,
                        startTime: ev.startTime,
                        entryFee: ev.entryFee,
                        maxTeams: ev.maxTeams,
                        playersPerTeam: ev.playersPerTeam,
                        substitutesAllowed: ev.substitutesAllowed,
                        map: ev.map,
                        mode: ev.mode,
                        prizeInfo: ev.prizeInfo || '',
                        rules: ev.rules || '',
                        status: ev.status,
                      });
                      setShowCreateEvent(true);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create/Edit Event Modal */}
          {showCreateEvent && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl my-8">
                <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
                  <h2 className="text-base font-black text-white uppercase font-mono">
                    {editingEvent ? 'Edit Event' : 'Create Scrim or Tournament'}
                  </h2>
                  <button
                    onClick={() => setShowCreateEvent(false)}
                    className="text-neutral-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveEvent} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-300 uppercase mb-1">Event Type</label>
                      <select
                        value={eventForm.type}
                        onChange={(e: any) => setEventForm({ ...eventForm, type: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
                      >
                        <option value="scrim">Daily Scrim</option>
                        <option value="tournament">Tournament</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-300 uppercase mb-1">Status</label>
                      <select
                        value={eventForm.status}
                        onChange={(e: any) => setEventForm({ ...eventForm, status: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Registration Open">Registration Open</option>
                        <option value="Full">Full</option>
                        <option value="Registration Closed">Registration Closed</option>
                        <option value="Live">Live</option>
                        <option value="Completed">Completed</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Event Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NOVA TIER-1 SCRIM #28"
                      value={eventForm.name}
                      onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-300 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-300 uppercase mb-1">Start Time</label>
                      <input
                        type="text"
                        required
                        placeholder="08:00 PM PKT"
                        value={eventForm.startTime}
                        onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-300 uppercase mb-1">Entry Fee (Rs)</label>
                      <input
                        type="number"
                        min="0"
                        value={eventForm.entryFee}
                        onChange={(e) => setEventForm({ ...eventForm, entryFee: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-300 uppercase mb-1">Max Teams (Slots)</label>
                      <input
                        type="number"
                        min="2"
                        max="100"
                        value={eventForm.maxTeams}
                        onChange={(e) => setEventForm({ ...eventForm, maxTeams: parseInt(e.target.value, 10) || 25 })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-300 uppercase mb-1">Map</label>
                      <input
                        type="text"
                        value={eventForm.map}
                        onChange={(e) => setEventForm({ ...eventForm, map: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-300 uppercase mb-1">Mode</label>
                      <input
                        type="text"
                        value={eventForm.mode}
                        onChange={(e) => setEventForm({ ...eventForm, mode: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Prize Info</label>
                    <input
                      type="text"
                      value={eventForm.prizeInfo}
                      onChange={(e) => setEventForm({ ...eventForm, prizeInfo: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Rules & Notes</label>
                    <textarea
                      rows={3}
                      value={eventForm.rules}
                      onChange={(e) => setEventForm({ ...eventForm, rules: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateEvent(false)}
                      className="text-neutral-400 hover:text-white px-3 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase tracking-wider px-5 py-2.5 rounded-lg"
                    >
                      Save Event
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Room ID & Password Modal */}
          {roomModalEvent && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
                  <h2 className="text-base font-black text-white uppercase font-mono flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    Set Custom Room Credentials
                  </h2>
                  <button
                    onClick={() => setRoomModalEvent(null)}
                    className="text-neutral-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveRoom} className="p-6 space-y-4 text-xs">
                  <p className="text-neutral-400">
                    Entering Room ID and Password will instantly reveal it to teams with{' '}
                    <strong className="text-emerald-400">CONFIRMED</strong> slots on the event page.
                  </p>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Room ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 8392019"
                      value={roomForm.roomId}
                      onChange={(e) => setRoomForm({ ...roomForm, roomId: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono text-base tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Room Password</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234"
                      value={roomForm.roomPassword}
                      onChange={(e) => setRoomForm({ ...roomForm, roomPassword: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono text-base tracking-wider"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setRoomModalEvent(null)}
                      className="text-neutral-400 hover:text-white px-3 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase tracking-wider px-5 py-2.5 rounded-lg"
                    >
                      Publish Room Key
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Payment Methods Settings (Requirement #17 & #25) */}
      {activeTab === 'methods' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white uppercase font-mono">
                Active Organization Payment Methods
              </h2>
              <p className="text-xs text-neutral-400">
                Easypaisa, JazzCash, and Bank Transfer accounts shown to captains during registration.
              </p>
            </div>

            <button
              onClick={() => setShowAddMethod(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase px-4 py-2.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map((m) => (
              <div
                key={m.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-white uppercase font-mono flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    {m.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      m.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {m.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-1 text-xs font-mono">
                  <p>
                    <span className="text-neutral-400">Account Title:</span>{' '}
                    <strong className="text-white">{m.accountName}</strong>
                  </p>
                  <p>
                    <span className="text-neutral-400">Account Number:</span>{' '}
                    <strong className="text-amber-400">{m.accountNumber}</strong>
                  </p>
                  {m.bankName && (
                    <p>
                      <span className="text-neutral-400">Bank Name:</span> {m.bankName}
                    </p>
                  )}
                  {m.iban && (
                    <p>
                      <span className="text-neutral-400">IBAN:</span> {m.iban}
                    </p>
                  )}
                </div>

                {m.instructions && (
                  <p className="text-[11px] text-neutral-400 italic">Instructions: {m.instructions}</p>
                )}
              </div>
            ))}
          </div>

          {/* Add Method Modal */}
          {showAddMethod && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
                  <h2 className="text-base font-black text-white uppercase font-mono">
                    Add Payment Method
                  </h2>
                  <button onClick={() => setShowAddMethod(false)} className="text-neutral-400">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveMethod} className="p-6 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Service Type</label>
                    <select
                      value={methodForm.name}
                      onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
                    >
                      <option value="Easypaisa">Easypaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Raast">Raast (State Bank)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Account Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Usman Tariq"
                      value={methodForm.accountName}
                      onChange={(e) => setMethodForm({ ...methodForm, accountName: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Account Number / Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 03001234567"
                      value={methodForm.accountNumber}
                      onChange={(e) => setMethodForm({ ...methodForm, accountNumber: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Bank Name (If Bank)</label>
                    <input
                      type="text"
                      placeholder="e.g. Meezan Bank / HBL"
                      value={methodForm.bankName}
                      onChange={(e) => setMethodForm({ ...methodForm, bankName: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">IBAN (Optional)</label>
                    <input
                      type="text"
                      placeholder="PK00MEZN00000000000000"
                      value={methodForm.iban}
                      onChange={(e) => setMethodForm({ ...methodForm, iban: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-300 uppercase mb-1">Instructions for Captains</label>
                    <textarea
                      rows={2}
                      value={methodForm.instructions}
                      onChange={(e) => setMethodForm({ ...methodForm, instructions: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddMethod(false)}
                      className="text-neutral-400 hover:text-white px-3 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase tracking-wider px-5 py-2.5 rounded-lg"
                    >
                      Save Method
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Post Results (Requirement #44) */}
      {activeTab === 'results' && (
        <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-base font-bold text-white uppercase font-mono flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Post Match Results & Leaderboard Points
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Record final standings, kills, and placement points for any completed scrim or tournament.
            </p>
          </div>

          <form onSubmit={handleSubmitResult} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-300 uppercase mb-1">Select Event</label>
              <select
                value={resultEventId}
                onChange={(e) => setResultEventId(parseInt(e.target.value, 10))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-300 uppercase mb-1">Select Registered Team</label>
              <select
                value={resultTeamId}
                onChange={(e) => setResultTeamId(parseInt(e.target.value, 10))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
              >
                {eventRegistrations.map((r) => (
                  <option key={r.teamId} value={r.teamId}>
                    {r.teamNameSnapshot} (Status: {r.registrationStatus})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Position (#)</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={resultForm.position}
                  onChange={(e) => setResultForm({ ...resultForm, position: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Placement Points</label>
                <input
                  type="number"
                  min="0"
                  value={resultForm.placementPoints}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, placementPoints: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono text-center"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Kills (1 pt each)</label>
                <input
                  type="number"
                  min="0"
                  value={resultForm.kills}
                  onChange={(e) => setResultForm({ ...resultForm, kills: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono text-center"
                />
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-400 uppercase font-sans font-semibold">Total Match Points:</span>
              <span className="text-lg font-black text-amber-400">
                {resultForm.placementPoints + resultForm.kills} pts
              </span>
            </div>

            <div>
              <label className="block font-bold text-neutral-300 uppercase mb-1">Notes / MVP Mention</label>
              <input
                type="text"
                placeholder="e.g. Chicken Dinner • MVP: Bilal (4 kills)"
                value={resultForm.notes}
                onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase py-3 rounded-lg transition tracking-wider"
            >
              Submit Result to Standings
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Org Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-base font-bold text-white uppercase font-mono flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Organization Branding & Socials
            </h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {settingsSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings updated successfully!</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-neutral-300 uppercase mb-1">Organization Name</label>
              <input
                type="text"
                required
                value={settingsForm.orgName}
                onChange={(e) => setSettingsForm({ ...settingsForm, orgName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-300 uppercase mb-1">Tagline</label>
              <input
                type="text"
                value={settingsForm.tagline}
                onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settingsForm.contactEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settingsForm.contactPhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">WhatsApp Group / Community URL</label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={settingsForm.whatsappUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappUrl: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 uppercase mb-1">Discord Server URL</label>
                <input
                  type="url"
                  placeholder="https://discord.gg/..."
                  value={settingsForm.discordUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, discordUrl: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-neutral-300 uppercase mb-1">General Portal Rules & Policies</label>
              <textarea
                rows={3}
                value={settingsForm.generalRules}
                onChange={(e) => setSettingsForm({ ...settingsForm, generalRules: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase px-6 py-2.5 rounded-lg transition"
            >
              {isSavingSettings ? 'Saving...' : 'Save Organization Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 6: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center text-xs">
            <span className="font-bold uppercase font-mono text-white">Administrative Actions Audit Trail</span>
            <span className="text-neutral-400">{auditLogs.length} Total Logged Actions</span>
          </div>

          <div className="divide-y divide-neutral-850 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-neutral-850/50 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 font-mono uppercase">{log.action}</span>
                    <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.2 rounded font-mono">
                      By: {log.adminName}
                    </span>
                  </div>
                  <p className="text-neutral-300 mt-1 font-mono text-[11px]">{log.details}</p>
                </div>
                <span className="text-neutral-500 text-[10px] font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
