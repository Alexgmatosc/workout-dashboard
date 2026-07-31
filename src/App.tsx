import { useState } from 'react';
import DashboardGym from './components/DashboardGym';
import { UnauthorizedScreen } from './components/UnauthorizedScreen';
import { authLib } from './lib/auth';

function App() {
  const [authenticated, setAuthenticated] = useState(() => authLib.isAuthenticated());

  if (!authenticated) {
    return <UnauthorizedScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <main className="min-h-screen bg-background">
      <DashboardGym />
    </main>
  );
}

export default App;