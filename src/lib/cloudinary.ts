import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** Returns true only when real (non-placeholder) Cloudinary credentials are set. */
export function isCloudinaryConfigured(): boolean {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key  = process.env.CLOUDINARY_API_KEY;
  const sec  = process.env.CLOUDINARY_API_SECRET;
  return !!(
    name && !name.startsWith('your-') &&
    key  && !key.startsWith('your-') &&
    sec  && !sec.startsWith('your-')
  );
}

export async function uploadProfileImage(
  base64Image: string,
  userId: string
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'qr-sos/profiles',
    public_id: `user_${userId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
