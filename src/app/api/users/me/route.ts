import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadProfileImage, isCloudinaryConfigured } from '@/lib/cloudinary';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  profileImage: z.string().optional(),
  emergencyContacts: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(2),
        phone: z.string().min(7),
        relationship: z.string().min(2),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
});

// ---------------------------------------------------------------------------
// Process and store a profile image.
//
// • Cloudinary configured  →  upload to CDN, return the CDN URL  (~100 chars)
// • Cloudinary not set     →  resize with sharp, write to public/uploads/,
//                             return a short path  ("/uploads/profile_xxx.jpg")
//
// We NEVER store a base64 data URL in the DB or JWT — a 60 KB base64 string
// would exceed the ~4 KB JWT cookie limit and silently break session updates.
// ---------------------------------------------------------------------------
async function processProfileImage(base64Image: string, userId: string): Promise<string> {
  if (isCloudinaryConfigured()) {
    const { url } = await uploadProfileImage(base64Image, userId);
    return url;
  }

  // Strip data-URL prefix if present
  const raw = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buf = await sharp(Buffer.from(raw, 'base64'))
    .resize(400, 400, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82 })
    .toBuffer();

  // Write to public/uploads/ — Next.js serves static files from public/ at /
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `profile_${userId}.jpg`;
  fs.writeFileSync(path.join(uploadsDir, filename), buf);

  // Return a short path — safe to store in the JWT token
  return `/uploads/${filename}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      emergencyContacts: { orderBy: { isPrimary: 'desc' } },
      _count: { select: { qrScans: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { passwordHash, profileImagePublicId, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { emergencyContacts, profileImage, ...updateData } = parsed.data;

  // ── Profile image ─────────────────────────────────────────────────────────
  if (profileImage) {
    try {
      const imageUrl = await processProfileImage(profileImage, session.user.id);
      (updateData as Record<string, unknown>).profileImage = imageUrl;
    } catch (err) {
      console.error('Image processing failed:', err);
      return NextResponse.json(
        { error: 'Image processing failed. Please try a different photo.' },
        { status: 500 }
      );
    }
  }

  // ── Database update ───────────────────────────────────────────────────────
  try {
    const updateOps: Promise<unknown>[] = [
      prisma.user.update({ where: { id: session.user.id }, data: updateData }),
    ];

    if (emergencyContacts) {
      updateOps.push(
        prisma.$transaction([
          prisma.emergencyContact.deleteMany({ where: { userId: session.user.id } }),
          prisma.emergencyContact.createMany({
            data: emergencyContacts.map((c, i) => ({
              userId: session.user.id,
              name: c.name,
              phone: c.phone,
              relationship: c.relationship,
              isPrimary: c.isPrimary ?? i === 0,
            })),
          }),
        ])
      );
    }

    await Promise.all(updateOps);
  } catch (err) {
    console.error('Database update failed:', err);
    return NextResponse.json(
      { error: 'Failed to save changes. Please try again.' },
      { status: 500 }
    );
  }

  // Return the new short URL so the client can update the session token
  const ud = updateData as Record<string, unknown>;
  return NextResponse.json({
    message: 'Profile updated successfully',
    profileImage: ud.profileImage as string | undefined,
    name:         ud.name         as string | undefined,
  });
}
