import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Default zone layout (1920×1080 canvas)
export const DEFAULT_LAYOUT = {
  bg:       { x: 0,    y: 0,   w: 1920, h: 1080, visible: true },
  slot1:    { x: 5,    y: 9,   w: 597,  h: 190,  visible: true },
  slot2:    { x: 5,    y: 203, w: 597,  h: 190,  visible: true },
  slot3:    { x: 5,    y: 397, w: 597,  h: 190,  visible: true },
  slot4:    { x: 5,    y: 590, w: 597,  h: 190,  visible: true },
  slot5:    { x: 5,    y: 784, w: 597,  h: 190,  visible: true },
  video:    { x: 628,  y: 155, w: 1274, h: 622,  visible: true },
  slide:    { x: 625,  y: 790, w: 640,  h: 188,  visible: true },
  table:    { x: 1272, y: 790, w: 639,  h: 188,  visible: true },
  rtext:    { x: 0,    y: 1011,w: 1551, h: 67,   visible: true },
  datetime: { x: 1562, y: 994, w: 347,  h: 79,   visible: true },
};

@Injectable()
export class SignageService {
  constructor(private prisma: PrismaService) {}

  async getFullConfig(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        signageContent: true,
        queueSlots: { orderBy: { slotNumber: 'asc' } },
      },
    });

    if (!client) return null;

    const content = client.signageContent;
    let layoutConfig = DEFAULT_LAYOUT;
    try {
      const parsed = JSON.parse(content?.layoutConfig || '{}');
      if (Object.keys(parsed).length > 0) layoutConfig = { ...DEFAULT_LAYOUT, ...parsed };
    } catch {}

    return {
      clientId: client.id,
      description: client.description,
      content: content
        ? {
            videoUrls:    JSON.parse(content.videoUrls    || '[]'),
            slideUrls:    JSON.parse(content.slideUrls    || '[]'),
            runningText:  content.runningText,
            scheduleTable:JSON.parse(content.scheduleTable|| '[]'),
            backgroundUrl:content.backgroundUrl,
            layoutConfig,
            clinicName:   content.clinicName   || 'Klinik Pramitha',
            themeColor:   content.themeColor   || '#dc2626',
          }
        : {
            videoUrls: [], slideUrls: [], runningText: '',
            scheduleTable: [], backgroundUrl: '',
            layoutConfig: DEFAULT_LAYOUT,
            clinicName: 'Klinik Pramitha',
            themeColor: '#dc2626',
          },
      queueSlots: client.queueSlots.map((slot) => ({
        slotNumber:    slot.slotNumber,
        loketName:     slot.loketName,
        currentNumber: slot.currentNumber,
        updatedAt:     slot.updatedAt,
      })),
    };
  }

  async updateContent(clientId: string, body: {
    videoUrls?:     string[];
    slideUrls?:     string[];
    runningText?:   string;
    scheduleTable?: any[];
    backgroundUrl?: string;
    layoutConfig?:  any;
    clinicName?:    string;
    themeColor?:    string;
  }) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException(`Client ${clientId} tidak ditemukan`);

    return this.prisma.signageContent.upsert({
      where:  { clientId },
      update: {
        ...(body.videoUrls     !== undefined && { videoUrls:     JSON.stringify(body.videoUrls) }),
        ...(body.slideUrls     !== undefined && { slideUrls:     JSON.stringify(body.slideUrls) }),
        ...(body.runningText   !== undefined && { runningText:   body.runningText }),
        ...(body.scheduleTable !== undefined && { scheduleTable: JSON.stringify(body.scheduleTable) }),
        ...(body.backgroundUrl !== undefined && { backgroundUrl: body.backgroundUrl }),
        ...(body.layoutConfig  !== undefined && { layoutConfig:  JSON.stringify(body.layoutConfig) }),
        ...(body.clinicName    !== undefined && { clinicName:    body.clinicName }),
        ...(body.themeColor    !== undefined && { themeColor:    body.themeColor }),
      },
      create: {
        clientId,
        videoUrls:     JSON.stringify(body.videoUrls     || []),
        slideUrls:     JSON.stringify(body.slideUrls     || []),
        runningText:   body.runningText   || '',
        scheduleTable: JSON.stringify(body.scheduleTable || []),
        backgroundUrl: body.backgroundUrl || '',
        layoutConfig:  JSON.stringify(body.layoutConfig  || {}),
        clinicName:    body.clinicName    || 'Klinik Pramitha',
        themeColor:    body.themeColor    || '#dc2626',
      },
    });
  }

  async getClients() {
    return this.prisma.client.findMany({ orderBy: { id: 'asc' } });
  }

  async createClient(data: { id: string; description?: string }) {
    const client = await this.prisma.client.upsert({
      where:  { id: data.id },
      update: { description: data.description || '' },
      create: { id: data.id, description: data.description || '' },
    });
    for (let i = 1; i <= 5; i++) {
      await this.prisma.queueSlot.upsert({
        where:  { clientId_slotNumber: { clientId: data.id, slotNumber: i } },
        update: {},
        create: { clientId: data.id, slotNumber: i, loketName: `Loket ${i}`, currentNumber: '000' },
      });
    }
    return client;
  }
}
