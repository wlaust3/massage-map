export type QrResult =
  | { ok: true; size: number; version: number; dense: boolean; path: string }
  | { ok: false; error: 'too-large' };

/** QR versions above this get hard to scan from another phone's camera, so the UI warns. */
export const DENSE_VERSION = 22;

/** Generate a QR code client-side. The `qrcode` library is loaded lazily so it stays out of the main bundle. */
export async function makeQr(text: string): Promise<QrResult> {
  const QRCode = (await import('qrcode')).default;
  try {
    // Lower error correction = fewer modules = larger, easier-to-scan squares for long links.
    const qr = QRCode.create(text, { errorCorrectionLevel: text.length > 500 ? 'L' : 'M' });
    const size = qr.modules.size;
    const data = qr.modules.data;
    let path = '';
    for (let y = 0; y < size; y++) {
      let x = 0;
      while (x < size) {
        if (data[y * size + x]) {
          let run = 1;
          while (x + run < size && data[y * size + x + run]) run++;
          path += `M${x} ${y}h${run}v1h-${run}z`;
          x += run;
        } else x++;
      }
    }
    return { ok: true, size, version: qr.version, dense: qr.version >= DENSE_VERSION, path };
  } catch {
    return { ok: false, error: 'too-large' };
  }
}
