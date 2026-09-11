import React, { useState } from 'react';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ElectionsPage from './pages/ElectionsPage';
import ElectionDetailPage from './pages/ElectionDetailPage';
import ResultsPage from './pages/ResultsPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const [activePage, setActivePage] = useState('landing');
  const [selectedElectionId, setSelectedElectionId] = useState(1);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingPage setActivePage={setActivePage} />
        )}

        {activePage === 'dashboard' && (
          <DashboardPage
            setActivePage={setActivePage}
            setSelectedElectionId={setSelectedElectionId}
          />
        )}

        {activePage === 'elections' && (
          <ElectionsPage
            setActivePage={setActivePage}
            setSelectedElectionId={setSelectedElectionId}
          />
        )}

        {activePage === 'electionDetail' && (
          <ElectionDetailPage
            electionId={selectedElectionId}
            setActivePage={setActivePage}
            setSelectedElectionId={setSelectedElectionId}
          />
        )}

        {activePage === 'results' && (
          <ResultsPage
            electionId={selectedElectionId}
            setActivePage={setActivePage}
            setSelectedElectionId={setSelectedElectionId}
          />
        )}

        {activePage === 'admin' && (
          <AdminPage
            setActivePage={setActivePage}
            setSelectedElectionId={setSelectedElectionId}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}
