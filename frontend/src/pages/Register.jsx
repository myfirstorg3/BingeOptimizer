import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      gsap.to('.register-container', { opacity: 0, y: -20, duration: 0.5, onComplete: () => navigate('/') });
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="register-container glass" style={{ maxWidth: '400px', margin: '100px auto', padding: '40px' }}>
      <h2 className="font-mono" style={{ marginBottom: '20px' }}>INITIALIZE // USER</h2>
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label className="font-mono text-muted" style={{ display: 'block', marginBottom: '5px' }}>USERNAME</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid #00e5ff', color: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label className="font-mono text-muted" style={{ display: 'block', marginBottom: '5px' }}>EMAIL</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid #00e5ff', color: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label className="font-mono text-muted" style={{ display: 'block', marginBottom: '5px' }}>PASSWORD</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid #00e5ff', color: '#fff' }}
          />
        </div>
        <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>REGISTER</button>
      </form>
    </div>
  );
}
