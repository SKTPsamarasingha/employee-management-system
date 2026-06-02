import { NextResponse } from 'next/server';
import { dbConnect, Attendance } from '@/lib/db';
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
    const records = await Attendance.find({ employee: decoded.id }).sort({ date: -1 }).limit(100);

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'employee') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { action, notes } = await req.json(); // action can be 'checkIn' or 'checkOut'

    if (!action || (action !== 'checkIn' && action !== 'checkOut')) {
      return NextResponse.json({ error: 'Invalid action. Must be checkIn or checkOut.' }, { status: 400 });
    }

    await dbConnect();

    // Get today at midnight UTC to represent the date uniquely per day
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    let record = await Attendance.findOne({ employee: decoded.id, date: today });

    if (action === 'checkIn') {
      if (record && record.checkIn) {
        return NextResponse.json({ error: 'Already clocked in for today.' }, { status: 400 });
      }

      const checkInTime = new Date();
      // Determine status (e.g. check if late - standard checkIn before 9:15 AM)
      let status = 'present';
      const hours = checkInTime.getHours();
      const mins = checkInTime.getMinutes();
      if (hours > 9 || (hours === 9 && mins > 15)) {
        status = 'late';
      }

      if (!record) {
        record = new Attendance({
          employee: decoded.id,
          date: today,
          checkIn: checkInTime,
          status,
          notes: notes || '',
        });
      } else {
        record.checkIn = checkInTime;
        record.status = status;
        if (notes) record.notes = notes;
      }

      await record.save();
      return NextResponse.json({ success: true, record, message: 'Clocked in successfully.' });
    } else {
      // checkOut
      if (!record || !record.checkIn) {
        return NextResponse.json({ error: 'You must check in first before checking out.' }, { status: 400 });
      }

      if (record.checkOut) {
        return NextResponse.json({ error: 'Already clocked out for today.' }, { status: 400 });
      }

      record.checkOut = new Date();
      if (notes) record.notes = notes;

      await record.save(); // The pre-save hook will automatically calculate workingHours and overtimeHours
      return NextResponse.json({ success: true, record, message: 'Clocked out successfully.' });
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
