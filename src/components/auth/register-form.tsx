'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Eye, EyeOff, UserPlus, Upload, Plus, Trash2, AlertCircle, ChevronRight, ChevronLeft, Camera } from 'lucide-react';
import Image from 'next/image';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  emergencyContacts: z.array(z.object({
    name: z.string().min(2, 'Name required'),
    phone: z.string().min(7, 'Phone required'),
    relationship: z.string().min(2, 'Relationship required'),
  })).min(1, 'Add at least one emergency contact'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const STEPS = ['Personal Info', 'Security', 'Emergency Contacts', 'Photo'];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [step, setStep] = useState(0);
  const [profileImage, setProfileImage] = useState<string>('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { emergencyContacts: [{ name: '', phone: '', relationship: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'emergencyContacts' });

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setProfileImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const nextStep = async () => {
    let valid: boolean;

    if (step === 2) {
      // react-hook-form requires explicit nested paths to validate array items —
      // passing 'emergencyContacts' alone only checks the array-level rule (min 1),
      // not the fields inside each item.
      const nestedPaths = fields.flatMap((_, i) => [
        `emergencyContacts.${i}.name`,
        `emergencyContacts.${i}.phone`,
        `emergencyContacts.${i}.relationship`,
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      valid = await trigger(nestedPaths as any);
    } else {
      const stepFields: Record<number, (keyof FormData)[]> = {
        0: ['name', 'email', 'phone'],
        1: ['password', 'confirmPassword'],
      };
      valid = await trigger(stepFields[step]);
    }

    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, profileImage: profileImage || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Registration failed');
      const loginUrl = callbackUrl !== '/dashboard'
        ? `/login?registered=1&callbackUrl=${encodeURIComponent(callbackUrl)}`
        : '/login?registered=1';
      router.push(loginUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg"
    >
      <div className="glass-card p-8 border border-white/10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="QR-SOS"
              width={80}
              height={80}
              className="h-16 w-auto object-contain mx-auto drop-shadow-[0_0_16px_rgba(255,45,85,0.3)]"
            />
          </div>
          <h1 className="font-display font-black text-2xl text-white mb-1">Create Your Safety Profile</h1>
          <p className="text-white/40 text-sm">Free forever · Setup in 2 minutes</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-gradient-to-r from-[#FF2D55] to-[#FF6B35]' : 'bg-white/10'}`} />
              {i < STEPS.length - 1 && <div className="w-2" />}
            </div>
          ))}
        </div>
        <p className="text-white/40 text-xs mb-6">Step {step + 1} of {STEPS.length}: <span className="text-white/70">{STEPS[step]}</span></p>

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

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 0: Personal Info */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">Full Name</label>
                  <input {...register('name')} placeholder="John Doe" className="sos-input w-full px-4 py-3 text-sm" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">Email Address</label>
                  <input {...register('email')} type="email" placeholder="you@example.com" className="sos-input w-full px-4 py-3 text-sm" />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">Phone Number</label>
                  <input {...register('phone')} type="tel" placeholder="+1 (555) 000-0000" className="sos-input w-full px-4 py-3 text-sm" />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 1: Security */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" className="sos-input w-full px-4 py-3 text-sm pr-11" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" className="sos-input w-full px-4 py-3 text-sm pr-11" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 2: Emergency Contacts */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-white/40 text-xs">Add people who should be contacted in an emergency. First contact is primary.</p>
                {fields.map((field, i) => (
                  <div key={field.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-xs font-medium uppercase tracking-wider">{i === 0 ? 'Primary Contact' : `Contact ${i + 1}`}</span>
                      {i > 0 && (
                        <button type="button" onClick={() => remove(i)} className="text-red-400/60 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <input {...register(`emergencyContacts.${i}.name`)} placeholder="Contact name" className="sos-input w-full px-3 py-2.5 text-sm" />
                      {errors.emergencyContacts?.[i]?.name && (
                        <p className="text-red-400 text-xs mt-1">{errors.emergencyContacts[i].name?.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input {...register(`emergencyContacts.${i}.phone`)} type="tel" placeholder="Phone" className="sos-input w-full px-3 py-2.5 text-sm" />
                        {errors.emergencyContacts?.[i]?.phone && (
                          <p className="text-red-400 text-xs mt-1">{errors.emergencyContacts[i].phone?.message}</p>
                        )}
                      </div>
                      <div>
                        <input {...register(`emergencyContacts.${i}.relationship`)} placeholder="Relationship (min 2 chars)" className="sos-input w-full px-3 py-2.5 text-sm" />
                        {errors.emergencyContacts?.[i]?.relationship && (
                          <p className="text-red-400 text-xs mt-1">{errors.emergencyContacts[i].relationship?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {fields.length < 3 && (
                  <button
                    type="button"
                    onClick={() => append({ name: '', phone: '', relationship: '' })}
                    className="w-full py-2.5 border border-dashed border-white/20 rounded-xl text-white/40 hover:text-white/70 hover:border-white/30 text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Contact
                  </button>
                )}
                {errors.emergencyContacts && typeof errors.emergencyContacts === 'object' && 'message' in errors.emergencyContacts && (
                  <p className="text-red-400 text-xs">{String(errors.emergencyContacts.message)}</p>
                )}
              </motion.div>
            )}

            {/* Step 3: Photo */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <p className="text-white/40 text-sm text-center">Add your photo to help responders identify you (optional but recommended).</p>
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? 'border-[#FF2D55] bg-[#FF2D55]/5'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  {profileImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FF2D55]/40">
                        {/* profileImage is a base64 data URL — use <img> not <Image> */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-white/60 text-sm">Photo selected · Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white/30" />
                      </div>
                      <div>
                        <p className="text-white/70 text-sm font-medium">Drop your photo here</p>
                        <p className="text-white/30 text-xs mt-1">PNG, JPG up to 5MB</p>
                      </div>
                      <div className="flex items-center gap-2 text-[#FF6B35] text-sm">
                        <Upload className="w-4 h-4" />
                        Browse Files
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className={`flex gap-3 mt-8 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
            {step > 0 && (
              <motion.button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-5 py-3 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </motion.button>
            )}
            {step < STEPS.length - 1 ? (
              <motion.button
                type="button"
                onClick={nextStep}
                className="sos-button flex-1 py-3 flex items-center justify-center gap-2 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="sos-button flex-1 py-3 flex items-center justify-center gap-2 text-sm"
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create My Safety Profile
                  </>
                )}
              </motion.button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/40 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-[#FF6B35] hover:text-[#FF2D55] font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
