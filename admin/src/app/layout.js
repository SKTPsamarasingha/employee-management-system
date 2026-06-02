import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'EMS - Admin Panel',
  description: 'Corporate dashboard to manage employees, departments, payroll, attendance, and support tickets.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-['Plus_Jakarta_Sans',sans-serif]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
