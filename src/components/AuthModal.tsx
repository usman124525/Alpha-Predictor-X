import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, X, Mail, Phone, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    signInWithEmail,
    signUpWithPhone,
    signUpWithEmail,
    sendPasswordReset,
    loginWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(authModalMode || 'signin');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // phone or email for sign in
  const [phone, setPhone] = useState(''); // phone for registration
  const [resetEmail, setResetEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Sync mode when modal opens or parent changes it
  React.useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
    setErrorMsg(null);
    setResetSent(false);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      closeAuthModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhone = (raw: string): { valid: boolean; cleaned: string; error?: string } => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { valid: false, cleaned: '', error: 'Phone number is required.' };
    }
    // Remove allowable formatting characters: spaces, dashes, parentheses, dots
    const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!phoneRegex.test(cleaned)) {
      return {
        valid: false,
        cleaned: '',
        error: 'Please enter a valid phone number with 8 to 15 digits (e.g. +92 300 1234567 or 03001234567).',
      };
    }
    return { valid: true, cleaned };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        if (!identifier.trim() || !password) {
          setErrorMsg('Please enter both your phone number/email and password.');
          setIsLoading(false);
          return;
        }
        await signInWithEmail(identifier.trim(), password);
        closeAuthModal();
      } else if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name or captain nickname.');
          setIsLoading(false);
          return;
        }
        
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) {
          setErrorMsg(phoneValidation.error || 'Invalid phone number format.');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        await signUpWithPhone(name.trim(), phoneValidation.cleaned, password);
        closeAuthModal();
      } else if (mode === 'reset') {
        if (!resetEmail.trim()) {
          setErrorMsg('Please enter your account email address for recovery.');
          setIsLoading(false);
          return;
        }
        await sendPasswordReset(resetEmail.trim());
        setResetSent(true);
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Invalid credentials. Please verify your phone number/email and password.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('This phone number is already registered. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid phone number or email address.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase font-mono tracking-wider">
                {mode === 'signin' && 'Sign In to Portal'}
                {mode === 'signup' && 'Create Esports Account'}
                {mode === 'reset' && 'Reset Password'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {mode === 'signin' && 'Sign in using your Phone Number or registered Email'}
                {mode === 'signup' && 'Register with your phone number to join tournaments'}
                {mode === 'reset' && 'Receive password recovery instructions by email'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close"
            onClick={closeAuthModal}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers if not reset */}
        {mode !== 'reset' && (
          <div className="grid grid-cols-2 border-b border-neutral-800 text-xs font-bold uppercase tracking-wider font-mono">
            <button
              id="auth-tab-signin"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`py-3 text-center transition border-b-2 ${
                mode === 'signin'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 bg-neutral-950'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`py-3 text-center transition border-b-2 ${
                mode === 'signup'
                  ? 'border-amber-400 text-amber-400 bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 bg-neutral-950'
              }`}
            >
              Register (Phone)
            </button>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reset password success message */}
          {resetSent && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password Reset Email Sent!</span>
              </div>
              <p className="text-neutral-300">
                We have sent instructions to <span className="font-mono text-white">{resetEmail}</span>. Please check your inbox or spam folder.
              </p>
              <button
                onClick={() => setMode('signin')}
                className="text-amber-400 hover:underline font-semibold mt-2 inline-block"
              >
                ← Return to Sign In
              </button>
            </div>
          )}

          {!resetSent && (
            <>
              {/* Google Fast Sign-in (Available in Sign In and Sign Up) */}
              {mode !== 'reset' && (
                <div>
                  <button
                    id="btn-auth-google"
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-neutral-800 hover:bg-neutral-750 text-white font-semibold py-2.5 px-4 rounded-xl border border-neutral-700 transition text-xs shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.58 0 2.97.55 4.08 1.45l3.05-3.05C17.29 1.7 14.82 1 12 1 7.5 1 3.65 3.58 1.75 7.34l3.75 2.91C6.4 7.27 8.95 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.49-1.14 2.76-2.4 3.6l3.71 2.89c2.17-2 3.72-4.94 3.72-8.73z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.5 14.25c-.24-.71-.38-1.47-.38-2.25s.14-1.54.38-2.25L1.75 6.84C.64 9.07 0 11.45 0 14.25s.64 5.18 1.75 7.41l3.75-2.91z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23.5c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.89c-1.07.72-2.45 1.15-4.22 1.15-3.05 0-5.6-2.27-6.5-5.25L1.75 16.51C3.65 20.42 7.5 23.5 12 23.5z"
                      />
                    </svg>
                    <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
                  </button>

                  <div className="relative my-4 flex items-center justify-center">
                    <div className="border-t border-neutral-800 w-full" />
                    <span className="bg-neutral-900 px-3 text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                      {mode === 'signup' ? 'or register with phone' : 'or enter credentials'}
                    </span>
                    <div className="border-t border-neutral-800 w-full" />
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {/* SIGNUP: Name */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                      Full Name or Nickname <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-name"
                        type="text"
                        required
                        placeholder="e.g. Captain Bilal"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* SIGNUP: Phone Number */}
                {mode === 'signup' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                        Phone Number <span className="text-amber-400">*</span>
                      </label>
                      <span className="text-[10px] text-amber-400/90 font-mono font-medium">
                        For SMS & WhatsApp verification
                      </span>
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-phone"
                        type="tel"
                        required
                        placeholder="e.g. +92 300 1234567 or 03001234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Enter a valid 8-15 digit mobile number (e.g. +923001234567 or local 03001234567).
                    </p>
                  </div>
                )}

                {/* SIGNIN: Phone Number or Email */}
                {mode === 'signin' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                      Phone Number or Email <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-identifier"
                        type="text"
                        required
                        placeholder="e.g. +92 300 1234567 or captain@example.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* RESET: Email */}
                {mode === 'reset' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                      Account Email Address <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-reset-email"
                        type="email"
                        required
                        placeholder="captain@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* PASSWORD */}
                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                        Password <span className="text-amber-400">*</span>
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('reset');
                            setErrorMsg(null);
                          }}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-10 py-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* SIGNUP: Confirm Password */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                      Confirm Password <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black uppercase tracking-wider py-3 rounded-xl transition text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' && 'Sign In to Account'}
                        {mode === 'signup' && 'Register Account (Phone)'}
                        {mode === 'reset' && 'Send Password Reset Email'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Bottom Switcher */}
          <div className="pt-2 text-center text-xs text-neutral-400 border-t border-neutral-800">
            {mode === 'signin' && (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Register with Phone
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            )}
            {mode === 'reset' && !resetSent && (
              <button
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className="text-amber-400 hover:underline font-semibold"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

                        Password <span className="text-amber-400">*</span>
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('reset');
                            setErrorMsg(null);
                          }}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-10 py-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                      Confirm Password <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-auth-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black uppercase tracking-wider py-3 rounded-xl transition text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' && 'Sign In to Account'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'reset' && 'Send Password Reset Email'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Bottom Switcher */}
          <div className="pt-2 text-center text-xs text-neutral-400 border-t border-neutral-850">
            {mode === 'signin' && (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Sign Up
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            )}
            {mode === 'reset' && !resetSent && (
              <button
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className="text-amber-400 hover:underline font-semibold"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
