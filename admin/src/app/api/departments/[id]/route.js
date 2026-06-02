import { NextResponse } from 'next/server';
import { dbConnect, Department, Employee } from '@/lib/db';
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
    const { name, code, description, head } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'Department name and code are required' }, { status: 400 });
    }

    await dbConnect();

    const dept = await Department.findById(id);
    if (!dept || !dept.isActive) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Code uniqueness check (excluding self)
    const codeExists = await Department.findOne({ code: code.toUpperCase(), _id: { $ne: id } });
    if (codeExists) {
      return NextResponse.json({ error: 'Department code already in use' }, { status: 400 });
    }

    // Name uniqueness check (excluding self)
    const nameExists = await Department.findOne({ name, _id: { $ne: id } });
    if (nameExists) {
      return NextResponse.json({ error: 'Department name already in use' }, { status: 400 });
    }

    dept.name = name.trim();
    dept.code = code.trim().toUpperCase();
    dept.description = description || '';
    dept.head = head || null;

    await dept.save();
    return NextResponse.json({ success: true, department: dept, message: 'Department updated successfully.' });
  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const dept = await Department.findById(id);
    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if there are active employees assigned to this department
    const employeeCount = await Employee.countDocuments({ department: id, isActive: true });
    if (employeeCount > 0) {
      return NextResponse.json({
        error: `Cannot delete department. There are ${employeeCount} active employees assigned to it.`
      }, { status: 400 });
    }

    // Soft delete
    dept.isActive = false;
    await dept.save();

    return NextResponse.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
