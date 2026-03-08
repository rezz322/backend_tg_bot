import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramUser, Prisma } from '@prisma/client';
import { BotService } from '../bot/bot.service';
import { AccountsService } from '../accounts/accounts.service';
import { sanitizeId } from '../utils';

@Injectable()
export class TelegramUsersService {
    constructor(
        private prisma: PrismaService,
        private botService: BotService,
        @Inject(forwardRef(() => AccountsService))
        private accountsService: AccountsService
    ) { }

    isAdmin(id: string): boolean {
        return this.botService.checkAdmin(id);
    }

    async checkAccess(id: string, username?: string): Promise<{
        allowed: boolean;
        message: string;
        isAdmin: boolean;
        isWhitelisted: boolean;
        isBanned: boolean;
        user?: TelegramUser
    }> {
        const isAdmin = this.isAdmin(id);
        const telegramId = sanitizeId(id);
        let user = await this.prisma.telegramUser.findUnique({
            where: { telegramId },
        });

        if (!user) {
            // Auto-register if not found
            user = await this.prisma.telegramUser.create({
                data: {
                    telegramId,
                    username: username || null,
                    isWhitelisted: false,
                },
            });
        }

        const isWhitelisted = user.isWhitelisted;
        const isBanned = user.isBanned;

        if (isAdmin) {
            return { allowed: true, message: 'Админ-доступ разрешен', isAdmin, isWhitelisted, isBanned, user };
        }

        if (isBanned) {
            return { allowed: false, message: 'Ваш аккаунт заблокирован.', isAdmin, isWhitelisted, isBanned, user };
        }

        if (!isWhitelisted) {
            return { allowed: false, message: 'Вы не добавлены в белый список.', isAdmin, isWhitelisted, isBanned, user };
        }

        return { allowed: true, message: 'Доступ разрешен', isAdmin, isWhitelisted, isBanned, user };
    }

    async create(data: { id: string; username?: string }): Promise<TelegramUser> {
        if (!data.id) throw new NotFoundException('id is required');
        const telegramId = sanitizeId(data.id);

        return this.prisma.telegramUser.upsert({
            where: { telegramId },
            update: { username: data.username },
            create: {
                telegramId,
                username: data.username,
                isWhitelisted: false,
            },
        });
    }

    async checkWhitelistAndAdd(data: { id: string; username?: string }): Promise<TelegramUser> {
        const telegramId = sanitizeId(data.id);
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

    async findOne(id: string): Promise<TelegramUser | null> {
        return this.prisma.telegramUser.findUnique({
            where: { telegramId: id },
            include: { accounts: true },
        });
    }

    async update(id: string, data: Prisma.TelegramUserUpdateInput): Promise<TelegramUser> {
        return this.prisma.telegramUser.update({
            where: { telegramId: id },
            data,
        });
    }

    async remove(id: string): Promise<TelegramUser> {
        return this.prisma.telegramUser.delete({
            where: { telegramId: id },
        });
    }

    async getTelegramUserInfo(telegramId: string) {
        if (!telegramId) throw new NotFoundException('telegramId is required');
        return this.findByTelegramId(telegramId);
    }

    async findByTelegramId(telegramId: string) {
        return this.prisma.telegramUser.findUnique({
            where: { telegramId: sanitizeId(telegramId) },
            include: { accounts: true },
        });
    }

    async toggleWhitelist(telegramId: string) {
        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: sanitizeId(telegramId) },
        });

        if (!user) throw new NotFoundException('User not found');

        return this.prisma.telegramUser.update({
            where: { telegramId: sanitizeId(telegramId) },
            data: { isWhitelisted: !user.isWhitelisted },
        });
    }

    async toggleWhitelistByUsername(username: string) {
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

    async toggleBan(telegramId: string) {
        if (!telegramId) throw new NotFoundException('telegramId is required');

        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: sanitizeId(telegramId) },
        });

        if (!user) throw new NotFoundException('User not found');

        return this.prisma.telegramUser.update({
            where: { telegramId: sanitizeId(telegramId) },
            data: { isBanned: !user.isBanned },
        });
    }

    async getTelegramUserInfoByUsername(username: string) {
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
}
