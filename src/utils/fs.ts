import { readFileSync, existsSync, openSync, readSync, closeSync, statSync } from 'fs';

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
            [0x89, 0x50, 0x4E, 0x47], // PNG
            [0xFF, 0xD8, 0xFF],       // JPEG
            [0x47, 0x49, 0x46, 0x38], // GIF
            [0x25, 0x50, 0x44, 0x46], // PDF
            [0x50, 0x4B, 0x03, 0x04], // ZIP
            [0x52, 0x61, 0x72, 0x21], // RAR
            [0x42, 0x5A, 0x68],       // BZIP2
            [0x1F, 0x8B, 0x08],       // GZIP
            [0x7F, 0x45, 0x4C, 0x46], // ELF
        ];

        return signatures.some(signature => {
            if (chunk.length < signature.length) return false;
            return signature.every((byte, i) => chunk[i] === byte);
        });
    } catch {
        return true;
    }
}

export function readFileContent(filePath: string, maxSizeBytes: number): string | null {
    try {
        const stats = statSync(filePath);
        if (stats.size > maxSizeBytes) {
            return null;
        }
        return readFileSync(filePath, 'utf-8');
    } catch (error) {
        return null;
    }
}