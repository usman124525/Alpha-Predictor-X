import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { User, Player, Team } from '../types.ts';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  player: Player | null;
  captainedTeams: Team[];
  teams: Team[];
  token: string | null;
  isAdmin: boolean;
  isCaptain: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'reset';
  openAuthModal: (mode?: 'signin' | 'signup' | 'reset') => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  signInWithEmail: (identifierInput: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  signUpWithPhone: (name: string, phone: string, pass: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const normalizeAuthIdentifier = (input: string): string => {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const clean = trimmed.replace(/[\s\-\(\)\.]/g, '');
  const prefix = clean.startsWith('+') ? 'p' + clean.slice(1) : 'p' + clean;
  return `${prefix}@alphapredictorx.esports`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [captainedTeams, setCaptainedTeams] = useState<Team[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('esports_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auth modal management
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup' | 'reset' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const fetchUserData = async (authToken: string) => {
    try {
      const res = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setPlayer(data.player);
        setCaptainedTeams(data.captainedTeams || []);
        setTeams(data.teams || []);
      } else {
        if (res.status === 401) {
          localStorage.removeItem('esports_auth_token');
          setToken(null);
          setUser(null);
          setPlayer(null);
          setCaptainedTeams([]);
          setTeams([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch /api/me:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const idToken = await fUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('esports_auth_token', idToken);
          await fetchUserData(idToken);
        } catch (e) {
          console.error('Failed getting Firebase ID token:', e);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Not authenticated
        localStorage.removeItem('esports_auth_token');
        setToken(null);
        setUser(null);
        setPlayer(null);
        setCaptainedTeams([]);
        setTeams([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('esports_auth_token', idToken);
      await fetchUserData(idToken);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (identifierInput: string, passwordInput: string) => {
    setIsLoading(true);
    try {
      const emailToUse = normalizeAuthIdentifier(identifierInput);
      const result = await signInWithEmailAndPassword(auth, emailToUse, passwordInput);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('esports_auth_token', idToken);
      await fetchUserData(idToken);
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (nameInput: string, emailInput: string, passwordInput: string) => {
    setIsLoading(true);
    try {
      const emailToUse = normalizeAuthIdentifier(emailInput);
      const result = await createUserWithEmailAndPassword(auth, emailToUse, passwordInput);
      await updateProfile(result.user, { displayName: nameInput });
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('esports_auth_token', idToken);
      await fetchUserData(idToken);
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithPhone = async (nameInput: string, phoneInput: string, passwordInput: string) => {
    setIsLoading(true);
    try {
      const authEmail = normalizeAuthIdentifier(phoneInput);
      const result = await createUserWithEmailAndPassword(auth, authEmail, passwordInput);
      await updateProfile(result.user, { displayName: nameInput });
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('esports_auth_token', idToken);
      await fetchUserData(idToken);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (emailInput: string) => {
    await sendPasswordResetEmail(auth, emailInput);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    localStorage.removeItem('esports_auth_token');
    setToken(null);
    setUser(null);
    setPlayer(null);
    setCaptainedTeams([]);
    setTeams([]);
    setIsLoading(false);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserData(token);
    }
  };

  const isAdmin = !!(user && (user.role === 'admin' || user.email === 'us0682888@gmail.com'));
  const isCaptain = !!(user && (user.role === 'captain' || captainedTeams.length > 0 || isAdmin));

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        player,
        captainedTeams,
        teams,
        token,
        isAdmin,
        isCaptain,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signUpWithPhone,
        sendPasswordReset,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
