import React from 'react';
import { Shield, MessageSquare, Phone, Mail, Award } from 'lucide-react';
import { OrganizationSettings } from '../types.ts';

interface FooterProps {
  settings?: OrganizationSettings | null;
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  const orgName = settings?.orgName || 'Alpha Predictor X';
  const tagline = settings?.tagline || 'Premier PUBG MOBILE Scrims & Tournament Hub';

  return (
    <footer className="bg-neutral-950 border-t border-neutral-800 text-neutral-400 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-neutral-950">
                <Shield className="w-5 h-5 text-neutral-950" />
              </div>
              <span className="font-black text-lg text-white font-mono uppercase tracking-wider">{orgName}</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">{tagline}</p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded text-neutral-300">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                PMGC Rules Compliant
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-3">Portal Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition">
                  Home & Announcements
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('scrims')} className="hover:text-amber-400 transition">
                  Daily Scrims
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tournaments')} className="hover:text-amber-400 transition">
                  Competitive Tournaments
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('teams')} className="hover:text-amber-400 transition">
                  Registered Teams Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Guidelines & Fair Play */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-3">Fair Play & Rules</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Strict anti-cheat policy. Handcam/POV recordings may be requested by admins. Emulators and tablets are barred from official mobile brackets.
            </p>
          </div>

          {/* Col 4: Contact & Socials */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-3">Organizer Support</h4>
            <ul className="space-y-2 text-xs">
              {settings?.contactEmail && (
                <li className="flex items-center gap-2 text-neutral-300">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>{settings.contactEmail}</span>
                </li>
              )}
              {settings?.contactPhone && (
                <li className="flex items-center gap-2 text-neutral-300">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{settings.contactPhone}</span>
                </li>
              )}
              {settings?.whatsappUrl && (
                <li>
                  <a
                    href={settings.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp Community
                  </a>
                </li>
              )}
              {settings?.discordUrl && (
                <li>
                  <a
                    href={settings.discordUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:underline"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Official Discord Server
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>© {new Date().getFullYear()} {orgName}. All rights reserved. PUBG MOBILE is a registered trademark of Krafton / Tencent Games.</p>
          <p className="text-[11px] text-neutral-400">PostgreSQL Powered • Manual Payment Verification Engine</p>
        </div>
      </div>
    </footer>
  );
};
