import type { Metadata } from 'next';
import { ScanPageClient } from '@/components/scan/scan-page-client';

export const metadata: Metadata = { title: 'QR Scan — QR-SOS' };

export default async function ScanPage({ params }: { params: Promise<{ qrCodeId: string }> }) {
  const { qrCodeId } = await params;
  return <ScanPageClient qrCodeId={qrCodeId} />;
}
