import { useState } from 'react';
import PlatformAdminDashboard from './components/PlatformAdminDashboard';
import FirmAdminDashboard      from './components/FirmAdminDashboard';
import AccountantDashboard     from './components/AccountantDashboard';
import CompanyDashboard        from './components/CompanyDashboard';
import MobileUpload            from './components/MobileUpload';
import MobileAccountant        from './components/MobileAccountant';
import LoginPage               from './components/LoginPage';
import LogoBrand               from './components/Logo';
import ProfileMenu             from './components/ProfileMenu';

const isMobile = () =>
  new URLSearchParams(window.location.search).has('mobile') ||
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  window.innerWidth < 768;

export default function App() {
  const [session, setSession] = useState(null);

  const handleLogin  = (data) => setSession(data);
  const handleLogout = () => setSession(null);

  if (!session) return <LoginPage onLogin={handleLogin} />;

  const { role } = session;
  const isCompanyRole = role === 'company_admin' || role === 'company_user';

  /* Mobile routing */
  if (isMobile()) {
    if (isCompanyRole)
      return <MobileUpload session={session} onLogout={handleLogout} onSessionUpdate={setSession} />;
    if (role === 'accountant')
      return <MobileAccountant session={session} onLogout={handleLogout} onSessionUpdate={setSession} />;
  }

  return (
    <div>
      <header className="app-header">
        <div className="header-brand" style={{ fontSize: 'unset', color: 'unset' }}>
          <LogoBrand size="sm" uid="hdr" />
        </div>
        <div className="header-controls">
          <ProfileMenu session={session} onLogout={handleLogout} />
        </div>
      </header>

      <main className="main-content">
        {role === 'platform_admin' && <PlatformAdminDashboard session={session} />}
        {role === 'firm_admin'     && <FirmAdminDashboard     session={session} />}
        {role === 'accountant'     && <AccountantDashboard    session={session} />}
        {isCompanyRole             && <CompanyDashboard        session={session} />}
      </main>
    </div>
  );
}
