import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Write from './pages/Write';
import Post from './pages/Post';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Category from './pages/Category';
import SearchPage from './pages/Search';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/write" element={<Write />} />
            <Route path="/edit/:id" element={<Write />} />
            <Route path="/post/:id" element={<Post />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile/:uid" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/category/:categoryName" element={<Category />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
