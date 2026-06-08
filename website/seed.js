const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
let MONGODB_URI = process.env.MONGODB_URI;

// Read .env.local file to get connection string
const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.*)/);
  if (match && match[1]) {
    MONGODB_URI = match[1].trim();
  }
}

console.log('Seeding to database:', MONGODB_URI);

// Define Schemas Inline to avoid ES modules import issues with Node CLI
const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'hr_manager'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  head: { type: mongoose.Schema.Types.ObjectId },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  position: { type: String, required: true },
  role: { type: String, enum: ['employee', 'team_lead', 'manager'], default: 'employee' },
  joinDate: { type: Date, required: true, default: Date.now },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'intern'], default: 'full-time' },
  salary: {
    baseSalary: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    payFrequency: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' },
  },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
  },
  leaveBalances: {
    annual: { total: { type: Number, default: 20 }, used: { type: Number, default: 0 } },
    sick: { total: { type: Number, default: 10 }, used: { type: Number, default: 0 } },
    casual: { total: { type: Number, default: 5 }, used: { type: Number, default: 0 } },
  },
  profileImage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const AttendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ['present', 'absent', 'half-day', 'late', 'on-leave', 'holiday'], default: 'present', required: true },
  workingHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

const LeaveRequestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, enum: ['annual', 'sick', 'casual', 'unpaid'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true, min: 0.5 },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId },
  approvalDate: { type: Date },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

const PayrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  payPeriod: {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  employeeSnapshot: {
    name: { type: String, required: true },
    employeeId: { type: String, required: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
  },
  earnings: {
    baseSalary: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
  },
  deductions: {
    tax: { type: Number, default: 0 },
    providentFund: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
  },
  totalEarnings: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  grossPay: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'processed', 'paid', 'failed'], default: 'pending', required: true },
  paymentDate: { type: Date },
  paymentMethod: { type: String, enum: ['bank_transfer', 'check', 'cash'], default: 'bank_transfer' },
  transactionId: { type: String, default: '' },
  attendanceSummary: {
    totalWorkingDays: { type: Number, default: 0 },
    daysPresent: { type: Number, default: 0 },
    daysAbsent: { type: Number, default: 0 },
    daysOnLeave: { type: Number, default: 0 },
    totalOvertimeHours: { type: Number, default: 0 },
  },
  generatedBy: { type: mongoose.Schema.Types.ObjectId },
  remarks: { type: String, default: '' },
}, { timestamps: true });

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  reply: { type: String, default: '' },
  repliedAt: { type: Date },
}, { timestamps: true });

// Compile Models
const AdminUser = mongoose.model('AdminUser', AdminUserSchema);
const Department = mongoose.model('Department', DepartmentSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);
const LeaveRequest = mongoose.model('LeaveRequest', LeaveRequestSchema);
const Payroll = mongoose.model('Payroll', PayrollSchema);
const ContactMessage = mongoose.model('ContactMessage', ContactMessageSchema);

// Main Seed Function
async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Clear existing data
    await AdminUser.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Payroll.deleteMany({});
    await ContactMessage.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Default Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await AdminUser.create({
      username: 'admin',
      email: 'admin@company.com',
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'superadmin',
    });
    console.log('Created admin user: admin@company.com / admin123');

    // 2. Create Departments
    const engDep = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      description: 'Software development, infrastructure, and IT support.',
    });
    const hrDep = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      description: 'Talent acquisition, employee welfare, and payroll support.',
    });
    const finDep = await Department.create({
      name: 'Finance',
      code: 'FIN',
      description: 'Accounting, tax operations, and treasury.',
    });
    console.log('Created departments: Engineering, HR, Finance');

    // 3. Create Employees
    const employeePassword = await bcrypt.hash('password123', 10);
    
    const john = await Employee.create({
      employeeId: 'EMP-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@company.com',
      password: employeePassword,
      phone: '1234567890',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      address: { street: '123 Tech Lane', city: 'Silicon Valley', state: 'CA', zipCode: '94016', country: 'USA' },
      department: engDep._id,
      position: 'Senior Software Engineer',
      role: 'team_lead',
      joinDate: new Date('2024-01-10'),
      salary: { baseSalary: 7500, currency: 'USD', payFrequency: 'monthly' },
      bankDetails: { bankName: 'Chase Bank', accountNumber: '9876543210', ifscCode: 'CHAS000123' },
    });

    const jane = await Employee.create({
      employeeId: 'EMP-002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@company.com',
      password: employeePassword,
      phone: '2345678901',
      dateOfBirth: new Date('1992-08-22'),
      gender: 'female',
      address: { street: '456 People St', city: 'Austin', state: 'TX', zipCode: '73301', country: 'USA' },
      department: hrDep._id,
      position: 'HR Recruiter',
      role: 'employee',
      joinDate: new Date('2024-03-01'),
      salary: { baseSalary: 5500, currency: 'USD', payFrequency: 'monthly' },
      bankDetails: { bankName: 'Wells Fargo', accountNumber: '8765432109', ifscCode: 'WELS000456' },
    });

    const bob = await Employee.create({
      employeeId: 'EMP-003',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@company.com',
      password: employeePassword,
      phone: '3456789012',
      dateOfBirth: new Date('1988-11-30'),
      gender: 'male',
      address: { street: '789 Finance Blvd', city: 'New York', state: 'NY', zipCode: '10005', country: 'USA' },
      department: finDep._id,
      position: 'Senior Accountant',
      role: 'manager',
      joinDate: new Date('2023-06-15'),
      salary: { baseSalary: 6800, currency: 'USD', payFrequency: 'monthly' },
      bankDetails: { bankName: 'Bank of America', accountNumber: '7654321098', ifscCode: 'BOFA000789' },
    });
    console.log('Created employees: John, Jane, Bob. Password is password123');

    // Update heads of departments
    engDep.head = john._id;
    await engDep.save();
    hrDep.head = jane._id;
    await hrDep.save();
    finDep.head = bob._id;
    await finDep.save();

    // 4. Create Sample Attendance records for last 5 working days (Mon-Fri)
    const today = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Helper to get dates
    const dates = [];
    let count = 0;
    let checkDate = new Date();
    while (count < 5) {
      checkDate = new Date(checkDate.getTime() - oneDay);
      const day = checkDate.getDay();
      if (day !== 0 && day !== 6) { // Mon-Fri
        dates.push(new Date(checkDate.setHours(0, 0, 0, 0)));
        count++;
      }
    }

    const employees = [john, jane, bob];
    for (const emp of employees) {
      for (const d of dates) {
        const checkIn = new Date(d);
        checkIn.setHours(9, Math.floor(Math.random() * 15), 0); // 9:00 - 9:15 AM
        
        const checkOut = new Date(d);
        checkOut.setHours(18, Math.floor(Math.random() * 30), 0); // 6:00 - 6:30 PM

        const diffMs = checkOut.getTime() - checkIn.getTime();
        let hours = diffMs / (1000 * 60 * 60) - 1; // Subtract 1 hr lunch
        const workingHours = Math.round(hours * 100) / 100;
        const overtimeHours = workingHours > 8 ? Math.round((workingHours - 8) * 100) / 100 : 0;

        await Attendance.create({
          employee: emp._id,
          date: d,
          checkIn,
          checkOut,
          status: 'present',
          workingHours,
          overtimeHours,
          notes: 'Standard shift completed.',
        });
      }
    }
    console.log('Created attendance records.');

    // 5. Create Leave Requests
    await LeaveRequest.create({
      employee: jane._id,
      leaveType: 'sick',
      startDate: new Date(today.getTime() - 10 * oneDay),
      endDate: new Date(today.getTime() - 9 * oneDay),
      totalDays: 2,
      reason: 'Fever and cold.',
      status: 'approved',
      approvedBy: admin._id,
      approvalDate: new Date(),
    });

    await LeaveRequest.create({
      employee: john._id,
      leaveType: 'annual',
      startDate: new Date(today.getTime() + 5 * oneDay),
      endDate: new Date(today.getTime() + 9 * oneDay),
      totalDays: 5,
      reason: 'Family trip.',
      status: 'pending',
    });
    console.log('Created leave requests.');

    // 6. Create Payroll Records (April and May 2026)
    const periods = [
      { month: 4, year: 2026, start: new Date('2026-04-01'), end: new Date('2026-04-30') },
      { month: 5, year: 2026, start: new Date('2026-05-01'), end: new Date('2026-05-31') }
    ];

    for (const p of periods) {
      for (const emp of employees) {
        const base = emp.salary.baseSalary;
        const allowances = Math.round(base * 0.1); // 10% allowance
        const overtimePay = Math.floor(Math.random() * 200);
        const bonus = Math.floor(Math.random() * 500);
        
        const gross = base + allowances + overtimePay + bonus;
        
        const tax = Math.round(gross * 0.15); // 15% tax
        const pf = Math.round(base * 0.05); // 5% pf
        const insurance = 150;
        
        const totalDeductions = tax + pf + insurance;
        const net = gross - totalDeductions;

        await Payroll.create({
          employee: emp._id,
          payPeriod: {
            month: p.month,
            year: p.year,
            startDate: p.start,
            endDate: p.end,
          },
          employeeSnapshot: {
            name: `${emp.firstName} ${emp.lastName}`,
            employeeId: emp.employeeId,
            department: emp.employeeId === 'EMP-001' ? 'Engineering' : (emp.employeeId === 'EMP-002' ? 'Human Resources' : 'Finance'),
            position: emp.position,
          },
          earnings: {
            baseSalary: base,
            allowances,
            overtimePay,
            bonus,
          },
          deductions: {
            tax,
            providentFund: pf,
            insurance,
            otherDeductions: 0,
          },
          totalEarnings: gross,
          totalDeductions,
          grossPay: gross,
          netPay: net,
          paymentStatus: 'paid',
          paymentDate: new Date(p.end.getTime() - oneDay),
          paymentMethod: 'bank_transfer',
          transactionId: 'TXN' + Math.floor(Math.random() * 100000000),
          attendanceSummary: {
            totalWorkingDays: 22,
            daysPresent: 21,
            daysAbsent: 0,
            daysOnLeave: 1,
            totalOvertimeHours: 5,
          },
          generatedBy: admin._id,
          remarks: 'Monthly salary credited.',
        });
      }
    }
    console.log('Created payroll records.');

    // 7. Create Contact Messages
    await ContactMessage.create({
      name: 'Sarah Connor',
      email: 'sarah@external.com',
      subject: 'Inquiry about career opportunities',
      message: 'Hello, I wanted to ask if there are any openings in your engineering department for junior frontend devs? Thanks!',
      isRead: false,
    });

    await ContactMessage.create({
      name: 'Peter Parker',
      email: 'peter@external.com',
      subject: 'Bug report in payroll display',
      message: 'Hi, my payroll slip shows 0 bonus even though I was promised a referral bonus. Can HR verify?',
      isRead: true,
      readAt: new Date(),
      reply: 'Please contact the payroll department at payroll@company.com.',
      repliedAt: new Date(),
    });
    console.log('Created contact messages.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
