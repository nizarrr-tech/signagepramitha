import { Controller, Post, Param, Body, Get, NotFoundException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { SignageGateway } from '../gateway/signage.gateway';

@Controller('api/signage')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly gateway: SignageGateway,
  ) {}

  /** GET /api/signage/:clientId/queue - Ambil semua slot antrian */
  @Get(':clientId/queue')
  async getQueue(@Param('clientId') clientId: string) {
    return this.queueService.getSlots(clientId);
  }

  /**
   * POST /api/signage/:clientId/queue/call
   * Body: { slotNumber: 1-5, action: "next"|"repeat"|"manual", number?: string }
   */
  @Post(':clientId/queue/call')
  async callQueue(
    @Param('clientId') clientId: string,
    @Body() body: { slotNumber: number; action: 'next' | 'repeat' | 'manual'; number?: string },
  ) {
    const slot = await this.queueService.callQueue(clientId, body);

    // Emit real-time ke semua player
    this.gateway.emitQueueUpdate(clientId, {
      slotNumber: slot.slotNumber,
      loketName: slot.loketName,
      currentNumber: slot.currentNumber,
    });

    return {
      message: `Antrian ${slot.loketName} dipanggil: ${slot.currentNumber}`,
      slot,
    };
  }

  /** POST /api/signage/:clientId/queue/reset - Reset semua slot ke 000 */
  @Post(':clientId/queue/reset')
  async resetQueue(@Param('clientId') clientId: string) {
    return this.queueService.resetAll(clientId);
  }

  /** POST /api/signage/:clientId/queue/loket - Update nama loket */
  @Post(':clientId/queue/loket')
  async updateLoket(
    @Param('clientId') clientId: string,
    @Body() body: { slotNumber: number; loketName: string },
  ) {
    return this.queueService.updateLoketName(clientId, body.slotNumber, body.loketName);
  }
}
