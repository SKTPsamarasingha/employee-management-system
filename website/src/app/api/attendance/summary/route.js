import { NextResponse } from 'next/server';
import { dbConnect, Attendance, LeaveRequest } from '@/lib/db';
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

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

    // Fetch records for the current month
    const records = await Attendance.find({
      employee: decoded.id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Calculate summaries
    let totalWorkingHours = 0;
    let totalOvertimeHours = 0;
    let daysPresent = 0;
    let daysAbsent = 0;
    let daysLate = 0;
    let halfDays = 0;

    records.forEach((r) => {
      totalWorkingHours += r.workingHours || 0;
      totalOvertimeHours += r.overtimeHours || 0;
      if (r.status === 'present') daysPresent++;
      else if (r.status === 'absent') daysAbsent++;
      else if (r.status === 'late') {
        daysPresent++;
        daysLate++;
      } else if (r.status === 'half-day') {
        daysPresent += 0.5;
        halfDays++;
      }
    });

    // Fetch approved leaves in this month
    const approvedLeaves = await LeaveRequest.find({
      employee: decoded.id,
      status: 'approved',
      startDate: { $lte: endOfMonth },
      endDate: { $gte: startOfMonth },
    });

    let leaveDays = 0;
    approvedLeaves.forEach((l) => {
      // Basic count of days
      leaveDays += l.totalDays || 0;
    });

    // Format output
    return NextResponse.json({
      success: true,
      summary: {
        totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        daysPresent,
        daysAbsent,
        daysLate,
        halfDays,
        leaveDays,
        totalRecords: records.length,
      },
    });
  } catch (error) {
    console.error('Fetch attendance summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
