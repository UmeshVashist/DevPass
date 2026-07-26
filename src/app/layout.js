import { ClerkProvider } from "@clerk/nextjs";
import { Outfit } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "DevPass | Secure Glassmorphic Password Manager",
  description: "Encrypt and manage your passwords locally in your browser with AES-256 and store them securely in your Google Sheets database.",
  icons: {
    icon: "https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1784962617063-account-recovery.png",
    shortcut: "https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1784962617063-account-recovery.png",
    apple: "https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1784962617063-account-recovery.png",
  }
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isLocalhost = host.includes("localhost");

  const isSatellite = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true";
  const rawDomain = isLocalhost ? host : process.env.NEXT_PUBLIC_CLERK_DOMAIN;
  const domain = rawDomain ? rawDomain.replace(/^https?:\/\//, "") : undefined;
  const signInUrl = isLocalhost 
    ? "http://localhost:3000/auth/login" 
    : process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
  const launcherUrl = isLocalhost 
    ? "http://localhost:3000" 
    : (process.env.NEXT_PUBLIC_LAUNCHER_URL || "https://devtech.cashms.in");

  return (
    <ClerkProvider
      isSatellite={isSatellite}
      domain={domain}
      signInUrl={signInUrl}
      satelliteAutoSync={true}
      afterSignOutUrl={`${launcherUrl}/auth/login`}
      appearance={{
        layout: {
          logoImageUrl: "https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1784962617063-account-recovery.png"
        },
        options: {
          logoImageUrl: "https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1784962617063-account-recovery.png"
        },
        variables: {
          colorText: "#f8fafc",
          colorMutedForeground: "#94a3b8",
          colorTextSecondary: "#94a3b8",
          colorPrimary: "#6366f1",
        },
        elements: {
          formFieldLabel: {
            color: "#94a3b8",
          },
          cardHeaderTitle: {
            color: "#f8fafc",
          },
          cardHeaderSubtitle: {
            color: "#94a3b8",
          }
        }
      }}
    >
      <html lang="en">
        <body className={outfit.className}>
          <div className="bg-ambient">
            <div className="bg-orb orb-1"></div>
            <div className="bg-orb orb-2"></div>
            <div className="bg-orb orb-3"></div>
          </div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
