// This module should only be used on the server
if (typeof window !== 'undefined') {
  throw new Error('This module can only be imported on the server side');
}

import bcrypt from 'bcryptjs';
import { queryOne } from './pg';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist';
  doctor_id?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function loginUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await queryOne<any>(
      'SELECT id, email, role, doctor_id, password_hash, active FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      return null;
    }

    if (!user.active) {
      return null;
    }

    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return null;
    }

    // Update last login
    await queryOne(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1 RETURNING id',
      [user.id]
    );

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      doctor_id: user.doctor_id,
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const user = await queryOne<any>(
      'SELECT id, email, role, doctor_id, active FROM users WHERE id = $1',
      [id]
    );

    if (!user || !user.active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      doctor_id: user.doctor_id,
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
