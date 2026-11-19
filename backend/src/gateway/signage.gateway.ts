import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      /\.vercel\.app$/,
      /\.railway\.app$/,
      '*',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SignageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SignageGateway');
  private connectedClients = new Map<string, string>(); // socketId -> clientId

  handleConnection(client: Socket) {
    const clientId = client.handshake.query.clientId as string;
    if (clientId) {
      client.join(`client:${clientId}`);
      this.connectedClients.set(client.id, clientId);
      this.logger.log(`Player connected: ${client.id} -> room client:${clientId}`);
    } else {
      this.logger.log(`Admin/Operator connected: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit queue update event to all players of a specific client
   */
  emitQueueUpdate(clientId: string, data: { slotNumber: number; loketName: string; currentNumber: string }) {
    this.server.to(`client:${clientId}`).emit(`queue:${clientId}`, data);
    this.logger.log(`queue:${clientId} -> Slot ${data.slotNumber} = ${data.currentNumber}`);
  }

  /**
   * Emit content refresh event to all players of a specific client
   */
  emitRefresh(clientId: string, content: any) {
    this.server.to(`client:${clientId}`).emit(`refresh:${clientId}`, content);
    this.logger.log(`refresh:${clientId} emitted`);
  }
}
