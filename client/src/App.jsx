import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Eager load critical components (needed immediately)
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Sidebar from './components/Sidebar';
import AIAssistant from './components/AIAssistant';

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


function Layout({ children, user, setUser }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';

  // Return auth pages without any wrapper
  if (isAuthPage) {
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

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <LanguageProvider user={user} setUser={setUser}>
          <ExamProvider>
            <Layout user={user} setUser={setUser}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login setUser={setUser} />} />
                  <Route path="/signup" element={<Login setUser={setUser} />} /> {/* Assuming Login handles both or separate Signup component */}
                  <Route path="/" element={<LandingPage />} />
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
          </ExamProvider>
        </LanguageProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
