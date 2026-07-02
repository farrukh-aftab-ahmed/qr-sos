import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

const storage = new Storage();

function getBucket() {
  return storage.bucket(process.env.GCS_BUCKET_NAME!);
}

export function isCloudinaryConfigured(): boolean {
  const bucket = process.env.GCS_BUCKET_NAME;
  return !!bucket && !bucket.startsWith('your-');
}

export async function uploadProfileImage(
  base64Image: string,
  userId: string
): Promise<{ url: string; publicId: string }> {
  const raw = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const resized = await sharp(Buffer.from(raw, 'base64'))
    .resize(400, 400, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toBuffer();

  const objectPath = `profiles/user_${userId}.webp`;
  const file = getBucket().file(objectPath);
  await file.save(resized, { contentType: 'image/webp', public: true });

  return {
    url: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${objectPath}`,
    publicId: objectPath,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  await getBucket().file(publicId).delete({ ignoreNotFound: true });
}
