import React from 'react';
import { LayoutDashboard, TrendingDown, History, Settings, LogOut, Wallet, Eye, EyeOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onNavigate, isPrivacyMode, togglePrivacyMode }) => {
  
  return (
    <div className="flex h-screen w-full bg-background flex-col relative overflow-hidden">
      {/* --- HEADER --- */}
      <header className="h-16 bg-white shadow-sm flex items-center px-4 justify-between z-20 shrink-0 relative">
        <div className="flex items-center gap-2">
           <Wallet className="text-primary w-7 h-7" />
           <h1 className="text-xl font-bold text-gray-800 tracking-tight">Minha Gestão</h1>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={togglePrivacyMode} 
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors"
                title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
            >
                {isPrivacyMode ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
            
            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <button 
                onClick={() => onNavigate('login')} 
                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                title="Sair"
            >
                <LogOut size={24} />
            </button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 p-4">
        <div className={`max-w-md mx-auto w-full ${isPrivacyMode ? 'privacy-blur' : ''}`}>
            {children}
        </div>
      </main>
      
      {/* --- BOTTOM NAVIGATION BAR (Mobile Style) --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 h-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 flex justify-between items-start">
          <NavItem 
            icon={<LayoutDashboard size={24} />} 
            label="Painel" 
            isActive={activeScreen === 'dashboard'} 
            onClick={() => onNavigate('dashboard')} 
          />
          <NavItem 
            icon={<TrendingDown size={24} />} 
            label="Gastos" 
            isActive={activeScreen === 'expenses'} 
            onClick={() => onNavigate('expenses')} 
          />
          <NavItem 
            icon={<History size={24} />} 
            label="Pagos" 
            isActive={activeScreen === 'payments'} 
            onClick={() => onNavigate('payments')} 
          />
          <NavItem 
            icon={<Settings size={24} />} 
            label="Config" 
            isActive={activeScreen === 'settings'} 
            onClick={() => onNavigate('settings')} 
          />
      </nav>

      {/* Global Style for Privacy Mode & Safe Area */}
      <style>{`
        .privacy-blur .privacy-hidden {
            filter: blur(6px);
            user-select: none;
            transition: filter 0.3s ease;
        }
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center gap-1 w-16 transition-all duration-200 group
      ${isActive ? 'text-blue-600 -translate-y-2' : 'text-gray-400 hover:text-gray-600'}
    `}
  >
    <div className={`
        p-2 rounded-2xl transition-all duration-200
        ${isActive ? 'bg-blue-50 shadow-sm ring-1 ring-blue-100' : 'bg-transparent'}
    `}>
        {icon}
    </div>
    <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {label}
    </span>
  </button>
);

export default Layout;