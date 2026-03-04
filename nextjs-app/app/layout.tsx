import type { Metadata } from "next";
import "./globals.css";
import "../styles/themes.css";
import "../styles/animations.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "MLH TTU Chapter",
  description: "Major League Hacking at Texas Tech University",
  icons: {
    icon: '/mlh-logo.png',
    shortcut: '/mlh-logo.png',
    apple: '/mlh-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('mlh-ttu-theme');
                  const root = document.documentElement;
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'dark');
                    root.style.colorScheme = 'dark';
                  } else if (theme === 'light') {
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                    root.style.colorScheme = 'light';
                  } else {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      root.classList.add('dark');
                      root.setAttribute('data-theme', 'dark');
                      root.style.colorScheme = 'dark';
                    } else {
                      root.style.colorScheme = 'light';
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
