import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (email, password) => {
    await login(email, password);
    navigate('/dashboard');
  };

  return <AuthForm onSubmit={handleLogin} buttonText="Login" />;
}