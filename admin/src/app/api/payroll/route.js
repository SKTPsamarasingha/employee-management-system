import { NextResponse } from 'next/server';
import { dbConnect, Payroll, Employee, Attendance, LeaveRequest } from '@/lib/db';
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
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = {};
    if (month) query['payPeriod.month'] = parseInt(month);
    if (year) query['payPeriod.year'] = parseInt(year);

    const records = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId position')
      .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Fetch admin payroll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate payroll records for a given month and year
export async function POST(req) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { month, year } = await req.json();

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required.' }, { status: 400 });
    }

    await dbConnect();

    // Find all active employees
    const employees = await Employee.find({ isActive: true }).populate('department');
    if (employees.length === 0) {
      return NextResponse.json({ error: 'No active employees found.' }, { status: 400 });
    }

    // Determine period boundaries
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // Last day of month

    let generatedCount = 0;
    let skippedCount = 0;

    for (const emp of employees) {
      // Check if payroll already exists for this employee and period
      const existing = await Payroll.findOne({
        employee: emp._id,
        'payPeriod.month': month,
        'payPeriod.year': year,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // 1. Calculate Attendance Statistics for the month
      const attendanceRecords = await Attendance.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      });

      let daysPresent = 0;
      let daysAbsent = 0;
      let daysOnLeave = 0;
      let totalOvertimeHours = 0;

      attendanceRecords.forEach((record) => {
        if (['present', 'late', 'half-day'].includes(record.status)) {
          daysPresent += record.status === 'half-day' ? 0.5 : 1;
        } else if (record.status === 'absent') {
          daysAbsent++;
        } else if (record.status === 'on-leave') {
          daysOnLeave++;
        }
        totalOvertimeHours += record.overtimeHours || 0;
      });

      // Get count of total working days in that month (approximate to 22 standard work days or calculate)
      // We will count business days (Mon-Fri) in this month
      let totalWorkingDays = 0;
      let dateCursor = new Date(startDate);
      while (dateCursor <= endDate) {
        const dayOfWeek = dateCursor.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Mon-Fri
          totalWorkingDays++;
        }
        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      // If they check in less than standard, calculate absent days as: working days - present - leave
      // If we don't have full records, assume the remaining are absent or unmarked
      const markedDays = daysPresent + daysOnLeave;
      if (markedDays < totalWorkingDays) {
        daysAbsent = Math.max(0, totalWorkingDays - markedDays);
      }

      // 2. Base salary & elements
      const baseSalary = emp.salary.baseSalary;
      const allowances = Math.round(baseSalary * 0.1 * 100) / 100; // 10% allowance
      
      // Overtime rate: base hourly rate * 1.5
      // Assuming 176 standard working hours per month (22 days * 8 hours)
      const hourlyRate = baseSalary / 176;
      const overtimePay = Math.round(totalOvertimeHours * hourlyRate * 1.5 * 100) / 100;
      
      const bonus = 0; // Default, can be updated later

      // Gross Pay = base + allowances + overtime + bonus
      const grossPay = baseSalary + allowances + overtimePay + bonus;

      // 3. Deductions
      const tax = Math.round(grossPay * 0.12 * 100) / 100; // 12% income tax
      const pf = Math.round(baseSalary * 0.05 * 100) / 100; // 5% PF
      const insurance = 120; // flat rate insurance
      const otherDeductions = 0;

      // Create new payroll record
      const payroll = new Payroll({
        employee: emp._id,
        payPeriod: {
          month,
          year,
          startDate,
          endDate,
        },
        employeeSnapshot: {
          name: `${emp.firstName} ${emp.lastName}`,
          employeeId: emp.employeeId,
          department: emp.department ? emp.department.name : 'N/A',
          position: emp.position,
        },
        earnings: {
          baseSalary,
          allowances,
          overtimePay,
          bonus,
        },
        deductions: {
          tax,
          providentFund: pf,
          insurance,
          otherDeductions,
        },
        paymentStatus: 'pending',
        attendanceSummary: {
          totalWorkingDays,
          daysPresent,
          daysAbsent,
          daysOnLeave,
          totalOvertimeHours,
        },
        generatedBy: decoded.id,
        remarks: `Generated payroll for ${month}/${year}.`,
      });

      await payroll.save(); // pre-save calculates totals & netPay
      generatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Payroll generation completed. Generated: ${generatedCount}, Skipped (already existed): ${skippedCount}.`
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
