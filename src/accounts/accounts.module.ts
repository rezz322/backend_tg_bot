import { Module, forwardRef } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { BotModule } from '../bot/bot.module';
import { TelegramUsersModule } from '../telegram-users/telegram-users.module';

@Module({
    imports: [BotModule, forwardRef(() => TelegramUsersModule)],
    controllers: [AccountsController],
    providers: [AccountsService],
    exports: [AccountsService],
})
export class AccountsModule { }
