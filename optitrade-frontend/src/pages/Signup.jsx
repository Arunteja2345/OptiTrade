import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSignup = async (email, password) => {
    await signup(email, password);
    navigate('/dashboard');
  };

  return <AuthForm onSubmit={handleSignup} buttonText="Signup" />;
}