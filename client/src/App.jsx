import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Eager load critical components (needed immediately)
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Sidebar from './components/Sidebar';
import AIAssistant from './components/AIAssistant';
import ErrorBoundary from './components/ErrorBoundary';

// Mobile components
import MobileLayout from './components/mobile/MobileLayout';
const MobileHome = lazy(() => import('./pages/mobile/MobileHome'));
const MobileWords = lazy(() => import('./pages/mobile/MobileWords'));
const MobileAddWord = lazy(() => import('./pages/mobile/MobileAddWord'));
const MobilePractice = lazy(() => import('./pages/mobile/MobilePractice'));
const MobileProfile = lazy(() => import('./pages/mobile/MobileProfile'));
const MobileFlashcard = lazy(() => import('./pages/mobile/MobileFlashcard'));
const MobileExam = lazy(() => import('./pages/mobile/MobileExam'));
const MobileExamCreate = lazy(() => import('./pages/mobile/MobileExamCreate'));
const MobileExamPlay = lazy(() => import('./pages/mobile/MobileExamPlay'));
const MobileGames = lazy(() => import('./pages/mobile/MobileGames'));
const MobileMemoryMatch = lazy(() => import('./pages/mobile/MobileMemoryMatch'));
const MobileTimeChallenge = lazy(() => import('./pages/mobile/MobileTimeChallenge'));
const MobileWordBuilder = lazy(() => import('./pages/mobile/MobileWordBuilder'));
const MobileGrammar = lazy(() => import('./pages/mobile/MobileGrammar'));
const MobileGrammarReader = lazy(() => import('./pages/mobile/MobileGrammarReader'));
const MobileReader = lazy(() => import('./pages/mobile/MobileReader'));
const MobileGrammarGenerate = lazy(() => import('./pages/mobile/MobileGrammarGenerate'));
const MobileAIGenerator = lazy(() => import('./pages/mobile/MobileAIGenerator'));
const MobileGenStory = lazy(() => import('./pages/mobile/MobileGenStory'));
const MobileGenDialogue = lazy(() => import('./pages/mobile/MobileGenDialogue'));
const MobileGenArticle = lazy(() => import('./pages/mobile/MobileGenArticle'));
const MobileContentLibrary = lazy(() => import('./pages/mobile/MobileContentLibrary'));
const MobileStoryViewer = lazy(() => import('./pages/mobile/MobileStoryViewer'));
const MobileDialogueViewer = lazy(() => import('./pages/mobile/MobileDialogueViewer'));
const MobileArticleViewer = lazy(() => import('./pages/mobile/MobileArticleViewer'));
const MobileEditProfile = lazy(() => import('./pages/mobile/MobileEditProfile'));
const MobileLanguageSettings = lazy(() => import('./pages/mobile/MobileLanguageSettings'));
const MobileSecuritySettings = lazy(() => import('./pages/mobile/MobileSecuritySettings'));
const MobileAPISettings = lazy(() => import('./pages/mobile/MobileAPISettings'));
const MobileHelp = lazy(() => import('./pages/mobile/MobileHelp'));
const MobileAbout = lazy(() => import('./pages/mobile/MobileAbout'));


// Lazy load pages (loaded on demand)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const VocabList = lazy(() => import('./pages/VocabList'));
const AddWord = lazy(() => import('./pages/AddWord'));
const QuizSelector = lazy(() => import('./pages/QuizSelector'));
const QuizPlay = lazy(() => import('./pages/QuizPlay'));
const Profile = lazy(() => import('./pages/Profile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const StatsDashboard = lazy(() => import('./pages/StatsDashboard'));
const MiniGames = lazy(() => import('./pages/MiniGames'));
const MemoryMatch = lazy(() => import('./pages/games/MemoryMatch'));
const SharedBank = lazy(() => import('./pages/SharedBank'));
const GrammarLibrary = lazy(() => import('./pages/GrammarLibrary'));
const GrammarPage = lazy(() => import('./pages/GrammarPage'));
const GrammarGenerator = lazy(() => import('./pages/GrammarGenerator'));
const ExamPage = lazy(() => import('./pages/ExamPage'));
const TextGenerator = lazy(() => import('./pages/TextGenerator'));
const PodcastCreator = lazy(() => import('./pages/PodcastCreator'));
const MyPodcasts = lazy(() => import('./pages/MyPodcasts'));
const TextReader = lazy(() => import('./pages/TextReader'));

// Advanced Text Generator
const AdvancedTextGenerator = lazy(() => import('./pages/AdvancedTextGenerator'));
const StoryViewer = lazy(() => import('./pages/StoryViewer'));
const DialogueViewer = lazy(() => import('./pages/DialogueViewer'));
const ArticleViewer = lazy(() => import('./pages/ArticleViewer'));
const GeneratedContentLibrary = lazy(() => import('./pages/GeneratedContentLibrary'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
  </div>
);

// Mobile-optimized loader
const MobileLoader = () => (
  <div className="flex justify-center items-center min-h-screen bg-slate-50">
    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

// Detect if device is mobile
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
};

// Mobile redirect component - redirects mobile users to /m routes
const MobileRedirect = ({ children }) => {
  const location = useLocation();
  const isMobile = isMobileDevice();
  const isMobilePath = location.pathname.startsWith('/m');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';

  // Map desktop routes to mobile routes
  const routeMapping = {
    '/dashboard': '/m',
    '/vocab': '/m/words',
    '/vocab/add': '/m/words/add',
    '/practice': '/m/practice',
    '/quiz': '/m/exam',
    '/games': '/m/games',
    '/profile': '/m/me',
    '/settings': '/m/me',
    '/grammar': '/m/grammar',
    '/ai-generator': '/m/ai',
    '/generated-content': '/m/ai/library',
  };

  // If mobile device and not already on mobile path (and not auth/landing)
  if (isMobile && !isMobilePath && !isAuthPage && !isLandingPage) {
    // Find matching mobile route or default to /m
    const mobileRoute = routeMapping[location.pathname] || '/m';
    return <Navigate to={mobileRoute} replace />;
  }

  return children;
};


function Layout({ children, user, setUser }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';
  const isMobilePath = location.pathname.startsWith('/m');

  // Return auth pages without any wrapper
  if (isAuthPage) {
    return children;
  }

  // Mobile routes are handled separately
  if (isMobilePath) {
    return children;
  }

  // Show sidebar only if user is logged in AND it's not an auth page AND it's not the landing page
  const showAuthComponents = user && !isAuthPage && !isLandingPage;

  if (isLandingPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {showAuthComponents && <Sidebar user={user} setUser={setUser} />}
      <main className={`flex-1 ${showAuthComponents ? 'lg:ml-64' : ''}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      {showAuthComponents && <AIAssistant />}
      {/* {showAuthComponents && <AISetupModal />} */}
    </div>
  );
}

import { LanguageProvider } from './context/LanguageContext';
import { ExamProvider } from './context/ExamContext';
import FloatingExamTimer from './components/FloatingExamTimer';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) return null; // Or a loading spinner
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  // Mobile protected route wrapper
  const MobileProtectedRoute = ({ children }) => {
    if (loading) return <MobileLoader />;
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Router>
          <LanguageProvider user={user} setUser={setUser}>
            <ExamProvider>
              <MobileRedirect>
                <Layout user={user} setUser={setUser}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Auth Routes */}
                      <Route path="/login" element={<Login setUser={setUser} />} />
                      <Route path="/signup" element={<Login setUser={setUser} />} />
                      <Route path="/" element={<LandingPage />} />

                      {/* ===== MOBILE ROUTES ===== */}
                      <Route path="/m" element={
                        <MobileProtectedRoute>
                          <Suspense fallback={<MobileLoader />}>
                            <MobileLayout />
                          </Suspense>
                        </MobileProtectedRoute>
                      }>
                        <Route index element={<MobileHome user={user} />} />
                        <Route path="words" element={<MobileWords />} />
                        <Route path="words/add" element={<MobileAddWord user={user} />} />
                        <Route path="words/edit/:id" element={<MobileAddWord user={user} />} />
                        <Route path="practice" element={<MobilePractice />} />
                        <Route path="practice/flashcard" element={<MobileFlashcard user={user} />} />
                        <Route path="exam" element={<MobileExam />} />
                        <Route path="exam/create" element={<MobileExamCreate />} />
                        <Route path="exam/play" element={<MobileExamPlay />} />
                        <Route path="exam/take/:id" element={<MobileExamPlay />} />
                        <Route path="exam/retake/:id" element={<MobileExamPlay />} />
                        <Route path="exam/review/:id" element={<MobileExamPlay />} />
                        <Route path="games" element={<MobileGames />} />
                        <Route path="games/memory" element={<MobileMemoryMatch />} />
                        <Route path="games/speed" element={<MobileTimeChallenge />} />
                        <Route path="games/builder" element={<MobileWordBuilder />} />
                        <Route path="grammar" element={<MobileGrammar />} />
                        <Route path="grammar/generate" element={<MobileGrammarGenerate />} />
                        <Route path="grammar/:id" element={<MobileGrammarReader />} />
                        <Route path="reader" element={<MobileReader />} />
                        <Route path="ai" element={<MobileAIGenerator />} />
                        <Route path="ai/story" element={<MobileGenStory />} />
                        <Route path="ai/dialogue" element={<MobileGenDialogue />} />
                        <Route path="ai/article" element={<MobileGenArticle />} />
                        <Route path="ai/library" element={<MobileContentLibrary />} />
                        {/* Mobile content viewers */}
                        <Route path="ai/story/:id" element={<MobileStoryViewer />} />
                        <Route path="ai/dialogue/:id" element={<MobileDialogueViewer />} />
                        <Route path="ai/article/:id" element={<MobileArticleViewer />} />
                        <Route path="me" element={<MobileProfile user={user} setUser={setUser} />} />
                        <Route path="me/edit" element={<MobileEditProfile user={user} setUser={setUser} />} />
                        <Route path="me/language" element={<MobileLanguageSettings user={user} setUser={setUser} />} />
                        <Route path="me/api-keys" element={<MobileAPISettings user={user} setUser={setUser} />} />
                        <Route path="me/security" element={<MobileSecuritySettings user={user} />} />
                        <Route path="me/help" element={<MobileHelp />} />
                        <Route path="me/about" element={<MobileAbout />} />
                      </Route>

                      {/* ===== DESKTOP ROUTES ===== */}
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
                      <Route path="/vocab" element={<ProtectedRoute><VocabList /></ProtectedRoute>} />
                      <Route path="/vocab/add" element={<ProtectedRoute><AddWord user={user} /></ProtectedRoute>} />
                      <Route path="/vocab/edit/:id" element={<ProtectedRoute><AddWord user={user} /></ProtectedRoute>} />
                      <Route path="/quiz" element={<ProtectedRoute><QuizSelector /></ProtectedRoute>} />
                      <Route path="/practice" element={<ProtectedRoute><QuizSelector /></ProtectedRoute>} />
                      <Route path="/quiz/play/:mode" element={<ProtectedRoute><QuizPlay user={user} /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profile user={user} /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/games" element={<ProtectedRoute><MiniGames /></ProtectedRoute>} />
                      <Route path="/games/memory" element={<ProtectedRoute><MemoryMatch /></ProtectedRoute>} />
                      <Route path="/shared" element={<ProtectedRoute><SharedBank /></ProtectedRoute>} />
                      <Route path="/stats" element={<ProtectedRoute><StatsDashboard /></ProtectedRoute>} />

                      {/* Advanced Text Generator */}
                      <Route path="/advanced-text-generator" element={<ProtectedRoute><AdvancedTextGenerator /></ProtectedRoute>} />
                      <Route path="/story/:id" element={<ProtectedRoute><StoryViewer /></ProtectedRoute>} />
                      <Route path="/dialogue/:id" element={<ProtectedRoute><DialogueViewer /></ProtectedRoute>} />
                      <Route path="/article/:id" element={<ProtectedRoute><ArticleViewer /></ProtectedRoute>} />
                      <Route path="/generated-content" element={<ProtectedRoute><GeneratedContentLibrary /></ProtectedRoute>} />
                      <Route path="/grammar" element={<ProtectedRoute><GrammarPage /></ProtectedRoute>} />
                      <Route path="/grammar/generate" element={<ProtectedRoute><GrammarGenerator /></ProtectedRoute>} />
                      <Route path="/exams" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
                      <Route path="/text-generator" element={<ProtectedRoute><TextGenerator /></ProtectedRoute>} />
                      <Route path="/podcast-creator" element={<ProtectedRoute><PodcastCreator /></ProtectedRoute>} />
                      <Route path="/podcasts" element={<ProtectedRoute><MyPodcasts /></ProtectedRoute>} />
                      <Route path="/reader" element={<ProtectedRoute><TextReader /></ProtectedRoute>} />
                    </Routes>
                  </Suspense>
                  <FloatingExamTimer />
                </Layout>
              </MobileRedirect>
            </ExamProvider>
          </LanguageProvider>
        </Router>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
