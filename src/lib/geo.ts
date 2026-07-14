export async function getIpLocation(ip: string): Promise<{ city?: string; country?: string }> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) return {};
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return {};
    const data = await res.json() as { status: string; city?: string; country?: string };
    if (data.status === 'success') return { city: data.city, country: data.country };
    return {};
  } catch {
    return {};
  }
}
