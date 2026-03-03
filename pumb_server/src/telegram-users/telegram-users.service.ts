import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramUser, Prisma } from '@prisma/client';
import { BotService } from '../bot/bot.service';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class TelegramUsersService {
    constructor(
        private prisma: PrismaService,
        private botService: BotService,
        private accountsService: AccountsService
    ) { }

    async create(data: { id: string; username?: string }): Promise<TelegramUser> {
        if (!data.id) throw new NotFoundException('id is required');
        const telegramId = this.sanitizeId(data.id);
        return this.prisma.telegramUser.upsert({
            where: { telegramId },
            update: { username: data.username },
            create: {
                telegramId,
                username: data.username,
            },
        });
    }

    async findAll(): Promise<TelegramUser[]> {
        return this.prisma.telegramUser.findMany();
    }

    async findOne(id: number): Promise<TelegramUser | null> {
        return this.prisma.telegramUser.findUnique({
            where: { id },
            include: { accounts: true },
        });
    }

    async update(id: number, data: Prisma.TelegramUserUpdateInput): Promise<TelegramUser> {
        return this.prisma.telegramUser.update({
            where: { id },
            data,
        });
    }

    async remove(id: number): Promise<TelegramUser> {
        return this.prisma.telegramUser.delete({
            where: { id },
        });
    }

    async getTelegramUserInfo(telegramId: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
        if (!telegramId) throw new NotFoundException('telegramId is required');
        return this.findByTelegramId(telegramId);
    }

    async findByTelegramId(telegramId: string) {
        return this.prisma.telegramUser.findUnique({
            where: { telegramId: this.sanitizeId(telegramId) },
            include: { accounts: true },
        });
    }

    private sanitizeId(id: any): bigint {
        const sanitized = String(id).trim().replace(/[^\d-]/g, '');
        if (!sanitized) throw new NotFoundException('Invalid telegramId format');
        return BigInt(sanitized);
    }

    async toggleBan(telegramId: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
        if (!telegramId) throw new NotFoundException('telegramId is required');

        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: this.sanitizeId(telegramId) },
        });

        if (!user) throw new NotFoundException('User not found');

        const isBanning = !user.isBanned;

        // If banning, rotate keys for all linked accounts
        if (isBanning) {
            await this.accountsService.refreshKeysForUser(user.id);
        }
        console.log(isBanning, telegramId);

        return this.prisma.telegramUser.update({
            where: { telegramId: this.sanitizeId(telegramId) },
            data: { isBanned: isBanning },
        });
    }
}
