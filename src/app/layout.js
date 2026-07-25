import { ClerkProvider } from "@clerk/nextjs";
import { Outfit } from "next/font/google";
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

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
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
