import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect, Employee, Department } from '@/lib/db';
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
    const departmentId = searchParams.get('department');
    const search = searchParams.get('search');

    let query = { isActive: true };

    if (departmentId) {
      query.department = departmentId;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeId: searchRegex },
        { email: searchRegex },
      ];
    }

    const employees = await Employee.find(query)
      .populate('department')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const data = await req.json();
    const {
      employeeId,
      firstName,
      lastName,
      email,
      password,
      phone,
      department: departmentId,
      position,
      role,
      baseSalary,
      currency,
      payFrequency,
      bankName,
      accountNumber,
      ifscCode,
    } = data;

    if (!employeeId || !firstName || !lastName || !email || !password || !phone || !departmentId || !position || !baseSalary) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    await dbConnect();

    // Check if employeeId or email already exists
    const existingId = await Employee.findOne({ employeeId });
    if (existingId) {
      return NextResponse.json({ error: 'Employee ID already exists' }, { status: 400 });
    }

    const existingEmail = await Employee.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email address already exists' }, { status: 400 });
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = new Employee({
      employeeId: employeeId.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone.trim(),
      department: departmentId,
      position: position.trim(),
      role: role || 'employee',
      salary: {
        baseSalary: parseFloat(baseSalary),
        currency: currency || 'USD',
        payFrequency: payFrequency || 'monthly',
      },
      bankDetails: {
        bankName: bankName || '',
        accountNumber: accountNumber || '',
        ifscCode: ifscCode || '',
      },
      leaveBalances: {
        annual: { total: 20, used: 0 },
        sick: { total: 10, used: 0 },
        casual: { total: 5, used: 0 },
      },
    });

    await newEmployee.save();
    return NextResponse.json({ success: true, employee: newEmployee, message: 'Employee added successfully.' });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
