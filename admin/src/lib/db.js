import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local",
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
    console.log("DB connected");
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// ==========================================
// 1. ADMIN USER SCHEMA
// ==========================================
const AdminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true }, // bcrypt hashed
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "hr_manager"],
      default: "admin",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true },
);

// ==========================================
// 2. DEPARTMENT SCHEMA
// ==========================================
const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    head: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// ==========================================
// 3. EMPLOYEE SCHEMA
// ==========================================
const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true }, // bcrypt hashed
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    position: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["employee", "team_lead", "manager"],
      default: "employee",
    },
    joinDate: { type: Date, required: true, default: Date.now },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "intern"],
      default: "full-time",
    },
    salary: {
      baseSalary: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "USD" },
      payFrequency: {
        type: String,
        enum: ["monthly", "weekly"],
        default: "monthly",
      },
    },
    bankDetails: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
    },
    leaveBalances: {
      annual: {
        total: { type: Number, default: 20 },
        used: { type: Number, default: 0 },
      },
      sick: {
        total: { type: Number, default: 10 },
        used: { type: Number, default: 0 },
      },
      casual: {
        total: { type: Number, default: 5 },
        used: { type: Number, default: 0 },
      },
    },
    profileImage: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

EmployeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ==========================================
// 4. ATTENDANCE RECORD SCHEMA
// ==========================================
const AttendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: Date, required: true }, // Midnight UTC representation of day
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "late", "on-leave", "holiday"],
      default: "present",
      required: true,
    },
    workingHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Auto-calculate working hours & overtime before saving
AttendanceSchema.pre("save", function () {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut.getTime() - this.checkIn.getTime();
    let hours = diffMs / (1000 * 60 * 60);
    // Deduct 1 hour lunch break if they worked more than 5 hours
    if (hours > 5) {
      hours -= 1;
    }
    this.workingHours = Math.max(0, Math.round(hours * 100) / 100);
    this.overtimeHours =
      this.workingHours > 8
        ? Math.round((this.workingHours - 8) * 100) / 100
        : 0;
  }
});

// ==========================================
// 5. LEAVE REQUEST SCHEMA
// ==========================================
const LeaveRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["annual", "sick", "casual", "unpaid"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      required: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    approvalDate: { type: Date },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true },
);

// ==========================================
// 6. PAYROLL RECORD SCHEMA
// ==========================================
const PayrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
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
    paymentStatus: {
      type: String,
      enum: ["pending", "processed", "paid", "failed"],
      default: "pending",
      required: true,
    },
    paymentDate: { type: Date },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "check", "cash"],
      default: "bank_transfer",
    },
    transactionId: { type: String, default: "" },
    attendanceSummary: {
      totalWorkingDays: { type: Number, default: 0 },
      daysPresent: { type: Number, default: 0 },
      daysAbsent: { type: Number, default: 0 },
      daysOnLeave: { type: Number, default: 0 },
      totalOvertimeHours: { type: Number, default: 0 },
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    remarks: { type: String, default: "" },
  },
  { timestamps: true },
);

PayrollSchema.index(
  { employee: 1, "payPeriod.month": 1, "payPeriod.year": 1 },
  { unique: true },
);

// Auto-calculate earnings/deductions/net pay before saving
PayrollSchema.pre("save", function () {
  const earn = this.earnings;
  const ded = this.deductions;

  this.totalEarnings =
    Math.round(
      (earn.baseSalary + earn.allowances + earn.overtimePay + earn.bonus) * 100,
    ) / 100;
  this.grossPay = this.totalEarnings;
  this.totalDeductions =
    Math.round(
      (ded.tax + ded.providentFund + ded.insurance + ded.otherDeductions) * 100,
    ) / 100;
  this.netPay = Math.round((this.grossPay - this.totalDeductions) * 100) / 100;
});

// ==========================================
// 7. CONTACT MESSAGE SCHEMA
// ==========================================
const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    reply: { type: String, default: "" },
    repliedAt: { type: Date },
  },
  { timestamps: true },
);

// ==========================================
// MODEL REGISTRATIONS
// ==========================================
export const AdminUser =
  mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);
export const Department =
  mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
export const Employee =
  mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
export const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
export const LeaveRequest =
  mongoose.models.LeaveRequest ||
  mongoose.model("LeaveRequest", LeaveRequestSchema);
export const Payroll =
  mongoose.models.Payroll || mongoose.model("Payroll", PayrollSchema);
export const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", ContactMessageSchema);
