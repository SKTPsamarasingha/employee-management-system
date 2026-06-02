import { NextResponse } from 'next/server';
import { dbConnect, Employee } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'employee') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await dbConnect();
    const employee = await Employee.findById(decoded.id).populate('department');

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        dateOfBirth: employee.dateOfBirth,
        gender: employee.gender,
        address: employee.address,
        position: employee.position,
        department: employee.department ? employee.department.name : 'N/A',
        role: employee.role,
        salary: employee.salary,
        bankDetails: employee.bankDetails,
        leaveBalances: employee.leaveBalances,
        joinDate: employee.joinDate,
      },
    });
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
