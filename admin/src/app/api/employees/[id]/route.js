import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect, Employee, Department } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const employee = await Employee.findById(id).populate('department');
    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Omit password from output
    const employeeObj = employee.toObject();
    delete employeeObj.password;

    return NextResponse.json({ success: true, employee: employeeObj });
  } catch (error) {
    console.error('Fetch employee detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    await dbConnect();

    const employee = await Employee.findById(id);
    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Basic required validation on update
    const {
      firstName,
      lastName,
      email,
      phone,
      department: departmentId,
      position,
      role,
      baseSalary,
      password,
    } = data;

    if (!firstName || !lastName || !email || !phone || !departmentId || !position || !baseSalary) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    // Verify email uniqueness if email has changed
    if (email !== employee.email) {
      const emailExists = await Employee.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return NextResponse.json({ error: 'Email is already in use by another employee' }, { status: 400 });
      }
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
    }

    // Update fields
    employee.firstName = firstName.trim();
    employee.lastName = lastName.trim();
    employee.email = email.trim().toLowerCase();
    employee.phone = phone.trim();
    employee.department = departmentId;
    employee.position = position.trim();
    employee.role = role || 'employee';
    employee.salary.baseSalary = Number(baseSalary);
    
    if (data.currency) employee.salary.currency = data.currency;
    if (data.payFrequency) employee.salary.payFrequency = data.payFrequency;

    if (!employee.bankDetails) {
      employee.bankDetails = { bankName: '', accountNumber: '', ifscCode: '' };
    }
    if (data.bankName !== undefined) employee.bankDetails.bankName = data.bankName;
    if (data.accountNumber !== undefined) employee.bankDetails.accountNumber = data.accountNumber;
    if (data.ifscCode !== undefined) employee.bankDetails.ifscCode = data.ifscCode;

    if (data.gender) employee.gender = data.gender;
    if (data.dateOfBirth) employee.dateOfBirth = new Date(data.dateOfBirth);

    if (data.address) {
      employee.address = {
        street: data.address.street || '',
        city: data.address.city || '',
        state: data.address.state || '',
        zipCode: data.address.zipCode || '',
        country: data.address.country || '',
      };
    }

    // If new password is provided, hash it
    if (password && password.trim() !== '') {
      employee.password = await bcrypt.hash(password, 10);
    }

    await employee.save();
    return NextResponse.json({ success: true, employee, message: 'Employee updated successfully.' });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin', 'hr_manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete
    employee.isActive = false;
    await employee.save();

    return NextResponse.json({ success: true, message: 'Employee record deleted successfully.' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
