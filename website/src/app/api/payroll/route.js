import { NextResponse } from 'next/server';
import { dbConnect, Payroll } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'employee') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await dbConnect();
    const records = await Payroll.find({ employee: decoded.id }).sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Fetch payroll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
