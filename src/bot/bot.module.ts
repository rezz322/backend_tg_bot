import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGuard } from '../common/guards/admin.guard';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [BotController],
    providers: [BotService, AdminGuard],
    exports: [BotService, AdminGuard],
})
export class BotModule { }
