import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  users,
  players,
  teams,
  teamMembers,
  events,
  eventRegistrations,
  registrationPlayers,
  paymentMethods,
  payments,
  results,
  auditLogs,
  organizationSettings,
} from './src/db/schema.ts';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin, AuthRequest } from './src/middleware/auth.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer setup for persistent file storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) && allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed'));
    }
  },
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// File upload endpoint
app.post('/api/upload', requireAuth, upload.single('file'), (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error: any) {
    console.error('File upload failed:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

// ==========================================
// 1. ORGANIZATION SETTINGS & STATS
// ==========================================

const getSettingsHandler = async (_req: express.Request, res: express.Response) => {
  try {
    const [settings] = await db.select().from(organizationSettings).limit(1);
    res.json(
      settings || {
        id: 1,
        orgName: 'Alpha Predictor X',
        tagline: 'Competitive PUBG MOBILE Esports Hub',
        description: 'Host of premier PUBG MOBILE Scrims and Competitive Tournaments.',
        contactEmail: 'contact@alphapredictorx.com',
        contactPhone: '+92 300 1234567',
        discordUrl: 'https://discord.gg/alphapredictorx',
        whatsappUrl: 'https://chat.whatsapp.com/alphapredictorx',
        generalRules: '1. No emulators allowed.\n2. iPad view / GFX tools strictly banned.\n3. Lineup must match registered players.',
      }
    );
  } catch (err: any) {
    console.error('Failed to get settings:', err);
    res.status(500).json({ error: 'Failed to retrieve organization settings' });
  }
};

const getStatsHandler = async (_req: express.Request, res: express.Response) => {
  try {
    const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(teams);
    const [playerCount] = await db.select({ count: sql<number>`count(*)` }).from(players);
    const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(events);
    const [pendingPaymentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.status, 'PENDING'));

    res.json({
      totalTeams: Number(teamCount?.count || 0),
      totalPlayers: Number(playerCount?.count || 0),
      totalEvents: Number(eventCount?.count || 0),
      pendingPayments: Number(pendingPaymentCount?.count || 0),
    });
  } catch (err: any) {
    console.error('Failed to get stats:', err);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
};

const updateSettingsHandler = async (req: AuthRequest, res: express.Response) => {
  try {
    const {
      orgName,
      tagline,
      logoUrl,
      description,
      contactEmail,
      contactPhone,
      discordUrl,
      whatsappUrl,
      instagramUrl,
      youtubeUrl,
      generalRules,
    } = req.body;

    const [existing] = await db.select().from(organizationSettings).limit(1);
    let updated;
    if (existing) {
      [updated] = await db
        .update(organizationSettings)
        .set({
          orgName: orgName || existing.orgName,
          tagline,
          logoUrl,
          description,
          contactEmail,
          contactPhone,
          discordUrl,
          whatsappUrl,
          instagramUrl,
          youtubeUrl,
          generalRules,
          updatedAt: new Date(),
        })
        .where(eq(organizationSettings.id, existing.id))
        .returning();
    } else {
      [updated] = await db
        .insert(organizationSettings)
        .values({
          orgName: orgName || 'Alpha Predictor X',
          tagline,
          logoUrl,
          description,
          contactEmail,
          contactPhone,
          discordUrl,
          whatsappUrl,
          instagramUrl,
          youtubeUrl,
          generalRules,
        })
        .returning();
    }

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: 'Updated Organization Settings',
      details: `Updated settings for ${orgName || 'organization'}`,
      targetType: 'organization',
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update org settings:', err);
    res.status(500).json({ error: 'Failed to update organization settings' });
  }
};

app.get('/api/settings', getSettingsHandler);
app.get('/api/admin/settings', requireAuth, requireAdmin, getSettingsHandler);
app.post('/api/admin/settings', requireAuth, requireAdmin, updateSettingsHandler);
app.put('/api/admin/settings', requireAuth, requireAdmin, updateSettingsHandler);
app.post('/api/settings', requireAuth, requireAdmin, updateSettingsHandler);
app.put('/api/settings', requireAuth, requireAdmin, updateSettingsHandler);
app.put('/api/organization', requireAuth, requireAdmin, updateSettingsHandler);

app.get('/api/stats', getStatsHandler);

app.get('/api/organization', async (_req, res) => {
  try {
    const [settings] = await db.select().from(organizationSettings).limit(1);
    const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(teams);
    const [playerCount] = await db.select({ count: sql<number>`count(*)` }).from(players);
    const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(events);
    const [pendingPaymentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.status, 'PENDING'));

    res.json({
      settings: settings || {
        orgName: 'Alpha Predictor X',
        tagline: 'Competitive PUBG MOBILE Esports Hub',
        description: 'Host of premier PUBG MOBILE Scrims and Competitive Tournaments.',
      },
      stats: {
        totalTeams: Number(teamCount?.count || 0),
        totalPlayers: Number(playerCount?.count || 0),
        totalEvents: Number(eventCount?.count || 0),
        pendingPayments: Number(pendingPaymentCount?.count || 0),
      },
    });
  } catch (err: any) {
    console.error('Failed to get org settings:', err);
    res.status(500).json({ error: 'Failed to retrieve organization settings' });
  }
});

const getAuditLogsHandler = async (_req: AuthRequest, res: express.Response) => {
  try {
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
    res.json(logs);
  } catch (err: any) {
    console.error('Failed to fetch audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

app.get('/api/audit-logs', requireAuth, requireAdmin, getAuditLogsHandler);
app.get('/api/admin/audit-logs', requireAuth, requireAdmin, getAuditLogsHandler);

// ==========================================
// 2. AUTH & CURRENT USER PROFILE
// ==========================================
app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user?.dbUser;
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Player profile
    const [playerProfile] = await db.select().from(players).where(eq(players.userId, user.id));

    // Teams where user is captain
    const captainedTeams = await db.select().from(teams).where(eq(teams.captainUserId, user.id));

    // Active team memberships
    let userTeams: any[] = [];
    if (playerProfile) {
      const memberships = await db
        .select({
          membershipId: teamMembers.id,
          role: teamMembers.role,
          joinedAt: teamMembers.joinedAt,
          team: teams,
        })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(and(eq(teamMembers.playerId, playerProfile.id), eq(teamMembers.isActive, true)));
      userTeams = memberships.map((m) => ({ ...m.team, memberRole: m.role }));
    }

    res.json({
      user,
      player: playerProfile || null,
      captainedTeams,
      teams: userTeams,
      isAdmin: user.role === 'admin' || user.email === 'us0682888@gmail.com',
    });
  } catch (err: any) {
    console.error('Error in /api/me:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const savePlayerProfileHandler = async (req: AuthRequest, res: express.Response) => {
  try {
    const { pubgName, pubgUid, profileImage } = req.body;
    if (!pubgName || !pubgUid) {
      return res.status(400).json({ error: 'PUBG Mobile Name and UID are required' });
    }

    const userId = req.user!.dbUser!.id;
    const [existing] = await db.select().from(players).where(eq(players.userId, userId));

    let player;
    if (existing) {
      [player] = await db
        .update(players)
        .set({
          pubgName: pubgName.trim(),
          pubgUid: pubgUid.trim(),
          profileImage: profileImage || existing.profileImage,
          updatedAt: new Date(),
        })
        .where(eq(players.id, existing.id))
        .returning();
    } else {
      [player] = await db
        .insert(players)
        .values({
          userId,
          pubgName: pubgName.trim(),
          pubgUid: pubgUid.trim(),
          profileImage,
        })
        .returning();
    }

    res.json(player);
  } catch (err: any) {
    console.error('Failed to save player profile:', err);
    res.status(500).json({ error: 'Failed to update player profile' });
  }
};

app.post('/api/player/profile', requireAuth, savePlayerProfileHandler);
app.post('/api/player-profile', requireAuth, savePlayerProfileHandler);

// ==========================================
// 3. TEAMS MANAGEMENT
// ==========================================
app.get('/api/teams', async (_req, res) => {
  try {
    const allTeams = await db.select().from(teams).orderBy(desc(teams.createdAt));

    // Fetch member count and captain name for each team
    const teamsWithDetails = await Promise.all(
      allTeams.map(async (t) => {
        const [captain] = await db.select().from(users).where(eq(users.id, t.captainUserId));
        const members = await db
          .select()
          .from(teamMembers)
          .where(and(eq(teamMembers.teamId, t.id), eq(teamMembers.isActive, true)));
        return {
          ...t,
          captainName: captain?.name || 'Unknown',
          memberCount: members.length,
        };
      })
    );

    res.json(teamsWithDetails);
  } catch (err: any) {
    console.error('Failed to list teams:', err);
    res.status(500).json({ error: 'Failed to list teams' });
  }
});

app.post('/api/teams', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, logoUrl } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Team name is required (at least 2 characters)' });
    }

    const userId = req.user!.dbUser!.id;

    // Ensure player profile exists for captain
    let [player] = await db.select().from(players).where(eq(players.userId, userId));
    if (!player) {
      [player] = await db
        .insert(players)
        .values({
          userId,
          pubgName: req.user!.name || 'Captain',
          pubgUid: '00000000',
        })
        .returning();
    }

    // Generate unique team code (e.g., NOVA7294)
    const prefix = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'TEAM';
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const teamCode = `${prefix}${randDigits}`;
    const inviteToken = Buffer.from(`${teamCode}-${Date.now()}`).toString('base64url').slice(0, 16);

    const [newTeam] = await db
      .insert(teams)
      .values({
        name: name.trim(),
        logoUrl: logoUrl || null,
        teamCode,
        inviteToken,
        captainUserId: userId,
        status: 'active',
        maxPlayers: 6,
      })
      .returning();

    // Add captain as first team member
    await db.insert(teamMembers).values({
      teamId: newTeam.id,
      playerId: player.id,
      role: 'captain',
      isActive: true,
    });

    // Update user role to captain if currently player
    if (req.user!.dbUser!.role === 'player') {
      await db.update(users).set({ role: 'captain' }).where(eq(users.id, userId));
    }

    res.json(newTeam);
  } catch (err: any) {
    console.error('Failed to create team:', err);
    res.status(500).json({ error: err.message || 'Failed to create team' });
  }
});

app.get('/api/teams/:id', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (isNaN(teamId)) return res.status(400).json({ error: 'Invalid team ID' });

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const [captain] = await db.select().from(users).where(eq(users.id, team.captainUserId));

    // Members
    const members = await db
      .select({
        membershipId: teamMembers.id,
        role: teamMembers.role,
        isActive: teamMembers.isActive,
        joinedAt: teamMembers.joinedAt,
        player: players,
      })
      .from(teamMembers)
      .innerJoin(players, eq(teamMembers.playerId, players.id))
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.isActive, true)));

    // Registrations & Participation History
    const history = await db
      .select({
        registration: eventRegistrations,
        event: events,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.teamId, teamId))
      .orderBy(desc(eventRegistrations.registeredAt));

    // Results
    const teamResults = await db
      .select()
      .from(results)
      .where(eq(results.teamId, teamId))
      .orderBy(desc(results.createdAt));

    res.json({
      ...team,
      captainName: captain?.name || 'Unknown',
      captainEmail: captain?.email,
      members,
      history,
      results: teamResults,
    });
  } catch (err: any) {
    console.error('Failed to get team details:', err);
    res.status(500).json({ error: 'Failed to retrieve team details' });
  }
});

// Team participation history and lineup snapshots
app.get('/api/teams/:id/history', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (isNaN(teamId)) return res.status(400).json({ error: 'Invalid team ID' });

    const regs = await db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        eventName: events.name,
        eventType: events.type,
        eventDate: events.date,
        registrationStatus: eventRegistrations.registrationStatus,
        slotNumber: eventRegistrations.slotNumber,
        registeredAt: eventRegistrations.registeredAt,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.teamId, teamId))
      .orderBy(desc(eventRegistrations.registeredAt));

    const historyWithLineup = await Promise.all(
      regs.map(async (reg) => {
        const lineup = await db
          .select({
            id: registrationPlayers.id,
            playerId: registrationPlayers.playerId,
            pubgNameSnapshot: registrationPlayers.pubgNameSnapshot,
            pubgUidSnapshot: registrationPlayers.pubgUidSnapshot,
            lineupRole: registrationPlayers.lineupRole,
          })
          .from(registrationPlayers)
          .where(eq(registrationPlayers.registrationId, reg.id));

        return {
          ...reg,
          lineup,
        };
      })
    );

    res.json(historyWithLineup);
  } catch (err: any) {
    console.error('Failed to get team history:', err);
    res.status(500).json({ error: 'Failed to retrieve team history' });
  }
});

// Join team via Code or Invite Token
app.post('/api/teams/join', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamCode, inviteToken } = req.body;
    if (!teamCode && !inviteToken) {
      return res.status(400).json({ error: 'Team code or invite token required' });
    }

    let team;
    if (teamCode) {
      [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.teamCode, teamCode.trim().toUpperCase()));
    } else if (inviteToken) {
      [team] = await db.select().from(teams).where(eq(teams.inviteToken, inviteToken.trim()));
    }

    if (!team) {
      return res.status(404).json({ error: 'Team not found with the provided code or token' });
    }

    if (team.status === 'banned') {
      return res.status(403).json({ error: 'This team has been suspended by administration' });
    }

    const userId = req.user!.dbUser!.id;
    let [player] = await db.select().from(players).where(eq(players.userId, userId));
    if (!player) {
      [player] = await db
        .insert(players)
        .values({
          userId,
          pubgName: req.user!.name || 'Player',
          pubgUid: '00000000',
        })
        .returning();
    }

    // Check if already in team
    const [existingMember] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.playerId, player.id), eq(teamMembers.isActive, true)));

    if (existingMember) {
      return res.status(400).json({ error: 'You are already an active member of this team' });
    }

    // Check player limit
    const currentMembers = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.isActive, true)));

    if (currentMembers.length >= team.maxPlayers) {
      return res.status(400).json({ error: `Team is full. Maximum limit is ${team.maxPlayers} players.` });
    }

    const [membership] = await db
      .insert(teamMembers)
      .values({
        teamId: team.id,
        playerId: player.id,
        role: 'member',
        isActive: true,
      })
      .returning();

    res.json({ message: `Successfully joined ${team.name}`, team, membership });
  } catch (err: any) {
    console.error('Failed to join team:', err);
    res.status(500).json({ error: err.message || 'Failed to join team' });
  }
});

// Remove member from team
app.post('/api/teams/:id/remove-member', requireAuth, async (req: AuthRequest, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { playerId } = req.body;
    const userId = req.user!.dbUser!.id;
    const isAdmin = req.user!.dbUser!.role === 'admin' || req.user!.email === 'us0682888@gmail.com';

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.captainUserId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Only the captain or admin can remove players from this team' });
    }

    // Deactivate membership (keeps historical records intact)
    await db
      .update(teamMembers)
      .set({ isActive: false })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.playerId, playerId)));

    res.json({ message: 'Player removed from team active roster' });
  } catch (err: any) {
    console.error('Failed to remove player:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

app.delete('/api/teams/:id/members/:memberId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.memberId, 10);
    const userId = req.user!.dbUser!.id;
    const isAdmin = req.user!.dbUser!.role === 'admin' || req.user!.email === 'us0682888@gmail.com';

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.captainUserId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Only the captain or admin can remove players from this team' });
    }

    // Deactivate membership matching membershipId or playerId
    await db
      .update(teamMembers)
      .set({ isActive: false })
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          or(eq(teamMembers.id, memberId), eq(teamMembers.playerId, memberId))
        )
      );

    res.json({ message: 'Player removed from team active roster' });
  } catch (err: any) {
    console.error('Failed to delete member:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Update team details (name, logo, etc.)
app.put('/api/teams/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { name, logoUrl } = req.body;
    const userId = req.user!.dbUser!.id;
    const isAdmin = req.user!.dbUser!.role === 'admin' || req.user!.email === 'us0682888@gmail.com';

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.captainUserId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Only captain or admin can edit this team' });
    }

    const [updated] = await db
      .update(teams)
      .set({
        name: name ? name.trim() : team.name,
        logoUrl: logoUrl !== undefined ? logoUrl : team.logoUrl,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning();

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update team:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Admin change team status (active / banned)
app.put('/api/admin/teams/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const [updated] = await db
      .update(teams)
      .set({ status, updatedAt: new Date() })
      .where(eq(teams.id, teamId))
      .returning();

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Updated team status to ${status}`,
      details: `Team ID ${teamId} status changed to ${status}`,
      targetType: 'team',
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to change team status:', err);
    res.status(500).json({ error: 'Failed to update team status' });
  }
});

// ==========================================
// 4. EVENTS (SCRIMS & TOURNAMENTS)
// ==========================================
app.get('/api/events', async (req, res) => {
  try {
    const { type, status } = req.query;

    let query = db.select().from(events);
    const conditions = [];

    if (type && typeof type === 'string' && type !== 'all') {
      conditions.push(eq(events.type, type));
    }
    if (status && typeof status === 'string' && status !== 'all') {
      conditions.push(eq(events.status, status));
    }

    let allEvents;
    if (conditions.length > 0) {
      allEvents = await db
        .select()
        .from(events)
        .where(and(...conditions))
        .orderBy(desc(events.id));
    } else {
      allEvents = await db.select().from(events).orderBy(desc(events.id));
    }

    // Add slot count & registration count
    const eventsWithStats = await Promise.all(
      allEvents.map(async (ev) => {
        const regs = await db
          .select()
          .from(eventRegistrations)
          .where(and(eq(eventRegistrations.eventId, ev.id), eq(eventRegistrations.registrationStatus, 'CONFIRMED')));
        return {
          ...ev,
          confirmedSlots: regs.length,
          availableSlots: Math.max(0, ev.maxTeams - regs.length),
        };
      })
    );

    res.json(eventsWithStats);
  } catch (err: any) {
    console.error('Failed to list events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/events/:id', async (req: any, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Registrations
    const registrations = await db
      .select({
        id: eventRegistrations.id,
        teamId: eventRegistrations.teamId,
        teamNameSnapshot: eventRegistrations.teamNameSnapshot,
        registrationStatus: eventRegistrations.registrationStatus,
        slotNumber: eventRegistrations.slotNumber,
        registeredAt: eventRegistrations.registeredAt,
        registeredBy: eventRegistrations.registeredBy,
        teamLogo: teams.logoUrl,
      })
      .from(eventRegistrations)
      .leftJoin(teams, eq(eventRegistrations.teamId, teams.id))
      .where(eq(eventRegistrations.eventId, eventId))
      .orderBy(eventRegistrations.slotNumber);

    // Fetch lineups for registrations
    const registrationsWithLineups = await Promise.all(
      registrations.map(async (reg) => {
        const lineup = await db
          .select()
          .from(registrationPlayers)
          .where(eq(registrationPlayers.registrationId, reg.id));
        return { ...reg, lineup };
      })
    );

    const confirmedCount = registrations.filter((r) => r.registrationStatus === 'CONFIRMED').length;

    res.json({
      ...event,
      confirmedCount,
      availableSlots: Math.max(0, event.maxTeams - confirmedCount),
      registrations: registrationsWithLineups,
    });
  } catch (err: any) {
    console.error('Failed to get event:', err);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

app.post('/api/events', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      type,
      name,
      date,
      startTime,
      registrationOpenTime,
      registrationCloseTime,
      entryFee,
      maxTeams,
      playersPerTeam,
      substitutesAllowed,
      map,
      mode,
      prizeInfo,
      rules,
      coverUrl,
      status,
    } = req.body;

    if (!name || !date || !startTime) {
      return res.status(400).json({ error: 'Event name, date, and start time are required' });
    }

    const [newEvent] = await db
      .insert(events)
      .values({
        type: type || 'scrim',
        name: name.trim(),
        date: date.trim(),
        startTime: startTime.trim(),
        registrationOpenTime: registrationOpenTime || null,
        registrationCloseTime: registrationCloseTime || null,
        entryFee: parseInt(entryFee, 10) || 0,
        maxTeams: parseInt(maxTeams, 10) || 25,
        playersPerTeam: parseInt(playersPerTeam, 10) || 4,
        substitutesAllowed: substitutesAllowed !== undefined ? parseInt(substitutesAllowed, 10) : 1,
        map: map || 'Erangel',
        mode: mode || 'TPP Squad',
        prizeInfo: prizeInfo || null,
        rules: rules || 'Standard competitive esports rules apply.',
        coverUrl: coverUrl ? coverUrl.trim() : null,
        status: status || 'Registration Open',
      })
      .returning();

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Created ${type || 'Scrim'}: ${name}`,
      details: `New event created with ID ${newEvent.id}`,
      targetType: 'event',
    });

    res.json(newEvent);
  } catch (err: any) {
    console.error('Failed to create event:', err);
    res.status(500).json({ error: err.message || 'Failed to create event' });
  }
});

app.put('/api/events/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const {
      type,
      name,
      date,
      startTime,
      registrationOpenTime,
      registrationCloseTime,
      entryFee,
      maxTeams,
      playersPerTeam,
      substitutesAllowed,
      map,
      mode,
      prizeInfo,
      rules,
      coverUrl,
      roomId,
      roomPassword,
      status,
    } = req.body;

    const [updated] = await db
      .update(events)
      .set({
        type,
        name,
        date,
        startTime,
        registrationOpenTime,
        registrationCloseTime,
        entryFee: entryFee !== undefined ? parseInt(entryFee, 10) : undefined,
        maxTeams: maxTeams !== undefined ? parseInt(maxTeams, 10) : undefined,
        playersPerTeam: playersPerTeam !== undefined ? parseInt(playersPerTeam, 10) : undefined,
        substitutesAllowed: substitutesAllowed !== undefined ? parseInt(substitutesAllowed, 10) : undefined,
        map,
        mode,
        prizeInfo,
        rules,
        coverUrl: coverUrl !== undefined ? (coverUrl ? coverUrl.trim() : null) : undefined,
        roomId,
        roomPassword,
        status,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Updated Event: ${name}`,
      details: `Event ${eventId} details updated`,
      targetType: 'event',
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Update Room Credentials for an Event (Admin)
const updateRoomHandler = async (req: AuthRequest, res: express.Response) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { roomId, roomPassword } = req.body;

    const [updated] = await db
      .update(events)
      .set({
        roomId: roomId !== undefined ? (roomId ? roomId.trim() : null) : undefined,
        roomPassword: roomPassword !== undefined ? (roomPassword ? roomPassword.trim() : null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Updated Room Credentials: ${updated.name}`,
      details: `Room ID set to ${roomId || 'Cleared'}`,
      targetType: 'event',
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update room credentials:', err);
    res.status(500).json({ error: 'Failed to update room credentials' });
  }
};

app.post('/api/admin/events/:id/room', requireAuth, requireAdmin, updateRoomHandler);
app.put('/api/admin/events/:id/room', requireAuth, requireAdmin, updateRoomHandler);

// 1-Click Duplicate Event (Requirement #27)
app.post('/api/events/:id/duplicate', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const [original] = await db.select().from(events).where(eq(events.id, eventId));
    if (!original) return res.status(404).json({ error: 'Original event not found' });

    const newName = `${original.name} (Copy)`;
    const [duplicated] = await db
      .insert(events)
      .values({
        type: original.type,
        name: newName,
        date: original.date,
        startTime: original.startTime,
        registrationOpenTime: original.registrationOpenTime,
        registrationCloseTime: original.registrationCloseTime,
        entryFee: original.entryFee,
        maxTeams: original.maxTeams,
        playersPerTeam: original.playersPerTeam,
        substitutesAllowed: original.substitutesAllowed,
        map: original.map,
        mode: original.mode,
        prizeInfo: original.prizeInfo,
        rules: original.rules,
        coverUrl: original.coverUrl,
        status: 'Registration Open',
      })
      .returning();

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Duplicated Event ${original.name}`,
      details: `Created new event ID ${duplicated.id} from original ${eventId}`,
      targetType: 'event',
    });

    res.json(duplicated);
  } catch (err: any) {
    console.error('Failed to duplicate event:', err);
    res.status(500).json({ error: 'Failed to duplicate event' });
  }
});

// Delete or Archive event
app.delete('/api/events/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { archiveOnly } = req.query;

    if (archiveOnly === 'true') {
      await db.update(events).set({ status: 'Archived' }).where(eq(events.id, eventId));
      return res.json({ message: 'Event archived successfully' });
    }

    // Cascade remove registrations and lineups
    const regs = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
    for (const r of regs) {
      await db.delete(registrationPlayers).where(eq(registrationPlayers.registrationId, r.id));
      await db.delete(payments).where(eq(payments.registrationId, r.id));
    }
    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
    await db.delete(results).where(eq(results.eventId, eventId));
    await db.delete(events).where(eq(events.id, eventId));

    res.json({ message: 'Event and related records deleted' });
  } catch (err: any) {
    console.error('Failed to delete event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ==========================================
// 5. REPEAT REGISTRATION & LINEUP SELECTION (Requirements #13, #14, #15)
// ==========================================

// Get existing team lineup options for the event
app.get('/api/events/:id/team-lineup-options', requireAuth, async (req: AuthRequest, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const teamId = parseInt(req.query.teamId as string, 10);
    const userId = req.user!.dbUser!.id;
    const isAdmin = req.user!.dbUser!.role === 'admin' || req.user!.email === 'us0682888@gmail.com';

    if (isNaN(eventId) || isNaN(teamId)) {
      return res.status(400).json({ error: 'Valid eventId and teamId are required' });
    }

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.captainUserId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Only the team captain can register this team' });
    }

    // Check if team is already registered
    const [existingRegistration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.teamId, teamId)));

    // Fetch all active members currently belonging to this team!
    const activeMembers = await db
      .select({
        membershipId: teamMembers.id,
        role: teamMembers.role,
        player: players,
      })
      .from(teamMembers)
      .innerJoin(players, eq(teamMembers.playerId, players.id))
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.isActive, true)));

    res.json({
      team,
      alreadyRegistered: !!existingRegistration,
      existingRegistration: existingRegistration || null,
      members: activeMembers,
    });
  } catch (err: any) {
    console.error('Failed to get lineup options:', err);
    res.status(500).json({ error: 'Failed to fetch team lineup options' });
  }
});

// Register Team with selected lineup
app.post('/api/events/:id/register', requireAuth, async (req: AuthRequest, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { teamId, selectedPlayerIds } = req.body;
    const userId = req.user!.dbUser!.id;
    const isAdmin = req.user!.dbUser!.role === 'admin' || req.user!.email === 'us0682888@gmail.com';

    if (!teamId || !Array.isArray(selectedPlayerIds) || selectedPlayerIds.length === 0) {
      return res.status(400).json({ error: 'Team ID and selected players lineup are required' });
    }

    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.status === 'Registration Closed' || event.status === 'Completed' || event.status === 'Archived') {
      return res.status(400).json({ error: `Registration is currently ${event.status}` });
    }

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (team.captainUserId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Only the captain can register this team' });
    }

    // Prevent duplicate registration (Requirement #22)
    const [existing] = await db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.teamId, teamId)));

    if (existing) {
      return res.status(400).json({
        error: 'You are already registered for this event.',
        registrationId: existing.id,
        status: existing.registrationStatus,
      });
    }

    // Check slot limit
    const confirmedList = await db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.registrationStatus, 'CONFIRMED')));

    if (confirmedList.length >= event.maxTeams) {
      return res.status(400).json({ error: 'Maximum team slots reached for this event' });
    }

    // Check lineup size
    const requiredPlayers = event.playersPerTeam || 4;
    const maxAllowed = requiredPlayers + (event.substitutesAllowed || 1);
    if (selectedPlayerIds.length < requiredPlayers) {
      return res.status(400).json({
        error: `Please select at least ${requiredPlayers} players for this event lineup`,
      });
    }
    if (selectedPlayerIds.length > maxAllowed) {
      return res.status(400).json({
        error: `You cannot select more than ${maxAllowed} players (including substitutes)`,
      });
    }

    // Verify all selected players belong to this team
    const teamPlayerList = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.isActive, true)));
    const teamPlayerIdSet = new Set(teamPlayerList.map((m) => m.playerId));

    for (const pid of selectedPlayerIds) {
      if (!teamPlayerIdSet.has(pid)) {
        return res.status(400).json({ error: 'Selected player is not an active member of this team' });
      }
    }

    // Determine initial status: Free events are confirmed immediately; paid events require payment approval
    const isFree = event.entryFee === 0;
    const nextSlot = isFree ? confirmedList.length + 1 : null;
    const initialStatus = isFree ? 'CONFIRMED' : 'PENDING_PAYMENT';

    // Create registration record (Requirement #14: snapshots team name)
    const [registration] = await db
      .insert(eventRegistrations)
      .values({
        eventId,
        teamId,
        teamNameSnapshot: team.name,
        registrationStatus: initialStatus,
        slotNumber: nextSlot,
        registeredBy: userId,
      })
      .returning();

    // Create lineup records snapshotting player details (Requirement #15)
    for (let i = 0; i < selectedPlayerIds.length; i++) {
      const pid = selectedPlayerIds[i];
      const [playerRec] = await db.select().from(players).where(eq(players.id, pid));
      if (playerRec) {
        await db.insert(registrationPlayers).values({
          registrationId: registration.id,
          playerId: pid,
          pubgNameSnapshot: playerRec.pubgName,
          pubgUidSnapshot: playerRec.pubgUid,
          lineupRole: i < requiredPlayers ? 'starter' : 'substitute',
        });
      }
    }

    res.json({
      message: isFree ? 'Registration confirmed successfully!' : 'Registration created. Please proceed to payment.',
      registration,
      isFree,
    });
  } catch (err: any) {
    console.error('Failed to register team:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// ==========================================
// 6. PAYMENT METHODS & MANUAL PAYMENT VERIFICATION (Requirements #16 - #21)
// ==========================================

// Public active payment methods for checkout
app.get('/api/payment-methods', async (_req, res) => {
  try {
    const active = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(paymentMethods.id);
    res.json(active);
  } catch (err: any) {
    console.error('Failed to get payment methods:', err);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Admin payment methods management
app.get('/api/admin/payment-methods', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const all = await db.select().from(paymentMethods).orderBy(paymentMethods.id);
    res.json(all);
  } catch (err: any) {
    console.error('Failed to get admin payment methods:', err);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

app.post('/api/admin/payment-methods', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, accountName, accountNumber, bankName, iban, instructions, isActive } = req.body;
    if (!name || !accountName || !accountNumber) {
      return res.status(400).json({ error: 'Name, Account Name, and Account Number are required' });
    }

    const [created] = await db
      .insert(paymentMethods)
      .values({
        name,
        accountName,
        accountNumber,
        bankName: bankName || null,
        iban: iban || null,
        instructions: instructions || null,
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Added Payment Method: ${name}`,
      details: `Account: ${accountName} (${accountNumber})`,
      targetType: 'payment_method',
    });

    res.json(created);
  } catch (err: any) {
    console.error('Failed to add payment method:', err);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

app.put('/api/admin/payment-methods/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, accountName, accountNumber, bankName, iban, instructions, isActive } = req.body;

    const [updated] = await db
      .update(paymentMethods)
      .set({
        name,
        accountName,
        accountNumber,
        bankName,
        iban,
        instructions,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, id))
      .returning();

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Updated Payment Method: ${name}`,
      details: `Updated details for method ID ${id}`,
      targetType: 'payment_method',
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update payment method:', err);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

app.delete('/api/admin/payment-methods/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    res.json({ message: 'Payment method deleted' });
  } catch (err: any) {
    console.error('Failed to delete payment method:', err);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Submit Manual Payment (Requirement #18 & #19)
app.post('/api/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { registrationId, paymentMethodId, transactionId, screenshotUrl } = req.body;
    const userId = req.user!.dbUser!.id;
    const isAdmin = req.user!.dbUser!.role === 'admin' || req.user!.email === 'us0682888@gmail.com';

    if (!registrationId || !screenshotUrl) {
      return res.status(400).json({ error: 'Registration ID and payment screenshot are required' });
    }

    const [reg] = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, registrationId));
    if (!reg) return res.status(404).json({ error: 'Registration record not found' });

    if (reg.registeredBy !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Only the team registrant or admin can submit payment' });
    }

    // Check if there is already an existing pending payment for this registration (Requirement #22)
    const [existingPending] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.registrationId, registrationId), eq(payments.status, 'PENDING')));

    if (existingPending) {
      return res.status(400).json({ error: 'A payment submission is already pending review for this registration.' });
    }

    const [event] = await db.select().from(events).where(eq(events.id, reg.eventId));
    const [team] = await db.select().from(teams).where(eq(teams.id, reg.teamId));

    // Snapshot payment method (Requirement #39: old payments must not change when admin modifies payment settings!)
    let paymentMethodSnapshot = 'Manual Payment';
    if (paymentMethodId) {
      const [pm] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, paymentMethodId));
      if (pm) {
        paymentMethodSnapshot = `${pm.name} - ${pm.accountName} (${pm.accountNumber}${pm.bankName ? ` - ${pm.bankName}` : ''})`;
      }
    }

    const [paymentRecord] = await db
      .insert(payments)
      .values({
        registrationId,
        teamId: reg.teamId,
        teamNameSnapshot: team?.name || reg.teamNameSnapshot,
        eventId: reg.eventId,
        eventNameSnapshot: event?.name || 'Scrim/Tournament',
        amount: event?.entryFee || 0,
        paymentMethodId: paymentMethodId || null,
        paymentMethodSnapshot,
        transactionId: transactionId ? transactionId.trim() : null,
        screenshotUrl,
        status: 'PENDING',
        submittedBy: userId,
      })
      .returning();

    // Update registration status to PENDING_PAYMENT
    await db
      .update(eventRegistrations)
      .set({ registrationStatus: 'PENDING_PAYMENT' })
      .where(eq(eventRegistrations.id, registrationId));

    res.json({
      message: 'Payment submitted successfully. Awaiting admin manual verification.',
      payment: paymentRecord,
    });
  } catch (err: any) {
    console.error('Failed to submit payment:', err);
    res.status(500).json({ error: err.message || 'Failed to submit payment' });
  }
});

// Admin payments list with filters (Requirement #20)
app.get('/api/admin/payments', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, eventId, teamName } = req.query;

    let query = db
      .select({
        payment: payments,
        registration: eventRegistrations,
        team: teams,
        event: events,
        submitter: users,
      })
      .from(payments)
      .innerJoin(eventRegistrations, eq(payments.registrationId, eventRegistrations.id))
      .leftJoin(teams, eq(payments.teamId, teams.id))
      .leftJoin(events, eq(payments.eventId, events.id))
      .leftJoin(users, eq(payments.submittedBy, users.id))
      .orderBy(desc(payments.createdAt));

    const all = await query;

    let filtered = all;
    if (status && status !== 'all') {
      filtered = filtered.filter((p) => p.payment.status === status);
    }
    if (eventId && !isNaN(parseInt(eventId as string, 10))) {
      filtered = filtered.filter((p) => p.payment.eventId === parseInt(eventId as string, 10));
    }
    if (teamName && typeof teamName === 'string') {
      const q = teamName.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.payment.teamNameSnapshot.toLowerCase().includes(q) ||
          (p.payment.transactionId && p.payment.transactionId.toLowerCase().includes(q))
      );
    }

    res.json(
      filtered.map((item) => ({
        ...item.payment,
        teamName: item.team?.name || item.payment.teamNameSnapshot,
        teamLogo: item.team?.logoUrl,
        eventName: item.event?.name || item.payment.eventNameSnapshot,
        submitterName: item.submitter?.name || 'Unknown',
        submitterEmail: item.submitter?.email,
        slotNumber: item.registration?.slotNumber,
      }))
    );
  } catch (err: any) {
    console.error('Failed to list payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Admin Approve Payment (Requirement #20 & #21)
app.post('/api/admin/payments/:id/approve', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const userId = req.user!.dbUser!.id;

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    // Calculate next available slot for the event
    const confirmedRegs = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(eq(eventRegistrations.eventId, payment.eventId), eq(eventRegistrations.registrationStatus, 'CONFIRMED'))
      );

    const assignedSlot = confirmedRegs.length + 1;

    // Approve payment
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    // Confirm registration & assign slot
    await db
      .update(eventRegistrations)
      .set({
        registrationStatus: 'CONFIRMED',
        slotNumber: assignedSlot,
      })
      .where(eq(eventRegistrations.id, payment.registrationId));

    // Audit log
    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Approved Payment for ${payment.teamNameSnapshot}`,
      details: `Payment ID ${paymentId} approved for event ID ${payment.eventId}. Slot assigned: ${assignedSlot}`,
      targetType: 'payment',
    });

    res.json({
      message: 'Payment approved and team registration confirmed.',
      payment: updatedPayment,
      slotNumber: assignedSlot,
    });
  } catch (err: any) {
    console.error('Failed to approve payment:', err);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// Admin Reject Payment (Requirement #20 & #21)
app.post('/api/admin/payments/:id/reject', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const { rejectionReason } = req.body;
    const userId = req.user!.dbUser!.id;

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: 'REJECTED',
        rejectionReason: rejectionReason ? rejectionReason.trim() : 'Invalid screenshot or transaction ID',
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    // Registration status becomes PAYMENT_REJECTED
    await db
      .update(eventRegistrations)
      .set({
        registrationStatus: 'PAYMENT_REJECTED',
      })
      .where(eq(eventRegistrations.id, payment.registrationId));

    // Audit log
    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Rejected Payment for ${payment.teamNameSnapshot}`,
      details: `Payment ID ${paymentId} rejected. Reason: ${rejectionReason || 'No reason provided'}`,
      targetType: 'payment',
    });

    res.json({
      message: 'Payment rejected.',
      payment: updatedPayment,
    });
  } catch (err: any) {
    console.error('Failed to reject payment:', err);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

// Admin Override Registration (Requirement #44)
app.put('/api/admin/registrations/:id/override', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const regId = parseInt(req.params.id, 10);
    const { registrationStatus, slotNumber } = req.body;

    const [updated] = await db
      .update(eventRegistrations)
      .set({
        registrationStatus,
        slotNumber: slotNumber !== undefined ? parseInt(slotNumber, 10) : undefined,
      })
      .where(eq(eventRegistrations.id, regId))
      .returning();

    await db.insert(auditLogs).values({
      adminName: req.user?.name || 'Admin',
      action: `Manual Override for Registration ${regId}`,
      details: `Status: ${registrationStatus}, Slot: ${slotNumber}`,
      targetType: 'registration',
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to override registration:', err);
    res.status(500).json({ error: 'Failed to override registration' });
  }
});

// ==========================================
// 7. RESULTS SYSTEM (Requirement #30)
// ==========================================
app.get('/api/events/:id/results', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const eventResults = await db
      .select({
        result: results,
        teamLogo: teams.logoUrl,
      })
      .from(results)
      .leftJoin(teams, eq(results.teamId, teams.id))
      .where(eq(results.eventId, eventId))
      .orderBy(results.position);

    res.json(eventResults.map((r) => ({ ...r.result, logoUrl: r.teamLogo })));
  } catch (err: any) {
    console.error('Failed to get results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

app.post('/api/events/:id/results', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { teamId, position, placementPoints, kills, notes } = req.body;

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const pPoints = parseInt(placementPoints, 10) || 0;
    const kPoints = parseInt(kills, 10) || 0;
    const total = pPoints + kPoints;

    // Check existing
    const [existing] = await db
      .select()
      .from(results)
      .where(and(eq(results.eventId, eventId), eq(results.teamId, teamId)));

    let saved;
    if (existing) {
      [saved] = await db
        .update(results)
        .set({
          position: parseInt(position, 10),
          placementPoints: pPoints,
          kills: kPoints,
          totalPoints: total,
          notes,
        })
        .where(eq(results.id, existing.id))
        .returning();
    } else {
      [saved] = await db
        .insert(results)
        .values({
          eventId,
          teamId,
          teamNameSnapshot: team.name,
          position: parseInt(position, 10),
          placementPoints: pPoints,
          kills: kPoints,
          totalPoints: total,
          notes,
        })
        .returning();
    }

    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save result:', err);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// Admin stats summary for Dashboard (Requirement #26)
app.get('/api/admin/dashboard', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(teams);
    const [playerCount] = await db.select({ count: sql<number>`count(*)` }).from(players);
    const [scrimCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.type, 'scrim'));
    const [tournamentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.type, 'tournament'));
    const [pendingPaymentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.status, 'PENDING'));
    const [confirmedRegCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.registrationStatus, 'CONFIRMED'));

    const recentPendingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'PENDING'))
      .orderBy(desc(payments.createdAt))
      .limit(6);

    const upcomingEvents = await db
      .select()
      .from(events)
      .where(eq(events.status, 'Registration Open'))
      .orderBy(desc(events.id))
      .limit(6);

    res.json({
      stats: {
        totalTeams: Number(teamCount?.count || 0),
        totalPlayers: Number(playerCount?.count || 0),
        totalScrims: Number(scrimCount?.count || 0),
        totalTournaments: Number(tournamentCount?.count || 0),
        pendingPayments: Number(pendingPaymentCount?.count || 0),
        confirmedRegistrations: Number(confirmedRegCount?.count || 0),
      },
      recentPendingPayments,
      upcomingEvents,
    });
  } catch (err: any) {
    console.error('Failed to get dashboard stats:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Explicit 404 for unhandled API endpoints so they never return SPA HTML
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Vite Middleware for development & Static SPA for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PUBG Mobile Esports Portal running on port ${PORT}`);
  });
}

startServer();
