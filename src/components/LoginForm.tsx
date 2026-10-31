import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormValidationErrors } from '../types/auth';

interface LoginFormProps {
  onForgotPasswordClick: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPasswordClick,
  onSuccess,
}) => {
  const { signInWithEmail, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormValidationErrors>({});

  const validate = (): boolean => {
    const newErrors: FormValidationErrors = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address (e.g., name@company.com).';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    if (!isConfigured) {
      setErrors({
        general:
          'Supabase is not configured yet. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { user, error } = await signInWithEmail(email, password);

      if (error) {
        setIsSubmitting(false);
        // Translate Supabase error messages to friendly text
        let message = error.message;
        if (message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please verify your credentials and try again.';
        } else if (message.includes('Email not confirmed')) {
          message = 'Please verify your email address before signing in.';
        }
        setErrors({ general: message });
      } else if (user) {
        setIsSuccess(true);
        setIsSubmitting(false);
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          navigate('/dashboard');
        }, 300);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrors({
        general: err instanceof Error ? err.message : 'An unexpected error occurred during sign in.',
      });
    }
  };

  return (
    <form
      id="authForm"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 w-full"
    >
      {/* General Alert */}
      {errors.general && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 font-medium">{errors.general}</div>
        </div>
      )}

      {/* Email Input Group */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="emailInput"
          className="text-xs uppercase tracking-wider text-[#A9BAD4] font-semibold flex items-center justify-between"
        >
          <span>Email Address</span>
          {errors.email && (
            <span className="text-[11px] text-red-400 font-normal normal-case">
              {errors.email}
            </span>
          )}
        </label>
        <div className="relative flex items-center">
          <Mail
            className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="emailInput"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email || errors.general) {
                setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
              }
            }}
            placeholder="name@company.com"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full h-11 pl-10 pr-4 rounded-lg bg-white text-[#172B4D] placeholder:text-slate-400 text-sm font-medium transition-all shadow-sm focus:outline-none ${
              errors.email
                ? 'ring-2 ring-red-500 border border-red-500'
                : 'border border-[rgba(169,186,212,0.4)] focus:ring-2 focus:ring-[#2563EB]'
            }`}
          />
        </div>
      </div>

      {/* Password Input Group */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="passwordInput"
            className="text-xs uppercase tracking-wider text-[#A9BAD4] font-semibold"
          >
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-xs text-[#75A7FF] hover:text-white transition-colors focus:outline-none focus:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        <div className="relative flex items-center">
          <Lock
            className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="passwordInput"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password || errors.general) {
                setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
              }
            }}
            placeholder="••••••••••••"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`w-full h-11 pl-10 pr-11 rounded-lg bg-white text-[#172B4D] placeholder:text-slate-400 text-sm font-medium transition-all shadow-sm focus:outline-none ${
              errors.password
                ? 'ring-2 ring-red-500 border border-red-500'
                : 'border border-[rgba(169,186,212,0.4)] focus:ring-2 focus:ring-[#2563EB]'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <span id="password-error" className="text-[11px] text-red-400 mt-0.5">
            {errors.password}
          </span>
        )}
      </div>

      {/* Remember Device Checkbox */}
      <div className="flex items-center gap-2 pt-0.5">
        <label className="relative flex items-center cursor-pointer select-none">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="peer sr-only"
          />
          <div className="w-4 h-4 rounded bg-[#081426] border border-[#A9BAD4]/40 peer-checked:bg-[#2563EB] peer-checked:border-[#2563EB] flex items-center justify-center transition-all">
            <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]" />
          </div>
          <span className="ml-2.5 text-xs text-[#A9BAD4] font-normal hover:text-white transition-colors">
            Remember this device for 30 days
          </span>
        </label>
      </div>

      {/* Primary Submit Button */}
      <button
        type="submit"
        id="signInBtn"
        disabled={isSubmitting || isSuccess}
        className={`w-full h-11 rounded-lg px-6 font-semibold text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1 focus:outline-none focus:ring-2 focus:ring-[#75A7FF] focus:ring-offset-2 focus:ring-offset-[#10223D] ${
          isSuccess
            ? 'bg-emerald-600 text-white'
            : 'bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white disabled:opacity-70 disabled:cursor-not-allowed shadow-blue-900/40'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
            <span>Authenticating...</span>
          </>
        ) : isSuccess ? (
          <>
            <Check className="w-4 h-4 text-white" />
            <span>Authenticated</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
};
