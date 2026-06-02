import { NextResponse } from 'next/server';
import { dbConnect, Employee, Department, LeaveRequest, Payroll, Attendance } from '@/lib/db';
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

    // 1. Total Employees
    const totalEmployees = await Employee.countDocuments({ isActive: true });

    // 2. Total Departments
    const totalDepartments = await Department.countDocuments({ isActive: true });

    // 3. Pending Leave Requests Count
    const pendingLeavesCount = await LeaveRequest.countDocuments({ status: 'pending' });

    // 4. Monthly Payroll Expenses (Total of last month or current month)
    const now = new Date();
    // Sum of netPay for payrolls generated in the current or previous month
    const payrollExpenseObj = await Payroll.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$netPay' } } },
    ]);
    const totalPayrollPaid = payrollExpenseObj.length > 0 ? payrollExpenseObj[0].total : 0;

    // 5. Today's Attendance Rate
    const startOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const endOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
    const checkedInToday = await Attendance.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
      status: { $in: ['present', 'late', 'half-day'] },
    });
    const attendanceRate = totalEmployees > 0 ? Math.round((checkedInToday / totalEmployees) * 100) : 0;

    // 6. Department employee distribution for visual charts
    const departmentDistribution = await Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'deptInfo',
        },
      },
      { $unwind: '$deptInfo' },
      {
        $project: {
          _id: 1,
          name: '$deptInfo.name',
          count: 1,
        },
      },
    ]);

    // 7. Recent Leave Requests (latest 5)
    const recentLeaves = await LeaveRequest.find()
      .populate('employee', 'firstName lastName employeeId')
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. Recent Attendance Clock-ins (latest 5)
    const recentAttendance = await Attendance.find({ checkIn: { $ne: null } })
      .populate('employee', 'firstName lastName employeeId')
      .sort({ checkIn: -1 })
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees,
        totalDepartments,
        pendingLeavesCount,
        totalPayrollPaid,
        attendanceRate,
        departmentDistribution,
        recentLeaves,
        recentAttendance,
      },
    });
  } catch (error) {
    console.error('Dashboard stats fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
