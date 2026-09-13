import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  phone: text('phone'),
  name: text('name').notNull(),
  role: text('role').notNull().default('player'), // 'admin' | 'captain' | 'player'
  createdAt: timestamp('created_at').defaultNow(),
});

// Players table (PUBG Mobile profile)
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  pubgName: text('pubg_name').notNull(),
  pubgUid: text('pubg_uid').notNull(),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Teams table (Permanent entities)
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  teamCode: text('team_code').notNull().unique(), // e.g. NOVA4821
  inviteToken: text('invite_token').notNull().unique(), // Unique invite token
  captainUserId: integer('captain_user_id')
    .references(() => users.id)
    .notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'banned'
  maxPlayers: integer('max_players').notNull().default(6),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Team Members table (Links players permanently to teams)
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .references(() => teams.id)
    .notNull(),
  playerId: integer('player_id')
    .references(() => players.id)
    .notNull(),
  role: text('role').notNull().default('member'), // 'captain' | 'member' | 'substitute'
  isActive: boolean('is_active').notNull().default(true),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// Events table (Scrims and Tournaments)
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  type: text('type').notNull().default('scrim'), // 'scrim' | 'tournament'
  name: text('name').notNull(),
  date: text('date').notNull(), // e.g. 2026-09-15
  startTime: text('start_time').notNull(), // e.g. 08:00 PM PKT
  registrationOpenTime: text('registration_open_time'),
  registrationCloseTime: text('registration_close_time'),
  entryFee: integer('entry_fee').notNull().default(0), // in PKR / currency
  maxTeams: integer('max_teams').notNull().default(25),
  playersPerTeam: integer('players_per_team').notNull().default(4),
  substitutesAllowed: integer('substitutes_allowed').notNull().default(1),
  map: text('map').notNull().default('Erangel'), // Erangel, Miramar, Sanhok, etc.
  mode: text('mode').notNull().default('TPP Squad'),
  prizeInfo: text('prize_info'),
  rules: text('rules'),
  coverUrl: text('cover_url'),
  roomId: text('room_id'),
  roomPassword: text('room_password'),
  status: text('status').notNull().default('Registration Open'), // 'Draft' | 'Registration Open' | 'Full' | 'Registration Closed' | 'Live' | 'Completed' | 'Archived'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Event Registrations table
export const eventRegistrations = pgTable('event_registrations', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .references(() => events.id)
    .notNull(),
  teamId: integer('team_id')
    .references(() => teams.id)
    .notNull(),
  teamNameSnapshot: text('team_name_snapshot').notNull(),
  registrationStatus: text('registration_status').notNull().default('PENDING_PAYMENT'), // 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'PAYMENT_REJECTED'
  slotNumber: integer('slot_number'),
  registeredBy: integer('registered_by')
    .references(() => users.id)
    .notNull(),
  registeredAt: timestamp('registered_at').defaultNow(),
});

// Registration Players (Lineup snapshot for that specific event)
export const registrationPlayers = pgTable('registration_players', {
  id: serial('id').primaryKey(),
  registrationId: integer('registration_id')
    .references(() => eventRegistrations.id)
    .notNull(),
  playerId: integer('player_id')
    .references(() => players.id)
    .notNull(),
  pubgNameSnapshot: text('pubg_name_snapshot').notNull(),
  pubgUidSnapshot: text('pubg_uid_snapshot').notNull(),
  lineupRole: text('lineup_role').notNull().default('starter'), // 'starter' | 'substitute'
});

// Payment Methods table (Configured by admin)
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // 'Easypaisa', 'JazzCash', 'Bank Transfer'
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number').notNull(),
  bankName: text('bank_name'),
  iban: text('iban'),
  instructions: text('instructions'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payments table (Manual verification)
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  registrationId: integer('registration_id')
    .references(() => eventRegistrations.id)
    .notNull(),
  teamId: integer('team_id')
    .references(() => teams.id)
    .notNull(),
  teamNameSnapshot: text('team_name_snapshot').notNull(),
  eventId: integer('event_id')
    .references(() => events.id)
    .notNull(),
  eventNameSnapshot: text('event_name_snapshot').notNull(),
  amount: integer('amount').notNull(),
  paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
  paymentMethodSnapshot: text('payment_method_snapshot').notNull(),
  transactionId: text('transaction_id'),
  screenshotUrl: text('screenshot_url').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedBy: integer('submitted_by')
    .references(() => users.id)
    .notNull(),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Results table
export const results = pgTable('results', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .references(() => events.id)
    .notNull(),
  teamId: integer('team_id')
    .references(() => teams.id)
    .notNull(),
  teamNameSnapshot: text('team_name_snapshot').notNull(),
  position: integer('position').notNull(),
  placementPoints: integer('placement_points').notNull().default(0),
  kills: integer('kills').notNull().default(0),
  totalPoints: integer('total_points').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit Logs table (For admin actions)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  adminName: text('admin_name').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  targetType: text('target_type'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Organization Settings table
export const organizationSettings = pgTable('organization_settings', {
  id: serial('id').primaryKey(),
  orgName: text('org_name').notNull().default('Alpha Predictor X'),
  tagline: text('tagline').default('Official PUBG MOBILE Esports Organization'),
  logoUrl: text('logo_url'),
  description: text('description'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  discordUrl: text('discord_url'),
  whatsappUrl: text('whatsapp_url'),
  instagramUrl: text('instagram_url'),
  youtubeUrl: text('youtube_url'),
  generalRules: text('general_rules'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  player: one(players, {
    fields: [users.id],
    references: [players.userId],
  }),
  teamsCaptained: many(teams),
  registrations: many(eventRegistrations),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  user: one(users, {
    fields: [players.userId],
    references: [users.id],
  }),
  memberships: many(teamMembers),
  lineups: many(registrationPlayers),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  captain: one(users, {
    fields: [teams.captainUserId],
    references: [users.id],
  }),
  members: many(teamMembers),
  registrations: many(eventRegistrations),
  payments: many(payments),
  results: many(results),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  player: one(players, {
    fields: [teamMembers.playerId],
    references: [players.id],
  }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(eventRegistrations),
  results: many(results),
  payments: many(payments),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one, many }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [eventRegistrations.teamId],
    references: [teams.id],
  }),
  registeredByUser: one(users, {
    fields: [eventRegistrations.registeredBy],
    references: [users.id],
  }),
  lineup: many(registrationPlayers),
  payments: many(payments),
}));

export const registrationPlayersRelations = relations(registrationPlayers, ({ one }) => ({
  registration: one(eventRegistrations, {
    fields: [registrationPlayers.registrationId],
    references: [eventRegistrations.id],
  }),
  player: one(players, {
    fields: [registrationPlayers.playerId],
    references: [players.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  registration: one(eventRegistrations, {
    fields: [payments.registrationId],
    references: [eventRegistrations.id],
  }),
  team: one(teams, {
    fields: [payments.teamId],
    references: [teams.id],
  }),
  event: one(events, {
    fields: [payments.eventId],
    references: [events.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [payments.paymentMethodId],
    references: [paymentMethods.id],
  }),
  submitter: one(users, {
    fields: [payments.submittedBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [payments.approvedBy],
    references: [users.id],
  }),
}));
