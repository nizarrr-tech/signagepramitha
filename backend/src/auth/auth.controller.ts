import { Controller, Post, Get, Body, UnauthorizedException, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

// Secret key untuk akses endpoint admin (generate & lihat password)
// Diset via env variable ADMIN_SECRET, default fallback untuk development
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'signage-admin-secret-2024';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/verify
   * Verifikasi password dari user CMS
   * Body: { password: string }
   */
  @Post('verify')
  async verify(@Body() body: { password: string }) {
    const ok = await this.authService.verify(body.password);
    if (!ok) throw new UnauthorizedException('Password salah');
    return { ok: true, message: 'Akses diberikan' };
  }

  /**
   * GET /api/auth/password
   * Lihat password aktif (butuh header x-admin-secret)
   */
  @Get('password')
  async getPassword(@Headers('x-admin-secret') secret: string) {
    if (secret !== ADMIN_SECRET) throw new UnauthorizedException('Akses ditolak');
    const rec = await this.authService.getOrCreatePassword();
    return {
      password:  rec.password,
      createdAt: rec.createdAt,
    };
  }

  /**
   * POST /api/auth/generate
   * Generate password baru (butuh header x-admin-secret)
   */
  @Post('generate')
  async generate(@Headers('x-admin-secret') secret: string) {
    if (secret !== ADMIN_SECRET) throw new UnauthorizedException('Akses ditolak');
    const rec = await this.authService.generateNew();
    return {
      password:  rec.password,
      createdAt: rec.createdAt,
      message:   'Password baru berhasil dibuat',
    };
  }
}
