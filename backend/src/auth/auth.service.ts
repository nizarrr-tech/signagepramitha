import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

function generatePassword(length = 8): string {
  // Karakter mudah dibaca — tidak ada 0/O, 1/l/I
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format: XXXX-XXXX agar mudah dibaca
  return result.slice(0, 4) + '-' + result.slice(4);
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /** Ambil password aktif. Jika belum ada, generate otomatis */
  async getOrCreatePassword(): Promise<{ password: string; createdAt: Date }> {
    const existing = await this.prisma.cmsPassword.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;
    return this.generateNew();
  }

  /** Generate password baru, hapus yang lama */
  async generateNew(): Promise<{ password: string; createdAt: Date }> {
    // Hapus semua password lama
    await this.prisma.cmsPassword.deleteMany({});

    const password = generatePassword();
    return this.prisma.cmsPassword.create({ data: { password } });
  }

  /** Verifikasi password dari user */
  async verify(input: string): Promise<boolean> {
    const rec = await this.prisma.cmsPassword.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (!rec) return false;
    return rec.password === input.trim();
  }
}
