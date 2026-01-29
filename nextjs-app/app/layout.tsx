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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Prevent flash of unstyled content */
              html { 
                background: linear-gradient(to bottom right, #f9fafb, #ffffff, #f3f4f6);
              }
              html.dark { 
                background: linear-gradient(to bottom right, #111827, #1f2937, #111827);
              }
              
              /* Ensure body inherits background immediately */
              body { 
                background: transparent;
                min-height: 100vh;
              }
            `,
          }}
        />
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
                    root.style.background = 'linear-gradient(to bottom right, #111827, #1f2937, #111827)';
                    root.style.colorScheme = 'dark';
                  } else if (theme === 'light') {
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                    root.style.background = 'linear-gradient(to bottom right, #f9fafb, #ffffff, #f3f4f6)';
                    root.style.colorScheme = 'light';
                  } else {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      root.classList.add('dark');
                      root.setAttribute('data-theme', 'dark');
                      root.style.background = 'linear-gradient(to bottom right, #111827, #1f2937, #111827)';
                      root.style.colorScheme = 'dark';
                    } else {
                      root.style.background = 'linear-gradient(to bottom right, #f9fafb, #ffffff, #f3f4f6)';
                      root.style.colorScheme = 'light';
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
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
