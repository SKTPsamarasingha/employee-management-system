import { NextResponse } from 'next/server';
import { dbConnect, Payroll } from '@/lib/db';
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
    const {
      bonus,
      allowances,
      otherDeductions,
      paymentStatus,
      paymentMethod,
      transactionId,
      remarks
    } = await req.json();

    await dbConnect();

    const record = await Payroll.findById(id);
    if (!record) {
      return NextResponse.json({ error: 'Payroll record not found.' }, { status: 404 });
    }

    if (record.paymentStatus === 'paid' && paymentStatus !== 'paid') {
      // Prevent reversing paid state easily without superadmin or check
      if (decoded.role !== 'superadmin') {
        return NextResponse.json({ error: 'Only a superadmin can modify a paid payroll slip.' }, { status: 403 });
      }
    }

    // Update financial fields if provided
    if (bonus !== undefined && bonus !== '') {
      const n = Number(bonus);
      if (Number.isNaN(n)) {
        return NextResponse.json({ error: 'Invalid bonus value.' }, { status: 400 });
      }
      record.earnings.bonus = n;
    }
    if (allowances !== undefined && allowances !== '') {
      const n = Number(allowances);
      if (Number.isNaN(n)) {
        return NextResponse.json({ error: 'Invalid allowances value.' }, { status: 400 });
      }
      record.earnings.allowances = n;
    }
    if (otherDeductions !== undefined && otherDeductions !== '') {
      const n = Number(otherDeductions);
      if (Number.isNaN(n)) {
        return NextResponse.json({ error: 'Invalid deduction value.' }, { status: 400 });
      }
      record.deductions.otherDeductions = n;
    }

    // Update payment details
    if (paymentStatus) {
      record.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        record.paymentDate = new Date();
      }
    }
    
    if (paymentMethod) record.paymentMethod = paymentMethod;
    if (transactionId !== undefined) record.transactionId = transactionId;
    if (remarks !== undefined) record.remarks = remarks;

    await record.save(); // pre-save recalculates totals

    return NextResponse.json({ success: true, record, message: 'Payroll record updated successfully.' });
  } catch (error) {
    console.error('Update payroll record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
