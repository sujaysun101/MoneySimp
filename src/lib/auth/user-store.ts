import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserPermissions {
  canAccessAI: boolean;
  canManageBudgets: boolean;
  canExportReports: boolean;
  canManageCommunity: boolean;
  status: 'active' | 'suspended';
}

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  permissions: UserPermissions;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  uid: string;
  username: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  permissions: UserPermissions;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSION_SECRET = process.env.AUTH_SECRET || 'moneysimp-secure-auth-secret-key-2025';

export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canAccessAI: true,
  canManageBudgets: true,
  canExportReports: true,
  canManageCommunity: true,
  status: 'active',
};

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canAccessAI: true,
  canManageBudgets: true,
  canExportReports: false,
  canManageCommunity: true,
  status: 'active',
};

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = hashPassword('123', adminSalt);

    const defaultUsers: UserRecord[] = [
      {
        id: 'user_admin_001',
        username: 'admin',
        email: 'admin@moneysimp.com',
        displayName: 'Administrator',
        role: 'admin',
        permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
        salt: adminSalt,
        passwordHash: adminHash,
        createdAt: new Date().toISOString(),
      },
    ];

    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
  }
}

function readUsers(): UserRecord[] {
  ensureDataDirectory();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const users: UserRecord[] = JSON.parse(raw);

    let modified = false;

    // Guarantee that admin with 'admin' / '123' exists
    const adminIndex = users.findIndex(u => u.username.toLowerCase() === 'admin');
    if (adminIndex === -1) {
      const adminSalt = crypto.randomBytes(16).toString('hex');
      const adminHash = hashPassword('123', adminSalt);
      users.unshift({
        id: 'user_admin_001',
        username: 'admin',
        email: 'admin@moneysimp.com',
        displayName: 'Administrator',
        role: 'admin',
        permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
        salt: adminSalt,
        passwordHash: adminHash,
        createdAt: new Date().toISOString(),
      });
      modified = true;
    } else {
      // Ensure admin has admin role & permissions
      if (users[adminIndex].role !== 'admin' || !users[adminIndex].permissions) {
        users[adminIndex].role = 'admin';
        users[adminIndex].permissions = { ...DEFAULT_ADMIN_PERMISSIONS };
        modified = true;
      }
    }

    // Ensure all users have valid permissions
    for (const u of users) {
      if (!u.permissions) {
        u.permissions = u.role === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_USER_PERMISSIONS };
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    }

    return users;
  } catch (err) {
    console.error('[UserStore] Error reading users file:', err);
    return [];
  }
}

function writeUsers(users: UserRecord[]): void {
  ensureDataDirectory();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    uid: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    permissions: user.permissions || (user.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS),
    createdAt: user.createdAt,
  };
}

export function getAllUsers(): PublicUser[] {
  const users = readUsers();
  return users.map(toPublicUser);
}

export function findUserByIdentifier(identifier: string): UserRecord | null {
  const users = readUsers();
  const lower = identifier.trim().toLowerCase();
  return users.find(u => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower) || null;
}

export function findUserById(id: string): UserRecord | null {
  const users = readUsers();
  return users.find(u => u.id === id) || null;
}

export function verifyUserPassword(user: UserRecord, candidatePassword: string): boolean {
  const candidateHash = hashPassword(candidatePassword, user.salt);
  return candidateHash === user.passwordHash;
}

export function createUser(data: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'user';
  permissions?: Partial<UserPermissions>;
}): { user?: PublicUser; error?: string } {
  const users = readUsers();
  const usernameClean = data.username.trim().toLowerCase();
  const emailClean = data.email.trim().toLowerCase();

  if (users.some(u => u.username.toLowerCase() === usernameClean)) {
    return { error: 'Username is already taken' };
  }

  if (users.some(u => u.email.toLowerCase() === emailClean)) {
    return { error: 'Email is already registered' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(data.password, salt);
  const role = data.role || 'user';

  const defaultPerms = role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS;
  const permissions: UserPermissions = {
    ...defaultPerms,
    ...(data.permissions || {}),
  };

  const newUser: UserRecord = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: data.username.trim(),
    email: emailClean,
    displayName: data.displayName?.trim() || data.username.trim(),
    role,
    permissions,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  return { user: toPublicUser(newUser) };
}

export function updateUser(
  id: string,
  updates: {
    role?: 'admin' | 'user';
    displayName?: string;
    permissions?: Partial<UserPermissions>;
  }
): { user?: PublicUser; error?: string } {
  const users = readUsers();
  const target = users.find(u => u.id === id);

  if (!target) {
    return { error: 'User not found' };
  }

  if (updates.role !== undefined) {
    target.role = updates.role;
  }

  if (updates.displayName !== undefined) {
    target.displayName = updates.displayName.trim();
  }

  if (updates.permissions) {
    target.permissions = {
      ...(target.permissions || DEFAULT_USER_PERMISSIONS),
      ...updates.permissions,
    };
  }

  writeUsers(users);
  return { user: toPublicUser(target) };
}

export function deleteUser(id: string): { success: boolean; error?: string } {
  const users = readUsers();
  const targetIndex = users.findIndex(u => u.id === id);

  if (targetIndex === -1) {
    return { success: false, error: 'User not found' };
  }

  if (users[targetIndex].username.toLowerCase() === 'admin') {
    return { success: false, error: 'Cannot delete the primary root admin account' };
  }

  users.splice(targetIndex, 1);
  writeUsers(users);
  return { success: true };
}

// Signed session token
export function createSessionToken(user: PublicUser): string {
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    displayName: user.displayName,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): PublicUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;

    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return null;

    return {
      id: payload.sub,
      uid: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || (payload.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS),
      displayName: payload.displayName,
      createdAt: '',
    };
  } catch {
    return null;
  }
}
