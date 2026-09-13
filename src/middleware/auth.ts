import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name: string;
    dbUser?: typeof users.$inferSelect;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token header' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  // Cryptographically verify the Firebase ID token using Firebase Admin SDK
  try {
    const decodedToken: DecodedIdToken = await adminAuth.verifyIdToken(token);
    const email = (decodedToken.email || `${decodedToken.uid}@alphapredictorx.esports`).toLowerCase();
    const name = decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Player');
    
    // Extract phone number if user registered with phone or phone credential
    const phoneFromSyntheticEmail = (email.endsWith('@alphapredictorx.esports') || email.endsWith('@alphapredictor.esports'))
      ? email.split('@')[0].replace(/^p/, '+')
      : null;
    const phone = decodedToken.phone_number || phoneFromSyntheticEmail || null;

    let [dbUser] = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
    const isMasterAdmin = email === 'us0682888@gmail.com';

    if (!dbUser) {
      const [created] = await db.insert(users).values({
        uid: decodedToken.uid,
        email,
        phone: phone || null,
        name,
        role: isMasterAdmin ? 'admin' : 'player',
      }).returning();
      dbUser = created;
    } else {
      // Update phone or role if needed
      const updates: any = {};
      if (isMasterAdmin && dbUser.role !== 'admin') {
        updates.role = 'admin';
      }
      if (phone && !dbUser.phone) {
        updates.phone = phone;
      }
      if (Object.keys(updates).length > 0) {
        const [updated] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, dbUser.id))
          .returning();
        dbUser = updated;
      }
    }

    req.user = {
      uid: decodedToken.uid,
      email,
      name: dbUser.name || name,
      dbUser,
    };
    next();
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', error?.message || error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication session' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.dbUser) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }
  if (req.user.dbUser.role !== 'admin' && req.user.email !== 'us0682888@gmail.com') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
  }
  next();
};
