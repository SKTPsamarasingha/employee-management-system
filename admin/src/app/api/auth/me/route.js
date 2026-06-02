import { NextResponse } from 'next/server';
import { dbConnect, AdminUser } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await dbConnect();
    const admin = await AdminUser.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin session verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
