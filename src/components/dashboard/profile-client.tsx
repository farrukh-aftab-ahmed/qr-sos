'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { User, Phone, Mail, Save, Camera, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  emergencyContacts: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Name required'),
    phone: z.string().min(7, 'Phone required'),
    relationship: z.string().min(2, 'Relationship required'),
    isPrimary: z.boolean().optional(),
  })).min(1),
});
type FormData = z.infer<typeof schema>;

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  qrCodeId: string | null;
  emergencyContacts: EmergencyContact[];
}

export function ProfileClient({ user }: { user: UserData }) {
  const { update: updateSession } = useSession();
  const [profileImage, setProfileImage] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string>(user.profileImage || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      phone: user.phone,
      emergencyContacts: user.emergencyContacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
        isPrimary: c.isPrimary,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'emergencyContacts' });

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfileImage(result);
      setPreviewImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const onSubmit = async (data: FormData) => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ...(profileImage ? { profileImage } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');

      // Refresh the JWT so the nav avatar / name update immediately
      await updateSession({
        ...(json.profileImage ? { profileImage: json.profileImage } : {}),
        ...(data.name         ? { name: data.name }                 : {}),
      });

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-display font-black text-3xl text-white">My Profile</h1>
        <p className="text-white/40 mt-1">Keep your emergency information up to date.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Photo */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-white flex items-center gap-2 mb-5">
            <Camera className="w-4 h-4 text-[#FF6B35]" />
            Profile Photo
          </h2>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex-shrink-0 shadow-[0_0_20px_rgba(255,45,85,0.2)]">
              {previewImage ? (
                // previewImage may be a data: URL (before Cloudinary upload) or a Cloudinary URL —
                // use plain <img> so both cases render without the Next.js optimisation pipeline
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                  {getInitials(user.name)}
                </span>
              )}
            </div>
            <div
              {...getRootProps()}
              className={`flex-1 min-w-48 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all text-center ${
                isDragActive ? 'border-[#FF2D55] bg-[#FF2D55]/5' : 'border-white/15 hover:border-white/30 hover:bg-white/3'
              }`}
            >
              <input {...getInputProps()} />
              <Camera className="w-6 h-6 text-white/30 mx-auto mb-2" />
              <p className="text-white/60 text-sm">Drop a photo or click to browse</p>
              <p className="text-white/30 text-xs mt-0.5">JPG, PNG — max 5MB</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-white flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-[#64D2FF]" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">Full Name</label>
              <input {...register('name')} className="sos-input w-full px-4 py-3 text-sm" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">Phone Number</label>
              <input {...register('phone')} type="tel" className="sos-input w-full px-4 py-3 text-sm" />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">Email Address</label>
              <input value={user.email} disabled className="sos-input w-full px-4 py-3 text-sm opacity-50 cursor-not-allowed" />
              <p className="text-white/25 text-xs mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-white flex items-center gap-2 mb-5">
            <Phone className="w-4 h-4 text-[#FF2D55]" />
            Emergency Contacts
          </h2>
          <div className="space-y-4">
            {fields.map((field, i) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-xs font-medium uppercase tracking-wider">
                    {i === 0 ? '⭐ Primary' : `Contact ${i + 1}`}
                  </span>
                  {i > 0 && (
                    <button type="button" onClick={() => remove(i)} className="text-red-400/50 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input {...register(`emergencyContacts.${i}.name`)} placeholder="Contact name" className="sos-input w-full px-3 py-2.5 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input {...register(`emergencyContacts.${i}.phone`)} type="tel" placeholder="Phone number" className="sos-input w-full px-3 py-2.5 text-sm" />
                  <input {...register(`emergencyContacts.${i}.relationship`)} placeholder="Relationship" className="sos-input w-full px-3 py-2.5 text-sm" />
                </div>
              </motion.div>
            ))}
            {fields.length < 3 && (
              <button
                type="button"
                onClick={() => append({ name: '', phone: '', relationship: '', isPrimary: false })}
                className="w-full py-3 border border-dashed border-white/15 rounded-xl text-white/40 hover:text-white/60 hover:border-white/25 text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            )}
          </div>
        </div>

        {/* Status messages */}
        {status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-[#30D158]/10 border border-[#30D158]/20 rounded-xl p-3">
            <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
            <p className="text-[#30D158] text-sm">Profile updated successfully!</p>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">{errorMsg}</p>
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={status === 'saving'}
          className="sos-button px-8 py-3.5 flex items-center gap-2 text-sm"
          whileHover={{ scale: status === 'saving' ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {status === 'saving' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
