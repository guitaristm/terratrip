import type { Metadata } from "next";

import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { CategoryProvider } from "@/lib/categories";
import { IdentityProvider } from "@/lib/identity";



export const metadata: Metadata = {
  title: "TerraTrip — Collaborative Travel Planner",
  description: "Plan trips, track expenses, and collaborate with friends.",
};

// Runs before paint to apply the saved theme and avoid a light flash.
const themeScript = `try{var t=localStorage.getItem('tt_theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>
          <IdentityProvider>
          <CategoryProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 md:ml-64 min-h-screen pt-14 md:pt-0">
                <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
                  {children}
                </div>
              </main>
            </div>
          </CategoryProvider>
          </IdentityProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
