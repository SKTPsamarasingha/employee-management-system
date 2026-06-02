import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect, AdminUser } from '@/lib/db';
import { signJWT } from '@/lib/auth';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const admin = await AdminUser.findOne({ email });
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Sign JWT
    const token = await signJWT({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role, // 'superadmin', 'admin', 'hr_manager'
      username: admin.username,
      fullName: admin.fullName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });

    // Set cookie
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Update lastLogin
    admin.lastLogin = new Date();
    await admin.save();

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

