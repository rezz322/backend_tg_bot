import { Module } from '@nestjs/common';
import { TelegramUsersService } from './telegram-users.service';
import { TelegramUsersController } from './telegram-users.controller';
import { BotModule } from '../bot/bot.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
    imports: [BotModule, AccountsModule],
    controllers: [TelegramUsersController],
    providers: [TelegramUsersService],
    exports: [TelegramUsersService],
})
export class TelegramUsersModule { }
