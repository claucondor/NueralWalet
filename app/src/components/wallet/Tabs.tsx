import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (tabsRef.current) {
      const activeButton = tabsRef.current.querySelector(`button[data-tab="${activeTab}"]`) as HTMLButtonElement;
      if (activeButton) {
        setIndicatorStyle({
          left: activeButton.offsetLeft,
          width: activeButton.offsetWidth,
        });
      }
    }
  }, [activeTab]);

  const handleFriendVaultClick = () => {
    // Navegar a la página de Friend Vault
    navigate("/friend-vault");
  };

  return (
    <div ref={tabsRef} className="self-stretch bg-[rgba(243,245,246,1)] flex items-center gap-auto text-sm font-semibold whitespace-nowrap text-center justify-center p-1 rounded-2xl relative">
      <div 
        className="absolute h-12 bg-[rgba(39,39,41,1)] rounded-[12px] transition-all duration-300 ease-in-out z-0" 
        style={{ 
          left: `${indicatorStyle.left}px`, 
          width: `${indicatorStyle.width}px` 
        }}
      />
      <button 
        data-tab="tokens"
        className={`self-stretch min-h-12 gap-2.5 w-full my-auto px-2.5 py-4 rounded-2xl z-10 relative transition-colors duration-300 ${activeTab === "tokens" ? "text-[rgba(227,223,223,1)]" : "text-[rgba(39,39,41,1)]"}`} 
        onClick={() => onTabChange("tokens")}
      >
        Tokens
      </button>
      <button 
        data-tab="history"
        className={`self-stretch min-h-12 gap-2.5 w-full my-auto px-2.5 py-4 rounded-2xl z-10 relative transition-colors duration-300 ${activeTab === "history" ? "text-[rgba(227,223,223,1)]" : "text-[rgba(39,39,41,1)]"}`} 
        onClick={() => onTabChange("history")}
      >
        History
      </button>
      <button 
        data-tab="friendvault"
        className={`self-stretch min-h-12 gap-2.5 w-full my-auto px-2.5 py-4 rounded-2xl z-10 relative transition-colors duration-300 text-[rgba(39,39,41,1)]`} 
        onClick={handleFriendVaultClick}
      >
        Vaults
      </button>
    </div>
  );
};

export default Tabs;