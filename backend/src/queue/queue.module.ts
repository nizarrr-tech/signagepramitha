import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma.service';
import { SignageGateway } from '../gateway/signage.gateway';

@Module({
  controllers: [QueueController],
  providers: [QueueService, PrismaService, SignageGateway],
  exports: [QueueService],
})
export class QueueModule {}
