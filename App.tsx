import React, { useState, useEffect, useRef } from 'react';
import { optimizeResumeWithGemini } from './services/geminiService';
import { ResumeInput } from './components/ResumeInput';
import { ResumeResult } from './components/ResumeResult';
import { Button } from './components/Button';
import { AppState, ToastNotification, OptimizationResult, PlanLevel } from './types';
import { useAuth } from './context/AuthContext';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = "max-w-sm" }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Focus the modal content for screen readers/keyboard users
      modalRef.current?.focus();
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 ring-1 ring-black/5 flex flex-col max-h-[90vh] outline-none`}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 id="modal-title" className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-5 text-slate-900 dark:text-slate-200 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// Plan Card Component
const PlanCard: React.FC<{ 
  name: string; 
  price: string; 
  features: string[]; 
  recommended?: boolean; 
  onSelect: () => void; 
  current?: boolean; 
  isLoading?: boolean 
}> = ({ name, price, features, recommended, onSelect, current, isLoading }) => (
  <div className={`relative p-4 rounded-xl border flex flex-col h-full transition-all ${
    recommended 
      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500/20' 
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
  } ${current ? 'opacity-60 grayscale' : 'hover:border-blue-300 dark:hover:border-blue-700'}`}>
    
    {recommended && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
        Best Value
      </div>
    )}

    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{name}</h3>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{price}</span>
        {price !== 'Free' && <span className="text-xs text-slate-500 dark:text-slate-400">/one-time</span>}
      </div>
    </div>

    <ul className="space-y-2 mb-6 flex-grow">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          {f}
        </li>
      ))}
    </ul>

    <Button 
      onClick={onSelect} 
      disabled={current} 
      isLoading={isLoading}
      variant={recommended ? 'primary' : 'outline'} 
      size="sm" 
      className="w-full"
      aria-label={current ? `Current plan: ${name}` : `Select ${name} plan`}
    >
      {current ? 'Current Plan' : 'Select Plan'}
    </Button>
  </div>
);

const App: React.FC = () => {
  const { user, login, logout, upgradeToPlan, isLoading: isAuthLoading } = useAuth();
  
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [loadingText, setLoadingText] = useState('Optimizing...');
  
  const [showPricing, setShowPricing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resumate_theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('resumate_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Loading Message Cycle
  useEffect(() => {
    if (appState !== AppState.LOADING) return;

    const messages = [
      "Analyzing Resume...",
      "Extracting Keywords...",
      "Quantifying Achievements...",
      "Formatting Layout...",
      "Polishing Content..."
    ];
    let index = 0;
    setLoadingText(messages[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [appState]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleInputError = (message: string) => {
    addNotification(message, 'error');
  };

  const handleOptimize = async () => {
    if (!resumeText.trim()) {
      addNotification("Please enter your resume text.", "error");
      return;
    }

    const currentPlan = user?.plan || 'free';
    
    // For Ultimate Tier, Job Description is highly recommended/required for best results
    if (currentPlan === 'ultimate' && !jobDescription.trim()) {
       addNotification("Ultimate optimization works best with a Job Description.", "info");
    }
    
    setAppState(AppState.LOADING);
    
    // Initialize empty result for streaming
    setResult({
      optimizedContent: '',
      planUsed: currentPlan,
      timestamp: Date.now()
    });

    try {
      const onStream = (text: string) => {
        setResult(prev => ({
          optimizedContent: text,
          planUsed: prev?.planUsed || currentPlan,
          timestamp: prev?.timestamp || Date.now(),
          coverLetter: prev?.coverLetter,
          atsScore: prev?.atsScore
        }));
        setAppState(AppState.STREAMING);
      };

      const optimizationResult = await optimizeResumeWithGemini(
        resumeText, 
        jobDescription, 
        currentPlan,
        onStream
      );
      
      setResult(optimizationResult);
      setAppState(AppState.SUCCESS);
      addNotification(`Optimization complete (${currentPlan.toUpperCase()}).`, "success");
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      addNotification(error.message || "Failed to optimize. Check API Key.", "error");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResult(null);
  };

  const handleUpgrade = async (plan: PlanLevel) => {
    try {
      if (!user) {
        addNotification("Please log in to upgrade.", "info");
        await login();
        // Don't return, let them upgrade after login simulation if we were real
        // But for this demo structure, the context login sets a default 'free' user.
        return; 
      }
      await upgradeToPlan(plan);
      addNotification(`Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`, "success");
      setShowPricing(false);
    } catch (error) {
      console.error(error);
      addNotification("Failed to upgrade subscription. Please try again.", "error");
    }
  };
  
  const handleLogin = async () => {
    try {
      await login();
      addNotification("Logged in successfully.", "success");
    } catch (error) {
       console.error(error);
       addNotification("Failed to log in.", "error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Notifications */}
      <div 
        className="fixed top-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none"
        role="status" 
        aria-live="polite"
      >
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`pointer-events-auto px-4 py-2.5 rounded-md shadow-xl text-white font-medium text-xs tracking-wide animate-in slide-in-from-right fade-in duration-300 max-w-sm border border-white/10 ${
              n.type === 'success' ? 'bg-slate-900 dark:bg-slate-800' : 
              n.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* Pricing Modal */}
      <Modal isOpen={showPricing} onClose={() => setShowPricing(false)} title="Choose Your Edge" maxWidth="max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
          
          <PlanCard 
            name="Premium" 
            price="$4.99" 
            current={user?.plan === 'premium'}
            isLoading={isAuthLoading}
            onSelect={() => handleUpgrade('premium')}
            features={[
              "Full Resume Rewrite",
              "ATS-Friendly Formatting",
              "Impactful Action Verbs",
              "Full Download Access"
            ]}
          />

          <PlanCard 
            name="Executive" 
            price="$9.99" 
            current={user?.plan === 'executive'}
            isLoading={isAuthLoading}
            onSelect={() => handleUpgrade('executive')}
            features={[
              "Everything in Premium",
              "Executive/Director Tone",
              "Strategy & Leadership Focus",
              "Metric-Driven Bullets",
              "Powered by Gemini 2.5"
            ]}
          />

          <PlanCard 
            name="Ultimate" 
            price="$19.99" 
            recommended={true}
            current={user?.plan === 'ultimate'}
            isLoading={isAuthLoading}
            onSelect={() => handleUpgrade('ultimate')}
            features={[
              "Everything in Executive",
              "Job Description Tailoring",
              "ATS Match Score (0-100)",
              "Custom Cover Letter",
              "Recruiter Keyword targeting"
            ]}
          />
          
          {/* Revert/Free Option for Demo */}
          <PlanCard 
            name="Free Fix" 
            price="Free" 
            current={!user || user?.plan === 'free'}
            isLoading={isAuthLoading}
            onSelect={() => handleUpgrade('free')}
            features={[
              "Grammar & Spelling Fix",
              "Improved Flow",
              "Preview Only (No Download)",
              "Basic Action Verbs"
            ]}
          />
        </div>
        <div className="mt-6 text-center">
           <p className="text-xs text-slate-500">Secure payment processing via Stripe. 100% Satisfaction Guarantee.</p>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="h-8 w-8 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs" aria-hidden="true">
              {user ? user.email.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">{user ? user.email : 'Guest User'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.plan || 'Free'} Plan</p>
            </div>
            {user ? (
               <Button variant="ghost" size="xs" onClick={() => { logout(); setShowSettings(false); }}>Sign Out</Button>
            ) : (
               <Button variant="outline" size="xs" onClick={handleLogin}>Log In</Button>
            )}
          </div>
          
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Session</h5>
             <Button variant="danger" size="sm" onClick={() => { window.location.reload(); }} className="w-full justify-center">
               Reset Everything
             </Button>
          </div>
        </div>
      </Modal>

      {/* Header - Slim Toolbar Style */}
      <header className="h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 flex items-center justify-between px-4 z-30 relative transition-colors">
        
        {/* Left: Brand */}
        <button 
          className="flex items-center gap-2 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-slate-400 rounded p-1" 
          onClick={handleReset}
          onKeyDown={(e) => handleKeyDown(e, handleReset)}
          aria-label="ResuMate Home - Reset Application"
        >
          <div className="w-6 h-6 bg-slate-900 dark:bg-white rounded-[4px] flex items-center justify-center text-white dark:text-slate-900 group-hover:scale-105 transition-transform" aria-hidden="true">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            ResuMate
          </h1>
          {user && user.plan !== 'free' && (
             <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
               {user.plan}
             </span>
          )}
        </button>
        
        {/* Center: (Placeholder for potential tabs/actions) */}
        <div className="hidden md:flex items-center space-x-1">
          {/* Could add mode switcher here later */}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
           {/* Theme Toggle */}
           <button 
             onClick={toggleTheme} 
             className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
             title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
             aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
           >
             {theme === 'dark' ? (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
             ) : (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
             )}
           </button>

           <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" aria-hidden="true"></div>

           {!user && (
             <Button variant="ghost" size="xs" onClick={handleLogin} isLoading={isAuthLoading}>Log In</Button>
           )}
           <button onClick={() => setShowPricing(true)} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
             Pricing
           </button>
           <button 
            onClick={() => setShowSettings(true)} 
            className="ml-1 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors border border-transparent dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="User Settings"
           >
             {user ? (
                <span className="text-xs font-bold">{user.email.charAt(0).toUpperCase()}</span>
             ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             )}
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        
        {(appState === AppState.SUCCESS || appState === AppState.STREAMING) && result ? (
          /* Result View (Full Height) */
          <div className="h-full w-full absolute inset-0 animate-in fade-in duration-500">
            <ResumeResult 
              result={result} 
              onCopy={() => {}} 
              onReset={handleReset}
              userPlan={user?.plan || 'free'}
              onUpgrade={() => setShowPricing(true)}
              onError={handleInputError}
            />
          </div>
        ) : (
          /* Input View (Split Pane) */
          <div className="h-full w-full max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 transition-colors">
             {/* Left Pane: Introduction & JD */}
             <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20 shadow-sm transition-colors">
                   <h2 className="text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-1 flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     How it works
                   </h2>
                   <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                     Paste your resume to get started. For the <strong>Ultimate</strong> experience, include the Job Description to get a tailored rewrite and ATS score.
                   </p>
                </div>
                <div className="flex-grow min-h-0">
                   <ResumeInput 
                    label="Job Description"
                    value={jobDescription}
                    onChange={setJobDescription}
                    placeholder="Paste Job Description here (Recommended for Ultimate Tier)..."
                    helperText="We'll extract keywords from this to optimize your resume."
                    onError={handleInputError}
                    disabled={appState === AppState.LOADING}
                  />
                </div>
             </div>

             {/* Right Pane: Resume & Action */}
             <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="flex-grow min-h-0">
                  <ResumeInput 
                    label="Original Resume"
                    value={resumeText}
                    onChange={setResumeText}
                    placeholder="Paste your current resume content here..."
                    onError={handleInputError}
                    disabled={appState === AppState.LOADING}
                  />
                </div>
                <Button 
                  onClick={handleOptimize}
                  isLoading={appState === AppState.LOADING}
                  disabled={!resumeText}
                  className="w-full h-12 text-sm shadow-md"
                  variant="primary"
                >
                  {appState === AppState.LOADING ? loadingText : (
                    !user || user.plan === 'free' ? 'Optimize Resume (Free Preview)' : 
                    `Generate ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Package`
                  )}
                </Button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;