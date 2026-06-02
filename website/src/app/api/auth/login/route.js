import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect, Employee } from '@/lib/db';
import { signJWT } from '@/lib/auth';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const employee = await Employee.findOne({ email }).populate('department');
    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Sign JWT
    const token = await signJWT({
      id: employee._id.toString(),
      email: employee.email,
      role: 'employee',
      employeeId: employee.employeeId,
      fullName: `${employee.firstName} ${employee.lastName}`,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: employee._id.toString(),
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        department: employee.department ? employee.department.name : 'N/A',
        role: employee.role,
      },
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

