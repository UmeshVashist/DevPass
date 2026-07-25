import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({ children }) {
  await auth.protect();
  return <>{children}</>;
}
