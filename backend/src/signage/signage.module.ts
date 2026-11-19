import { Module } from '@nestjs/common';
import { SignageController, ChannelController, ClientController } from './signage.controller';
import { SignageService } from './signage.service';
import { PrismaService } from '../prisma.service';
import { SignageGateway } from '../gateway/signage.gateway';

@Module({
  controllers: [SignageController, ChannelController, ClientController],
  providers: [SignageService, PrismaService, SignageGateway],
  exports: [SignageService],
})
export class SignageModule {}
