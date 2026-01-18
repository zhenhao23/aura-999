import React from "react";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map background will be rendered here */}
      <div className="absolute inset-0 z-0">{/* TacticalMap component */}</div>

      {/* Quadrant overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
