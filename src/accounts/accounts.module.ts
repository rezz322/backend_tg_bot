import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { BotModule } from '../bot/bot.module';

@Module({
    imports: [BotModule],
    controllers: [AccountsController],
    providers: [AccountsService],
    exports: [AccountsService],
})
export class AccountsModule { }
