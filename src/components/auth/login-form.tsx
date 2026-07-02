'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import Image from 'next/image';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (res?.error) {
      setError('Invalid email or password. Please try again.');
    } else {
      // Hard redirect — forces full page reload so the browser sends the
      // new session cookie with the dashboard request (router.push alone
      // does a client-side nav that can miss the freshly-set cookie).
      window.location.href = callbackUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="glass-card p-8 border border-white/10">
        <div className="text-center mb-8">
          <motion.div
            className="mb-4"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Image
              src="/logo.png"
              alt="QR-SOS"
              width={80}
              height={80}
              className="h-16 w-auto object-contain mx-auto drop-shadow-[0_0_16px_rgba(255,45,85,0.3)]"
              priority
            />
          </motion.div>
          <h1 className="font-display font-black text-2xl text-white mb-1">Welcome Back</h1>
          <p className="text-white/40 text-sm">Sign in to your QR-SOS account</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="sos-input w-full px-4 py-3 text-sm"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="sos-input w-full px-4 py-3 text-sm pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="sos-button w-full py-3.5 flex items-center justify-center gap-2 text-base"
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/40 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#FF6B35] hover:text-[#FF2D55] font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
