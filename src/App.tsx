import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { IncomeTracker } from './components/IncomeTracker';
import { ExpenseTracker } from './components/ExpenseTracker';
import { InvoiceSystem } from './components/InvoiceSystem';
import { TaxInsights } from './components/TaxInsights';
import { PricingAssistant } from './components/PricingAssistant';
import { SavingsTracker } from './components/SavingsTracker';
import { LearnHub } from './components/LearnHub';
import { ProfileManager } from './components/ProfileManager';

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MyGig-Economy...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  // Check if user has completed onboarding
  const hasCompletedOnboarding = profile.user_types.length > 0 && profile.platforms.length > 0;

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'income':
        return <IncomeTracker />;
      case 'expenses':
        return <ExpenseTracker />;
      case 'invoices':
        return <InvoiceSystem />;
      case 'tax':
        return <TaxInsights />;
      case 'pricing':
        return <PricingAssistant />;
      case 'savings':
        return <SavingsTracker />;
      case 'learn':
        return <LearnHub />;
      case 'profile':
        return <ProfileManager />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
