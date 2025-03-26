import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { getUserByEmail } from "@/utils/supabase";
import AnimatedView from "@/components/ui/AnimatedView";
import AgentLimitsPanel from './AgentLimitsPanel';

interface SettingsScreenProps {
  onClose: () => void;
  onLogout: () => void;
}

interface PersonalInfoProps {
  onBack: () => void;
  userInfo: any;
  walletAddress: string;
}

interface SecuritySectionProps {
  onBack: () => void;
}

// Componente para spinner de carga estilizado
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full w-full">
    <div className="relative">
      <div className="w-12 h-12 rounded-full absolute border-4 border-gray-200"></div>
      <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-blue-500 border-t-transparent"></div>
    </div>
  </div>
);

const PersonalInfo: React.FC<PersonalInfoProps> = ({ onBack, userInfo, walletAddress }) => {
  const [supabaseData, setSupabaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (userInfo?.email) {
        setLoading(true);
        try {
          const data = await getUserByEmail(userInfo.email);
          if (data) {
            setSupabaseData(data);
          }
        } catch (error) {
          console.error("Error fetching user data from Supabase:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [userInfo?.email]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-200">
        <button onClick={onBack} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h2 className="text-lg font-semibold mx-auto">Personal Information</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="animate-fadeIn">
            {/* Profile card */}
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4 animate-slideUp" style={{animationDelay: "0.1s"}}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold">
                  {userInfo?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "CC"}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">{userInfo?.name || "Claudio Condor"}</h3>
                  <p className="text-sm text-yellow-600">{userInfo?.email || "claucondor@gmail.com"}</p>
                </div>
              </div>
            </div>
            
            {/* Wallet address card */}
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4 animate-slideUp" style={{animationDelay: "0.2s"}}>
              <h3 className="font-medium text-gray-800 mb-2">Wallet Address</h3>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between mb-2">
                <p className="text-sm break-all text-gray-700 mr-2">
                  {walletAddress || "0x0000000...0000"}
                </p>
                <button 
                  className="min-w-[80px] p-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-all"
                  onClick={handleCopyAddress}
                >
                  {copied ? (
                    <span className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                      Copied!
                    </span>
                  ) : "Copy"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                This is your unique blockchain address for receiving tokens and assets
              </p>
            </div>
            
            {/* Supabase info card */}
            {supabaseData && (
              <div className="bg-white rounded-xl p-5 shadow-sm animate-slideUp" style={{animationDelay: "0.3s"}}>
                <h3 className="font-medium text-gray-800 mb-3">Database Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">First registered</p>
                    <p className="font-medium text-gray-700">
                      {new Date(supabaseData.created_at).toLocaleDateString()} at {new Date(supabaseData.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last updated</p>
                    <p className="font-medium text-gray-700">
                      {new Date(supabaseData.updated_at).toLocaleDateString()} at {new Date(supabaseData.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <span className="text-sm font-medium">Data synchronized with Supabase</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Agent Configuration</h2>
              <AgentLimitsPanel walletAddress={walletAddress} />
              <p className="text-xs text-gray-500 mt-2">
                These limits control what your agent can do with your tokens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SecuritySection: React.FC<SecuritySectionProps> = ({ onBack }) => {
  const { getPrivateKey } = useWeb3Auth();
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fetchPrivateKey = async () => {
    if (privateKey) return; // Already fetched
    if (!confirmed) return; // Not confirmed yet
    
    setIsLoading(true);
    try {
      const key = await getPrivateKey();
      setPrivateKey(key);
    } catch (error) {
      console.error("Error fetching private key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleCopyToClipboard = () => {
    if (!privateKey) return;
    
    navigator.clipboard.writeText(privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (confirmed) {
      fetchPrivateKey();
    }
  }, [confirmed]);

  const formatPrivateKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 16) return key;
    
    // Show first and last 8 characters when not visible
    if (!isVisible) {
      return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
    }
    
    return key;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-200">
        <button onClick={onBack} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h2 className="text-lg font-semibold mx-auto">Security & Backup</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
        {!confirmed ? (
          <div className="bg-white rounded-xl p-5 shadow-sm animate-fadeIn">
            <div className="text-yellow-600 p-4 bg-yellow-50 rounded-lg mb-4 flex items-start animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 flex-shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <div>
                <h3 className="font-medium mb-1">Security Warning</h3>
                <p className="text-sm">
                  Your private key provides full access to your wallet and funds. Never share it with anyone, and store it securely.
                </p>
              </div>
            </div>
            
            <p className="mb-4 text-sm text-gray-700 animate-fadeIn" style={{animationDelay: "0.2s"}}>
              Viewing your private key can be risky. Only do this in a secure environment where no one can see your screen.
            </p>
            
            <div className="flex flex-col space-y-3 animate-slideUp" style={{animationDelay: "0.3s"}}>
              <button
                onClick={() => setConfirmed(true)}
                className="p-3 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                I understand, show my private key
              </button>
              <button
                onClick={onBack}
                className="p-3 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white rounded-xl p-5 shadow-sm animate-fadeIn">
                <h3 className="font-medium text-gray-800 mb-2">Your Private Key</h3>
                <div className="bg-gray-100 p-4 rounded-lg mb-3 animate-slideUp" style={{animationDelay: "0.1s"}}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">For recovery purposes only</p>
                    <button 
                      onClick={handleToggleVisibility}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                    >
                      {isVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  
                  <p className={`break-all font-mono text-sm ${isVisible ? "text-gray-800" : "text-gray-500"} transition-colors duration-200`}>
                    {privateKey ? formatPrivateKey(privateKey) : "Unable to retrieve private key"}
                  </p>
                </div>
                
                <div className="flex flex-col space-y-3 animate-slideUp" style={{animationDelay: "0.2s"}}>
                  <button
                    onClick={handleCopyToClipboard}
                    disabled={!privateKey}
                    className="p-3 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-all flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                        Copied to clipboard
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy to clipboard
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-5 text-red-600 p-4 bg-red-50 rounded-lg text-sm animate-slideUp" style={{animationDelay: "0.3s"}}>
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Never share your private key with anyone</li>
                    <li>Never enter it on websites or apps</li>
                    <li>If someone asks for it, they're trying to scam you</li>
                    <li>Store it securely in an encrypted password manager</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onLogout }) => {
  const { userInfo, stellarAddress } = useWeb3Auth();
  const [language, setLanguage] = useState("English");
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [exitingView, setExitingView] = useState("");
  const [mainContentVisible, setMainContentVisible] = useState(true);
  
  // Mostrar animación al iniciar
  useEffect(() => {
    setMainContentVisible(true);
  }, []);
  
  // Gestión de transiciones entre vistas
  const handleShowView = (view: string) => {
    // Si ya hay una vista mostrándose, primero la ocultamos con animación
    if (showPersonalInfo || showSecurity) {
      if (showPersonalInfo) setExitingView("personal");
      if (showSecurity) setExitingView("security");
      
      setShowPersonalInfo(false);
      setShowSecurity(false);
      setMainContentVisible(true);
      
      // Después de un breve retraso para la transición, mostramos la nueva vista
      setTimeout(() => {
        setExitingView("");
        setMainContentVisible(false);
        if (view === "personal") setShowPersonalInfo(true);
        if (view === "security") setShowSecurity(true);
      }, 500);
    } else {
      // Si no hay ninguna vista activa, ocultamos el contenido principal y mostramos la nueva vista
      setMainContentVisible(false);
      setTimeout(() => {
        if (view === "personal") setShowPersonalInfo(true);
        if (view === "security") setShowSecurity(true);
      }, 300);
    }
  };
  
  const handleCloseView = (view: string) => {
    setExitingView(view);
    
    if (view === "personal") {
      setShowPersonalInfo(false);
    }
    
    if (view === "security") {
      setShowSecurity(false);
    }
    
    setMainContentVisible(true);
    
    setTimeout(() => {
      setExitingView("");
    }, 500);
  };
  
  // Verificación de si una vista está activa o saliendo (para animaciones)
  const isViewActive = (view: string) => {
    return (view === "personal" && showPersonalInfo) || 
           (view === "security" && showSecurity) || 
           exitingView === view;
  };
  
  const settingsItems = [
    {
      id: "personal",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      title: "Personal information",
      rightContent: null,
      onClick: () => handleShowView("personal")
    },
    {
      id: "security",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      title: "Security & Backup",
      rightContent: null,
      onClick: () => handleShowView("security")
    },
    {
      id: "language",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      ),
      title: "Language",
      rightContent: language,
      onClick: () => {
        const newLanguage = language === "English" ? "Español" : "English";
        setLanguage(newLanguage);
      }
    },
    {
      id: "privacy",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      title: "Privacy Policy",
      rightContent: null,
      onClick: () => window.open("https://stellar.org/privacy-policy", "_blank")
    },
    {
      id: "help",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
      title: "Help center",
      rightContent: null,
      onClick: () => window.open("https://stellar.org/developers/docs", "_blank")
    },
    {
      id: "setting",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
      title: "Setting",
      rightContent: null,
      onClick: () => console.log("Settings clicked")
    },
  ];

  const getInitials = (name: string) => {
    if (!name) return "CC";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className={`fixed inset-0 bg-gray-100 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${mainContentVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative w-full max-w-md h-[85vh] bg-white flex flex-col overflow-hidden rounded-xl shadow-lg">
          {/* Header */}
          <div className="p-4 flex items-center border-b border-gray-200">
            <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h2 className="text-lg font-semibold mx-auto">Account</h2>
            <div className="w-8"></div>
          </div>

          {/* Content with scroll */}
          <div className="flex-1 overflow-y-auto">
            {/* User profile section with animation */}
            <div className="flex items-center p-5 border-b border-gray-200 hover:bg-gray-50 transition-colors transform transition-transform duration-300 hover:scale-[1.01]">
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold mr-4">
                {getInitials(userInfo?.name || "")}
              </div>
              <div>
                <h3 className="font-medium">{userInfo?.name || "Claudio Condor"}</h3>
                <p className="text-sm text-yellow-600">{userInfo?.email || "claucondor@gmail.com"}</p>
              </div>
            </div>

            {/* Settings items with animations */}
            <div>
              {settingsItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center p-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all duration-300 hover:translate-x-1"
                  onClick={item.onClick}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    transform: `translateY(${mainContentVisible ? '0' : '10px'})`,
                    opacity: mainContentVisible ? 1 : 0,
                    transition: `transform 0.3s ease ${index * 0.05}s, opacity 0.3s ease ${index * 0.05}s`
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-4 text-gray-600 transition-all duration-300 group-hover:bg-blue-100">
                    {item.icon}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium">{item.title}</span>
                    <div className="flex items-center">
                      {item.rightContent && (
                        <span className="text-gray-500 mr-2">{item.rightContent}</span>
                      )}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400 transition-transform duration-300"
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Logout Button at bottom with animation */}
          <div className="p-4">
            <button
              onClick={onLogout}
              className="w-full p-3 rounded-xl text-black font-medium border border-gray-300 hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
      
      {/* Vistas animadas */}
      <AnimatedView show={isViewActive("personal")} direction="right">
        <PersonalInfo 
          onBack={() => handleCloseView("personal")} 
          userInfo={userInfo} 
          walletAddress={stellarAddress}
        />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("security")} direction="right">
        <SecuritySection onBack={() => handleCloseView("security")} />
      </AnimatedView>
    </>
  );
};

export default SettingsScreen;