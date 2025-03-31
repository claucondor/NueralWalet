import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { getUserByEmail } from "@/utils/supabase";
import AnimatedView from "@/components/ui/AnimatedView";
import AgentLimitsPanel from './AgentLimitsPanel';
import CreditScoreSection from './CreditScoreSection';
import CreditScoreCard from './CreditScoreCard';

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
  const { getPrivateKey, stellarAccount } = useWeb3Auth();
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
      // Use the Stellar account's secret key directly instead of fetching the EVM private key
      if (stellarAccount && stellarAccount.secretKey) {
        setPrivateKey(stellarAccount.secretKey);
      } else {
        // Fallback to the original method if stellarAccount is not available
        const key = await getPrivateKey();
        setPrivateKey(key);
      }
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
                  Your Stellar secret key provides full access to your wallet and funds. Never share it with anyone, and store it securely.
                </p>
              </div>
            </div>
            
            <p className="mb-4 text-sm text-gray-700 animate-fadeIn" style={{animationDelay: "0.2s"}}>
              Viewing your Stellar secret key can be risky. Only do this in a secure environment where no one can see your screen.
            </p>
            
            <div className="flex flex-col space-y-3 animate-slideUp" style={{animationDelay: "0.3s"}}>
              <button
                onClick={() => setConfirmed(true)}
                className="p-3 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                I understand, show my Stellar secret key
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
                <h3 className="font-medium text-gray-800 mb-2">Your Stellar Secret Key</h3>
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
  const { userInfo, stellarAddress, getCreditScore } = useWeb3Auth();
  const [currentView, setCurrentView] = useState<string>("main");
  const [creditScore, setCreditScore] = useState<{
    score: number, 
    reason: string, 
    debtRatio?: number, 
    transactionCount?: number
  } | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  // Función para obtener una versión resumida del score crediticio
  // Solo se ejecutará una vez cuando se abra la configuración
  useEffect(() => {
    const fetchCreditScorePreview = async () => {
      setIsLoadingScore(true);
      try {
        const result = await getCreditScore();
        console.log("Credit score result:", result);
        
        // Verificamos la estructura correcta del objeto
        if (result?.success && result.data?.success) {
          setCreditScore({
            score: result.data.creditScore.score,
            reason: result.data.creditScore.reason,
            debtRatio: result.data.analysis.debtRatio,
            transactionCount: result.data.analysis.transactionCount
          });
        }
      } catch (error) {
        console.error("Error fetching credit score preview:", error);
      } finally {
        setIsLoadingScore(false);
      }
    };

    // Solo hacer la petición una vez cuando se abre la pantalla
    fetchCreditScorePreview();
  }, [getCreditScore]);

  const handleShowView = (view: string) => {
    setCurrentView(view);
  };

  const handleCloseView = (view: string) => {
    setCurrentView("main");
  };

  const isViewActive = (view: string) => {
    return currentView === view;
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
      rightContent: "English",
      onClick: () => {
        const newLanguage = "English" === "English" ? "Español" : "English";
        // Implement language change logic
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
    <div className="fixed inset-0 bg-white z-50 flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <button
          onClick={onClose}
          className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
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
        <h1 className="text-xl font-semibold text-center flex-grow">Settings</h1>
        <div className="w-10"></div>
      </div>

      {/* Main view */}
      {isViewActive("main") && (
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          <div className="max-w-md mx-auto space-y-4">
            {/* User info */}
            <div className="bg-white rounded-xl p-5 shadow-sm flex items-center space-x-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold text-xl">
                {getInitials(userInfo?.name || "User")}
              </div>
              <div>
                <h2 className="font-semibold text-lg">{userInfo?.name || "User"}</h2>
                <p className="text-sm text-gray-500">{userInfo?.email || "No email"}</p>
              </div>
            </div>

            {/* Score crediticio card */}
            {(creditScore || isLoadingScore) && (
              <div className="mb-4">
                <CreditScoreCard 
                  score={creditScore?.score || 0}
                  reason={creditScore?.reason || ''}
                  debtRatio={creditScore?.debtRatio}
                  transactionCount={creditScore?.transactionCount}
                  loading={isLoadingScore}
                  onClick={() => handleShowView('creditScore')}
                  debug={true}
                />
              </div>
            )}

            {/* Options */}
            <div className="bg-white rounded-xl shadow-sm divide-y">
              <button
                onClick={() => handleShowView("personal")}
                className="w-full p-4 flex items-center hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">Personal Information</h3>
                  <p className="text-xs text-gray-500">View and manage your information</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <button
                onClick={() => handleShowView("security")}
                className="w-full p-4 flex items-center hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">Security</h3>
                  <p className="text-xs text-gray-500">Manage private keys</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              {/* Botón de Score Crediticio si no estamos mostrando directamente la card */}
              {!creditScore && !isLoadingScore && (
                <button
                  onClick={() => handleShowView("creditScore")}
                  className="w-full p-4 flex items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-4">
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
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">Credit Score</h3>
                    <p className="text-xs text-gray-500">View your credit reputation</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="w-full p-4 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
            >
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
                className="mr-2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Credit score view */}
      <AnimatedView show={isViewActive("creditScore")}>
        <CreditScoreSection onBack={() => handleCloseView("creditScore")} />
      </AnimatedView>

      {/* Personal info view */}
      <AnimatedView show={isViewActive("personal")}>
        <PersonalInfo onBack={() => handleCloseView("personal")} userInfo={userInfo} walletAddress={stellarAddress} />
      </AnimatedView>

      {/* Security view */}
      <AnimatedView show={isViewActive("security")}>
        <SecuritySection onBack={() => handleCloseView("security")} />
      </AnimatedView>
    </div>
  );
};

export default SettingsScreen;