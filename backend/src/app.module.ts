import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MediaModule } from './media/media.module';
import { SignageModule } from './signage/signage.module';
import { QueueModule } from './queue/queue.module';
import { SignageGateway } from './gateway/signage.gateway';

@Module({
  imports: [
    // Sajikan folder public/ sebagai halaman dashboard di /
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
      serveStaticOptions: { index: 'index.html' },
    }),
    // Sajikan folder uploads/ di URL /resources/*
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/resources',
      serveStaticOptions: {
        index: false,
        fallthrough: false,
      },
    }),
    MediaModule,
    SignageModule,
    QueueModule,
  ],
  providers: [SignageGateway],
})
export class AppModule {}
