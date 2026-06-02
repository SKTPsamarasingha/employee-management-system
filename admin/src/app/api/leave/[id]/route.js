import { NextResponse } from 'next/server';
import { dbConnect, LeaveRequest, Employee } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { id } = await params;
    const { status, rejectionReason } = await req.json();

    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return NextResponse.json({ error: 'Invalid status. Must be approved or rejected.' }, { status: 400 });
    }

    await dbConnect();

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Leave request has already been processed.' }, { status: 400 });
    }

    if (status === 'approved') {
      // Deduct employee leave balance
      const employee = await Employee.findById(request.employee);
      if (!employee) {
        return NextResponse.json({ error: 'Employee associated with this request not found' }, { status: 404 });
      }

      const leaveType = request.leaveType;
      // Deduct balance for annual, sick, casual
      if (['annual', 'sick', 'casual'].includes(leaveType)) {
        if (!employee.leaveBalances[leaveType]) {
          employee.leaveBalances[leaveType] = { total: 10, used: 0 };
        }
        
        const balance = employee.leaveBalances[leaveType];
        if (balance.total - balance.used < request.totalDays) {
          return NextResponse.json({
            error: `Employee has insufficient leave balance. Remaining: ${balance.total - balance.used} days, requested: ${request.totalDays} days.`
          }, { status: 400 });
        }

        // Deduct
        employee.leaveBalances[leaveType].used += request.totalDays;
        
        // Mark employee leaveBalances field as modified for Mongoose to save nested changes
        employee.markModified('leaveBalances');
        await employee.save();
      }

      request.status = 'approved';
      request.approvedBy = decoded.id;
      request.approvalDate = new Date();
    } else {
      // rejected
      request.status = 'rejected';
      request.rejectionReason = rejectionReason || 'No reason provided';
      request.approvedBy = decoded.id;
      request.approvalDate = new Date();
    }

    await request.save();

    return NextResponse.json({ success: true, request, message: `Leave request ${status} successfully.` });
  } catch (error) {
    console.error('Process leave request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
