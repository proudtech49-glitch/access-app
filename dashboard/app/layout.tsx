import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'OpinionRewards Command Center',
  description: 'Covert telemetry dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-black text-zinc-300 font-mono scanlines">
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
