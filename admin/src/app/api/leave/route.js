import { NextResponse } from 'next/server';
import { dbConnect, LeaveRequest } from '@/lib/db';
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
    const requests = await LeaveRequest.find()
      .populate('employee', 'firstName lastName employeeId position')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Fetch admin leaves error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
