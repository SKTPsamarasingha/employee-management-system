import { NextResponse } from 'next/server';
import { dbConnect, ContactMessage } from '@/lib/db';
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
    const { isRead, reply } = await req.json();

    await dbConnect();

    const message = await ContactMessage.findById(id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (isRead !== undefined) {
      message.isRead = isRead;
      if (isRead) message.readAt = new Date();
    }

    if (reply !== undefined) {
      message.reply = reply;
      message.repliedAt = new Date();
      message.isRead = true; // Automatically mark read on reply
      message.readAt = new Date();
    }

    await message.save();

    return NextResponse.json({ success: true, message, msg: 'Message updated successfully.' });
  } catch (error) {
    console.error('Update contact message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = await verifyJWT(token);
    if (!decoded || !['superadmin', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized access. Only admins can delete messages.' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const message = await ContactMessage.findById(id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    await ContactMessage.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Delete contact message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
