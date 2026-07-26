import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "https://devtech.cashms.in/auth/login";
    redirect(signInUrl);
  }

  redirect('/dashboard');
}
