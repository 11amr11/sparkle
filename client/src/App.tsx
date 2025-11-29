import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useInitTheme } from './store/useThemeStore';
import Login from './pages/Login';
import Register from './pages/Register';
import MobileLayout from './components/layout/MobileLayout';
import ChatList from './components/chat/ChatList';
import ChatScreen from './components/chat/ChatScreen';
import Contacts from './components/contacts/Contacts';
import Profile from './components/profile/Profile';

// Placeholder for Calls - will be implemented later
const Calls = () => <div className="p-4 text-center text-slate-500">Voice/Video Calls (Coming Soon)</div>;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

import { CallProvider } from './context/CallContext';
import { SocketProvider } from './context/SocketContext';

function App() {
  // Initialize theme
  useInitTheme();

  return (
    <SocketProvider>
      <CallProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
              <Route path="/" element={<ChatList />} />
              <Route path="/calls" element={<Calls />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="/chat/:id" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
          </Routes>
        </Router>
      </CallProvider>
    </SocketProvider>
  );
}

export default App;
