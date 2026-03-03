import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { TelegramUsersModule } from './telegram-users/telegram-users.module';

@Module({
  imports: [PrismaModule, BotModule, AccountsModule, TelegramUsersModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
