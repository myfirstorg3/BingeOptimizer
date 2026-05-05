import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('blastoise_token'));
  const [loading, setLoading] = useState(true);

  // Set default axios headers
  axios.defaults.headers.common['ngrok-skip-browser-warning'] = "true";
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await axios.get((import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/auth/me");
          setUser(res.data);
        } catch (error) {
          console.error("Token invalid or expired");
          setToken(null);
          localStorage.removeItem('blastoise_token');
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/auth/login", { email, password });
    setToken(res.data.token);
    setUser(res.data);
    localStorage.setItem('blastoise_token', res.data.token);
  };

  const register = async (username, email, password) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/auth/register", { username, email, password });
    setToken(res.data.token);
    setUser(res.data);
    localStorage.setItem('blastoise_token', res.data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('blastoise_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
