import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-8">
        <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col justify-between">
          <div className="w-full flex-1 pb-8">
            {children}
          </div>
          
          <footer className="mt-auto pt-6 border-t border-gray-200/60 text-center space-y-1.5 select-none">
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-xs font-bold text-gray-500">
              <span className="hover:text-orange-600 transition-colors">Sankara Eye Foundation India</span>
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span className="hover:text-orange-600 transition-colors">Sankara Eye Hospitals</span>
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span className="hover:text-orange-600 transition-colors">Sri Kanchi Kamakoti Medical Trust</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Developed and Managed by <span className="text-gray-500 font-extrabold text-[11px] normal-case">Team Information Systems - MHQ Coimbatore</span>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
