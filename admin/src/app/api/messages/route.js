import { NextResponse } from 'next/server';
import { dbConnect, ContactMessage } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    await dbConnect();

    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Fetch contact messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
