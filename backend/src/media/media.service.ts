import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';

const VIDEO_EXTS = ['.mp4', '.webm', '.mov'];

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async saveMedia(file: Express.Multer.File) {
    const ext  = extname(file.originalname).toLowerCase();
    const type = VIDEO_EXTS.includes(ext) ? 'VIDEO' : 'IMAGE';

    return this.prisma.mediaResource.create({
      data: {
        filename: file.filename,
        url:      `/resources/${file.filename}`,
        type,
        duration: null,
      },
    });
  }

  async findAll() {
    return this.prisma.mediaResource.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findByType(type: 'VIDEO' | 'IMAGE') {
    return this.prisma.mediaResource.findMany({ where: { type }, orderBy: { createdAt: 'desc' } });
  }

  async deleteMedia(id: string) {
    const media = await this.prisma.mediaResource.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media tidak ditemukan');

    // Hapus file fisik dari folder uploads
    const filePath = join(process.cwd(), 'uploads', media.filename);
    if (existsSync(filePath)) unlinkSync(filePath);

    await this.prisma.mediaResource.delete({ where: { id } });
    return { message: 'Media berhasil dihapus', id };
  }
}
