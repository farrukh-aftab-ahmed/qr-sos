import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authRateLimit } from '@/lib/redis';
import { uploadProfileImage, isCloudinaryConfigured } from '@/lib/cloudinary';
import { generateQRDataURL } from '@/lib/qr-generator';
import { sendWelcomeEmail } from '@/lib/notifications';
import { getClientIp } from '@/lib/utils';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processProfileImage(base64Image: string, userId: string): Promise<{ url: string; publicId?: string }> {
  if (isCloudinaryConfigured()) {
    const { url, publicId } = await uploadProfileImage(base64Image, userId);
    return { url, publicId };
  }
  // Fallback: resize with sharp, write to public/uploads/ (short URL — safe for JWT cookie)
  const raw = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buf = await sharp(Buffer.from(raw, 'base64'))
    .resize(400, 400, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82 })
    .toBuffer();

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `profile_${userId}.jpg`;
  fs.writeFileSync(path.join(uploadsDir, filename), buf);
  return { url: `/uploads/${filename}` };
}

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(128),
  profileImage: z.string().optional(),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(2),
        phone: z.string().min(7),
        relationship: z.string().min(2),
        isPrimary: z.boolean().optional(),
      })
    )
    .min(1)
    .max(3),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = await authRateLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const { name, email, phone, password, profileImage, emergencyContacts } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    const field = existing.email === email ? 'email' : 'phone number';
    return NextResponse.json({ error: `This ${field} is already registered` }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      emergencyContacts: {
        create: emergencyContacts.map((c, i) => ({
          ...c,
          isPrimary: c.isPrimary ?? i === 0,
        })),
      },
    },
  });

  // Upload / process profile image
  if (profileImage) {
    try {
      const { url, publicId } = await processProfileImage(profileImage, user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: { profileImage: url, ...(publicId ? { profileImagePublicId: publicId } : {}) },
      });
    } catch (err) {
      console.error('Profile image processing failed:', err);
      // Non-fatal — account is still created; user can upload photo later
    }
  }

  // Generate QR code data URL and store
  try {
    const qrDataUrl = await generateQRDataURL(user.qrCodeId!);
    await prisma.user.update({
      where: { id: user.id },
      data: { qrCode: qrDataUrl },
    });
  } catch (err) {
    console.error('QR generation failed:', err);
  }

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email, name).catch(console.error);

  return NextResponse.json(
    { message: 'Account created successfully', userId: user.id },
    { status: 201 }
  );
}
