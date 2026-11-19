import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { MediaService } from './media.service';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.mp4', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  if (allowed.includes(extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Tipe file tidak didukung'), false);
  }
};

@Controller('api/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage, fileFilter }))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Tidak ada file yang diupload');
    return this.mediaService.saveMedia(file);
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 20, { storage, fileFilter }))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) throw new BadRequestException('Tidak ada file yang diupload');
    return Promise.all(files.map((f) => this.mediaService.saveMedia(f)));
  }

  @Get()
  async listAll() {
    return this.mediaService.findAll();
  }

  @Get('videos')
  async listVideos() {
    return this.mediaService.findByType('VIDEO');
  }

  @Get('images')
  async listImages() {
    return this.mediaService.findByType('IMAGE');
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string) {
    return this.mediaService.deleteMedia(id);
  }
}
