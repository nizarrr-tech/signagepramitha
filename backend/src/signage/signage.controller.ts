   import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { SignageService } from './signage.service';
import { SignageGateway } from '../gateway/signage.gateway';

@Controller('api/signage')
export class SignageController {
  constructor(
    private readonly signageService: SignageService,
    private readonly gateway: SignageGateway,
  ) {}

  @Get(':clientId')
  async getConfig(@Param('clientId') clientId: string) {
    const data = await this.signageService.getFullConfig(clientId);
    if (!data) throw new NotFoundException(`Client ${clientId} tidak ditemukan`);
    return data;
  }

  @Post(':clientId/content')
  async updateContent(@Param('clientId') clientId: string, @Body() body: any) {
    const updated = await this.signageService.updateContent(clientId, body);
    const fullConfig = await this.signageService.getFullConfig(clientId);
    this.gateway.emitRefresh(clientId, fullConfig);
    return { message: 'Konten berhasil diperbarui dan dikirim ke layar', data: updated };
  }
}

@Controller('api/clients')
export class ClientController {
  constructor(private readonly signageService: SignageService) {}

  @Get()
  async getAll() { return this.signageService.getClients(); }

  @Post()
  async create(@Body() body: { id: string; description?: string }) {
    return this.signageService.createClient(body);
  }
}
