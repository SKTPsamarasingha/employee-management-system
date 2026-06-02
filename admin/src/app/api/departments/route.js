import { NextResponse } from 'next/server';
import { dbConnect, Department, Employee } from '@/lib/db';
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

    const departments = await Department.find({ isActive: true }).populate('head', 'firstName lastName employeeId');

    // Dynamically calculate employee count for each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const count = await Employee.countDocuments({ department: dept._id, isActive: true });
        const deptObj = dept.toObject();
        deptObj.employeeCount = count;
        return deptObj;
      })
    );

    return NextResponse.json({ success: true, departments: departmentsWithCounts });
  } catch (error) {
    console.error('Fetch departments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { name, code, description, head } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'Department name and code are required' }, { status: 400 });
    }

    await dbConnect();

    // Check code uniqueness
    const codeExists = await Department.findOne({ code: code.toUpperCase() });
    if (codeExists) {
      return NextResponse.json({ error: 'Department code already exists' }, { status: 400 });
    }

    const nameExists = await Department.findOne({ name });
    if (nameExists) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
    }

    const newDept = new Department({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || '',
      head: head || null,
    });

    await newDept.save();
    return NextResponse.json({ success: true, department: newDept, message: 'Department created successfully.' });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
