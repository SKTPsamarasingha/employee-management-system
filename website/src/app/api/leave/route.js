import { NextResponse } from 'next/server';
import { dbConnect, LeaveRequest, Employee } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'employee') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await dbConnect();
    const requests = await LeaveRequest.find({ employee: decoded.id }).sort({ startDate: -1 });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Fetch leaves error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'employee') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { leaveType, startDate, endDate, reason } = await req.json();

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'All fields (leaveType, startDate, endDate, reason) are required' }, { status: 400 });
    }

    await dbConnect();

    // Verify dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json({ error: 'End date must be on or after start date.' }, { status: 400 });
    }

    // Calculate total days
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1; // Include both days

    // Verify employee exists
    const employee = await Employee.findById(decoded.id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    // Check if they have enough balance for non-unpaid leave types
    if (leaveType !== 'unpaid') {
      const balance = employee.leaveBalances[leaveType];
      if (!balance || (balance.total - balance.used) < diffDays) {
        return NextResponse.json({
          error: `Insufficient leave balance. You have ${balance ? (balance.total - balance.used) : 0} days remaining for ${leaveType} leave, but requested ${diffDays} days.`
        }, { status: 400 });
      }
    }

    const newRequest = new LeaveRequest({
      employee: decoded.id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      reason,
      status: 'pending',
    });

    await newRequest.save();
    return NextResponse.json({ success: true, request: newRequest, message: 'Leave request submitted successfully.' });
  } catch (error) {
    console.error('Submit leave error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
