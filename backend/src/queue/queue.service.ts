import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async getSlots(clientId: string) {
    const slots = await this.prisma.queueSlot.findMany({
      where: { clientId },
      orderBy: { slotNumber: 'asc' },
    });
    if (!slots.length) throw new NotFoundException(`Client ${clientId} tidak ditemukan atau belum ada slot`);
    return slots;
  }

  async callQueue(
    clientId: string,
    body: { slotNumber: number; action: 'next' | 'repeat' | 'manual'; number?: string },
  ) {
    const { slotNumber, action, number } = body;

    if (slotNumber < 1 || slotNumber > 5) {
      throw new BadRequestException('slotNumber harus antara 1 dan 5');
    }

    const slot = await this.prisma.queueSlot.findUnique({
      where: { clientId_slotNumber: { clientId, slotNumber } },
    });

    if (!slot) throw new NotFoundException(`Slot ${slotNumber} tidak ditemukan`);

    let newNumber = slot.currentNumber;

    if (action === 'next') {
      // Increment number: handles both numeric and alphanumeric (e.g., A001 -> A002, 010 -> 011)
      newNumber = this.incrementNumber(slot.currentNumber);
    } else if (action === 'repeat') {
      // Keep current number, just re-broadcast
      newNumber = slot.currentNumber;
    } else if (action === 'manual') {
      if (!number) throw new BadRequestException('number diperlukan untuk action manual');
      newNumber = number.trim().toUpperCase();
    }

    const updated = await this.prisma.queueSlot.update({
      where: { clientId_slotNumber: { clientId, slotNumber } },
      data: { currentNumber: newNumber },
    });

    return updated;
  }

  async resetAll(clientId: string) {
    await this.prisma.queueSlot.updateMany({
      where: { clientId },
      data: { currentNumber: '000' },
    });
    return { message: 'Semua slot antrian direset ke 000' };
  }

  async updateLoketName(clientId: string, slotNumber: number, loketName: string) {
    return this.prisma.queueSlot.update({
      where: { clientId_slotNumber: { clientId, slotNumber } },
      data: { loketName },
    });
  }

  private incrementNumber(current: string): string {
    // Detect prefix (letters) and numeric suffix
    const match = current.match(/^([A-Za-z]*)(\d+)$/);
    if (!match) return '001';

    const prefix = match[1];
    const numPart = match[2];
    const padLen = numPart.length;
    const next = parseInt(numPart, 10) + 1;

    // Reset to 1 if overflow
    const nextStr = next > Math.pow(10, padLen) - 1 ? '1'.padStart(padLen, '0') : String(next).padStart(padLen, '0');
    return prefix + nextStr;
  }
}
