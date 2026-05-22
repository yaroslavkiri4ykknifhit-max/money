import { NextResponse } from 'next/server';
import { getDoc } from '@/lib/google';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Invites'];
    
    if (!sheet) {
      return NextResponse.json({ error: 'Invites sheet not found in Google Sheets' }, { status: 500 });
    }

    const rows = await sheet.getRows();
    
    // Find the code
    const inviteRow = rows.find(row => row.get('code') === code);

    if (!inviteRow) {
      return NextResponse.json({ error: 'Invalid or used code' }, { status: 401 });
    }

    const isUsed = inviteRow.get('is_used');
    
    // Check if used (handles string boolean, checkbox TRUE, or actual boolean)
    if (isUsed === 'TRUE' || isUsed === 'true' || isUsed === true) {
      return NextResponse.json({ error: 'Invalid or used code' }, { status: 401 });
    }

    // Mark as used
    inviteRow.set('is_used', 'TRUE');
    await inviteRow.save();

    // Generate JWT
    const token = await signToken({ code, role: 'student' });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
