import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  statSync,
} from 'node:fs';

export function isBinaryFile(filePath: string, maxBytes = 1024): boolean {
  if (!existsSync(filePath)) {
    return false;
  }

  try {
    const buffer = Buffer.alloc(maxBytes);
    const fd = openSync(filePath, 'r');
    const bytesRead = readSync(fd, buffer, 0, maxBytes, 0);
    closeSync(fd);

    const chunk = buffer.slice(0, bytesRead);

    if (chunk.includes(0)) {
      return true;
    }

    const signatures = [
      [0x89, 0x50, 0x4e, 0x47],
      [0xff, 0xd8, 0xff],
      [0x47, 0x49, 0x46, 0x38],
      [0x25, 0x50, 0x44, 0x46],
      [0x50, 0x4b, 0x03, 0x04],
      [0x52, 0x61, 0x72, 0x21],
      [0x42, 0x5a, 0x68],
      [0x1f, 0x8b, 0x08],
      [0x7f, 0x45, 0x4c, 0x46],
    ];

    return signatures.some((signature) => {
      if (chunk.length < signature.length) return false;
      return signature.every((byte, i) => chunk[i] === byte);
    });
  } catch {
    return true;
  }
}

export function readFileContent(
  filePath: string,
  maxSizeBytes: number,
): string | null {
  try {
    const stats = statSync(filePath);
    if (stats.size > maxSizeBytes) {
      return null;
    }
    return readFileSync(filePath, 'utf-8');
  } catch (_error) {
    return null;
  }
}
