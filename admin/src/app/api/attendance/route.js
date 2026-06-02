import { NextResponse } from 'next/server';
import { dbConnect, Attendance, Employee } from '@/lib/db';
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

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // Expect YYYY-MM-DD
    
    let targetDate = new Date();
    if (dateStr) {
      targetDate = new Date(dateStr);
    }
    
    // Set to UTC midnight
    const startOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
    const endOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

    // Fetch all active employees
    const employees = await Employee.find({ isActive: true }).populate('department');

    // Fetch attendance records for the date
    const records = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // Combine employees list with their attendance status (even if they have no record for the day, which means 'absent' or 'not marked')
    const attendanceData = employees.map((emp) => {
      const record = records.find((r) => r.employee.toString() === emp._id.toString());
      return {
        employee: {
          id: emp._id,
          employeeId: emp.employeeId,
          firstName: emp.firstName,
          lastName: emp.lastName,
          department: emp.department ? emp.department.name : 'N/A',
          position: emp.position,
        },
        record: record || null,
        status: record ? record.status : 'absent', // Default to absent if no record exists for a work day
      };
    });

    return NextResponse.json({ success: true, attendance: attendanceData });
  } catch (error) {
    console.error('Fetch admin attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Modify an attendance record manually (e.g. override checkIn/checkOut or mark status manually)
export async function PUT(req) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { employeeId, dateStr, status, checkIn, checkOut, notes } = await req.json();

    if (!employeeId || !dateStr || !status) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    await dbConnect();

    const targetDate = new Date(dateStr);
    const date = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));

    let record = await Attendance.findOne({ employee: employeeId, date });

    if (!record) {
      record = new Attendance({
        employee: employeeId,
        date,
      });
    }

    record.status = status;
    record.notes = notes || '';

    if (checkIn) record.checkIn = new Date(checkIn);
    else record.checkIn = undefined;

    if (checkOut) record.checkOut = new Date(checkOut);
    else record.checkOut = undefined;

    await record.save(); // pre-save calculates working hours

    return NextResponse.json({ success: true, record, message: 'Attendance record updated successfully.' });
  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
