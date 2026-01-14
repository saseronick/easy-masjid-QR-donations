import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onCancel?: () => void;
}

export default function Login({ onCancel }: LoginProps) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email (e.g., name@example.com)';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return `Password must be at least 6 characters (currently ${password.length})`;
    }
    return '';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailTouched) {
      setEmailError(validateEmail(value));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordTouched) {
      setPasswordError(validatePassword(value));
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailTouched(true);
    setPasswordTouched(true);

    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);

    if (emailValidationError || passwordValidationError) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Wrong email or password. Please check and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account.');
        } else if (error.message.includes('User already registered')) {
          setError('This email is already registered. Try signing in instead.');
        } else {
          setError(error.message || 'Could not sign in. Please try again.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {onCancel && (
          <button
            onClick={onCancel}
            className="mb-4 flex items-center gap-2 text-gray-700 hover:text-gray-900 font-bold text-lg py-3 px-4 min-h-[56px] rounded-lg hover:bg-gray-100 transition-colors border-2 border-gray-300"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Back to Donation Page</span>
          </button>
        )}
        <div className="text-center mb-6">
          <LogIn className="w-12 h-12 text-green-700 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create Admin Account' : 'Admin Login'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isSignUp
              ? 'Register to manage your organization'
              : 'Sign in to manage your organizations'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <p className="text-sm text-gray-600 mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
              Example: admin@example.com
            </p>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                className={`w-full px-4 py-3 pr-12 min-h-[48px] border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  emailTouched && !emailError && email
                    ? 'border-green-500 focus:border-green-600 focus:ring-green-200'
                    : emailError
                    ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
                }`}
                placeholder="admin@example.com"
              />
              {emailTouched && email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailError ? (
                    <XCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {emailError && (
              <div className="mt-2 bg-red-50 border-2 border-red-300 rounded-lg p-2 flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-medium">{emailError}</p>
              </div>
            )}
            {emailTouched && !emailError && email && (
              <div className="mt-2 bg-green-50 border-2 border-green-300 rounded-lg p-2 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm font-medium">Correct email!</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            {isSignUp && (
              <p className="text-sm text-gray-600 mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                Must be at least 6 characters
              </p>
            )}
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={handlePasswordBlur}
                className={`w-full px-4 py-3 pr-12 min-h-[48px] border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  passwordTouched && !passwordError && password
                    ? 'border-green-500 focus:border-green-600 focus:ring-green-200'
                    : passwordError
                    ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
                }`}
                placeholder="••••••••"
                minLength={6}
              />
              {passwordTouched && password && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {passwordError ? (
                    <XCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {passwordError && (
              <div className="mt-2 bg-red-50 border-2 border-red-300 rounded-lg p-2 flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-medium">{passwordError}</p>
              </div>
            )}
            {passwordTouched && !passwordError && password && (
              <div className="mt-2 bg-green-50 border-2 border-green-300 rounded-lg p-2 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm font-medium">Password is strong!</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[50px] bg-green-700 text-white py-3 px-4 rounded-lg hover:bg-green-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-green-700 hover:text-green-800 text-sm font-medium py-3 px-4 min-h-[48px] rounded-lg hover:bg-green-50 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : 'Need an account? Sign up'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            For donation page, visit the main site
          </p>
        </div>
      </div>
    </div>
  );
}
