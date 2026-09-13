import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomeView } from './views/HomeView.tsx';
import { EventsView } from './views/EventsView.tsx';
import { EventDetailView } from './views/EventDetailView.tsx';
import { PaymentCheckoutView } from './views/PaymentCheckoutView.tsx';
import { TeamsListView } from './views/TeamsListView.tsx';
import { TeamDetailView } from './views/TeamDetailView.tsx';
import { PlayerProfileView } from './views/PlayerProfileView.tsx';
import { AdminDashboardView } from './views/AdminDashboardView.tsx';
import { RegisterModal } from './components/RegisterModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { EsportsEvent, OrganizationSettings } from './types.ts';

const MainApp: React.FC = () => {
  const { user, isAdmin, token, refreshUser, openAuthModal } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [events, setEvents] = useState<EsportsEvent[]>([]);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Registration & Payment state
  const [registeringEvent, setRegisteringEvent] = useState<EsportsEvent | null>(null);
  const [checkoutRegistrationId, setCheckoutRegistrationId] = useState<number | null>(null);
  const [checkoutEvent, setCheckoutEvent] = useState<EsportsEvent | null>(null);

  // Metrics
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalEvents: 0,
    pendingPayments: 0,
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchSettings();
    fetchStats();
  }, []);

  // Handle URL invite link hash: #join=INVITE_TOKEN
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#join=')) {
      const inviteToken = hash.replace('#join=', '');
      if (inviteToken && token) {
        // Attempt to auto join team via invite token
        fetch('/api/teams/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ inviteToken }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.teamId) {
              window.location.hash = '';
              setSelectedTeamId(data.teamId);
              setCurrentTab('team-detail');
              refreshUser();
            }
          })
          .catch((err) => console.error('Join error:', err));
      }
    }
  }, [token]);

  const handleSelectTab = (tab: string, param?: any) => {
    if (tab === 'profile' && !user) {
      openAuthModal('signin');
      return;
    }
    setCurrentTab(tab);
    if (param && tab === 'event-detail') {
      setSelectedEventId(param);
    }
    if (param && tab === 'team-detail') {
      setSelectedTeamId(param);
    }
  };

  const handleViewEvent = (event: EsportsEvent) => {
    setSelectedEventId(event.id);
    setCurrentTab('event-detail');
  };

  const handleRegisterEvent = (event: EsportsEvent) => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    setRegisteringEvent(event);
  };

  const handleRegistrationSuccess = (regId: number, isFree: boolean) => {
    setRegisteringEvent(null);
    fetchEvents();
    fetchStats();

    if (isFree || !registeringEvent || registeringEvent.entryFee === 0) {
      // Free event slot is immediately confirmed
      setSelectedEventId(registeringEvent?.id || null);
      setCurrentTab('event-detail');
    } else {
      // Paid event triggers manual payment checkout
      setCheckoutRegistrationId(regId);
      setCheckoutEvent(registeringEvent);
      setCurrentTab('payment');
    }
  };

  const handlePayForRegistration = (registrationId: number, ev: EsportsEvent) => {
    setCheckoutRegistrationId(registrationId);
    setCheckoutEvent(ev);
    setCurrentTab('payment');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        orgName={settings?.orgName || 'Alpha Predictor X'}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'home' && (
          <HomeView
            events={events}
            settings={settings}
            stats={stats}
            onViewEvent={handleViewEvent}
            onRegisterEvent={handleRegisterEvent}
            onNavigate={handleSelectTab}
          />
        )}

        {currentTab === 'scrims' && (
          <EventsView
            events={events}
            initialType="scrim"
            onViewEvent={handleViewEvent}
            onRegisterEvent={handleRegisterEvent}
          />
        )}

        {currentTab === 'tournaments' && (
          <EventsView
            events={events}
            initialType="tournament"
            onViewEvent={handleViewEvent}
            onRegisterEvent={handleRegisterEvent}
          />
        )}

        {currentTab === 'event-detail' && selectedEventId && (
          <EventDetailView
            eventId={selectedEventId}
            onBack={() => setCurrentTab('scrims')}
            onRegisterTeam={handleRegisterEvent}
            onPayForRegistration={handlePayForRegistration}
          />
        )}

        {currentTab === 'payment' && checkoutRegistrationId && checkoutEvent && (
          <PaymentCheckoutView
            registrationId={checkoutRegistrationId}
            event={checkoutEvent}
            onBack={() => {
              setSelectedEventId(checkoutEvent.id);
              setCurrentTab('event-detail');
            }}
            onPaymentSuccess={() => {
              setSelectedEventId(checkoutEvent.id);
              setCurrentTab('event-detail');
              fetchEvents();
              fetchStats();
            }}
          />
        )}

        {currentTab === 'teams' && (
          <TeamsListView
            onSelectTeam={(teamId) => {
              setSelectedTeamId(teamId);
              setCurrentTab('team-detail');
            }}
          />
        )}

        {currentTab === 'team-detail' && selectedTeamId && (
          <TeamDetailView
            teamId={selectedTeamId}
            onBack={() => setCurrentTab('teams')}
            onViewEvent={handleViewEvent}
          />
        )}

        {currentTab === 'profile' && (
          <PlayerProfileView
            onSelectTeam={(teamId) => {
              setSelectedTeamId(teamId);
              setCurrentTab('team-detail');
            }}
          />
        )}

        {currentTab === 'admin' && isAdmin && (
          <AdminDashboardView
            events={events}
            settings={settings}
            onRefreshEvents={fetchEvents}
            onRefreshSettings={fetchSettings}
            onSelectTeam={(teamId) => {
              setSelectedTeamId(teamId);
              setCurrentTab('team-detail');
            }}
          />
        )}
      </main>

      <Footer settings={settings} onNavigate={handleSelectTab} />

      {/* Lineup Registration Modal */}
      {registeringEvent && (
        <RegisterModal
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          onSuccess={handleRegistrationSuccess}
          onNavigateToTeams={() => {
            setRegisteringEvent(null);
            setCurrentTab('teams');
          }}
        />
      )}

      {/* Global Secure Authentication Modal */}
      <AuthModal />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
