import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import TeamPage from './pages/TeamPage';
import LoginPage from './pages/LoginPage';
import MagicLinkVerifyPage from './pages/MagicLinkVerifyPage';
import OnboardingPage from './pages/OnboardingPage';
import ProfilePage from './pages/ProfilePage';
import TestPage from './pages/TestPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  console.log('App: Rendering App component');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
          <Route path="/auth/magic-link/verify" element={<MagicLinkVerifyPage />} />
          
          {/* Test and debug routes */}
          <Route path="/test" element={<TestPage />} />
          <Route path="/profile-debug" element={<ProfilePage />} />
          
          {/* Protected routes */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute requireOnboarding>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
