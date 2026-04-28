import { type FC, type ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full text-foreground relative">
      {/* Decorative vertical lines mimicking column borders behind everything */}
      <div className="fixed inset-0 pointer-events-none -z-10 flex justify-center max-w-7xl mx-auto opacity-5">
        <div className="w-1/4 h-full border-r border-foreground"></div>
        <div className="w-1/4 h-full border-r border-foreground"></div>
        <div className="w-1/4 h-full border-r border-foreground"></div>
        <div className="w-1/4 h-full"></div>
      </div>

      <div className="max-w-6xl mx-auto bg-background min-h-screen border-l border-r border-card-border">
        <Navbar />
        <main className="px-4 md:px-8 py-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
