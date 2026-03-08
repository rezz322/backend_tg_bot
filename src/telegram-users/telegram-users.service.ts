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

    isAdmin(id: string): boolean {
        return this.botService.checkAdmin(id);
    }

    async create(data: { id: string; username?: string }): Promise<TelegramUser> {
        if (!data.id) throw new NotFoundException('id is required');
        const telegramId = this.sanitizeId(data.id);

        // Auto-whitelist if it's the first time we see this user or just ensure they exist
        return this.prisma.telegramUser.upsert({
            where: { telegramId },
            update: { username: data.username },
            create: {
                telegramId,
                username: data.username,
                isWhitelisted: false, // Default to false, can be toggled by admin
            },
        });
    }

    async checkWhitelistAndAdd(data: { id: string; username?: string }): Promise<TelegramUser> {
        const telegramId = this.sanitizeId(data.id);
        let user = await this.prisma.telegramUser.findUnique({
            where: { telegramId },
        });

        if (!user) {
            user = await this.prisma.telegramUser.create({
                data: {
                    telegramId,
                    username: data.username,
                    isWhitelisted: false,
                },
            });
        }

        return user;
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

    async toggleWhitelist(telegramId: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: this.sanitizeId(telegramId) },
        });

        if (!user) throw new NotFoundException('User not found');

        return this.prisma.telegramUser.update({
            where: { telegramId: this.sanitizeId(telegramId) },
            data: { isWhitelisted: !user.isWhitelisted },
        });
    }

    async isWhitelisted(telegramId: string): Promise<boolean> {
        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: this.sanitizeId(telegramId) },
        });
        return user?.isWhitelisted || false;
    }

    async toggleWhitelistByUsername(username: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        const user = await this.prisma.telegramUser.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            },
        });

        if (!user) throw new NotFoundException('User with this username not found');

        return this.prisma.telegramUser.update({
            where: { id: user.id },
            data: { isWhitelisted: !user.isWhitelisted },
        });
    }

    async toggleBan(telegramId: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
        if (!telegramId) throw new NotFoundException('telegramId is required');

        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: this.sanitizeId(telegramId) },
        });

        if (!user) throw new NotFoundException('User not found');

        const isBanning = !user.isBanned;

        return this.prisma.telegramUser.update({
            where: { telegramId: this.sanitizeId(telegramId) },
            data: { isBanned: isBanning },
        });
    }

    async getTelegramUserInfoByUsername(username: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
        return this.findByUsername(username);
    }

    async findByUsername(username: string) {
        return this.prisma.telegramUser.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            },
            include: { accounts: true },
        });
    }

    async toggleBanByUsername(username: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        const user = await this.prisma.telegramUser.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            },
        });

        if (!user) throw new NotFoundException('User not found');

        return this.prisma.telegramUser.update({
            where: { id: user.id },
            data: { isBanned: !user.isBanned },
        });
    }
}
