import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me_in_production';

export async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
