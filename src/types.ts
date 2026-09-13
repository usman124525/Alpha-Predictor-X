export type UserRole = 'admin' | 'captain' | 'player';

export interface User {
  id: number;
  uid: string;
  email: string;
  phone?: string | null;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Player {
  id: number;
  userId: number;
  pubgName: string;
  pubgUid: string;
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  name: string;
  logoUrl?: string | null;
  teamCode: string;
  inviteToken: string;
  captainUserId: number;
  captainName?: string;
  captainEmail?: string;
  status: 'active' | 'banned';
  maxPlayers: number;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberWithPlayer {
  membershipId: number;
  role: 'captain' | 'member' | 'substitute';
  isActive: boolean;
  joinedAt: string;
  player: Player;
}

export interface EsportsEvent {
  id: number;
  type: 'scrim' | 'tournament';
  name: string;
  date: string;
  startTime: string;
  registrationOpenTime?: string | null;
  registrationCloseTime?: string | null;
  entryFee: number;
  maxTeams: number;
  playersPerTeam: number;
  substitutesAllowed: number;
  map: string;
  mode: string;
  prizeInfo?: string | null;
  rules?: string | null;
  coverUrl?: string | null;
  roomId?: string | null;
  roomPassword?: string | null;
  status: 'Draft' | 'Registration Open' | 'Full' | 'Registration Closed' | 'Live' | 'Completed' | 'Archived';
  confirmedCount?: number;
  availableSlots?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationPlayer {
  id: number;
  registrationId: number;
  playerId: number;
  pubgNameSnapshot: string;
  pubgUidSnapshot: string;
  lineupRole: 'starter' | 'substitute';
}

export interface EventRegistration {
  id: number;
  eventId: number;
  teamId: number;
  teamNameSnapshot: string;
  registrationStatus: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'PAYMENT_REJECTED';
  slotNumber?: number | null;
  registeredBy: number;
  registeredAt: string;
  teamLogo?: string | null;
  lineup?: RegistrationPlayer[];
}

export interface PaymentMethod {
  id: number;
  name: string; // 'Easypaisa' | 'JazzCash' | 'Bank Transfer'
  accountName: string;
  accountNumber: string;
  bankName?: string | null;
  iban?: string | null;
  instructions?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: number;
  registrationId: number;
  teamId: number;
  teamNameSnapshot: string;
  teamName?: string;
  teamLogo?: string | null;
  eventId: number;
  eventNameSnapshot: string;
  eventName?: string;
  amount: number;
  paymentMethodId?: number | null;
  paymentMethodSnapshot: string;
  transactionId?: string | null;
  screenshotUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedBy: number;
  submitterName?: string;
  submitterEmail?: string;
  approvedBy?: number | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  slotNumber?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  id: number;
  eventId: number;
  teamId: number;
  teamNameSnapshot: string;
  logoUrl?: string | null;
  position: number;
  placementPoints: number;
  kills: number;
  totalPoints: number;
  notes?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  adminName: string;
  action: string;
  details: string;
  targetType?: string | null;
  createdAt: string;
}

export interface OrganizationSettings {
  id: number;
  orgName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  discordUrl?: string | null;
  whatsappUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  generalRules?: string | null;
  updatedAt: string;
}
