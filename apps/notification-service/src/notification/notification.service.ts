import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleEvent(event: string, payload: unknown): Promise<void> {
    this.logger.log(`[stub] notify event=${event} payload=${JSON.stringify(payload)}`);
    try {
      await this.prisma.notificationLog.create({
        data: {
          event,
          payload: payload as object,
          channel: 'LOG',
          status: 'SENT',
        },
      });
    } catch (err) {
      this.logger.warn(
        `Could not persist notification log (run prisma generate): ${String(err)}`,
      );
    }
  }
}
