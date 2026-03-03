import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, Prisma } from '@prisma/client';
import { BotService } from '../bot/bot.service';
import { customAlphabet } from 'nanoid';


@Injectable()
export class AccountsService {
    constructor(
        private prisma: PrismaService,
        private botService: BotService
    ) { }

    async create(data: Prisma.AccountCreateInput): Promise<Account> {
        data.key = this.generateKey(6);
        return this.prisma.account.upsert({
            where: { phone: data.phone },
            update: data,
            create: data,
        });
    }

    async findAll(): Promise<Account[]> {
        return this.prisma.account.findMany();
    }

    async findOne(key: string) {
        return this.prisma.account.findUnique({
            where: { key },
            select: {
                brand: true,
                manufacturer: true,
                model: true,
                board: true,
                hardware: true,
                product: true,
                device: true,
                fingerprint: true,
                release: true,
                sdk: true,
                security_patch: true,
                android_id: true,
                phone: true,
                correlation_id: true,
            },
        });
    }

    async update(id: number, data: Prisma.AccountUpdateInput): Promise<Account> {
        return this.prisma.account.update({
            where: { id },
            data,
        });
    }

    async remove(id: number): Promise<Account> {
        return this.prisma.account.delete({
            where: { id },
        });
    }

    async getAccountInfo(phone: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        const account = await this.prisma.account.findUnique({
            where: { phone },
        });

        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    async getAccountByKey(key: string) {
        const account = await this.prisma.account.findUnique({
            where: { key },
            include: { telegramUser: true },
        });

        if (!account || (account.telegramUser && account.telegramUser.isBanned)) {
            throw new ForbiddenException('Account is banned or not found');
        }

        if (!account) throw new NotFoundException('Account with this key not found');
        return account;
    }

    async isAccountBanned(phone: string): Promise<boolean> {
        const account = await this.prisma.account.findUnique({
            where: { phone },
            include: { telegramUser: true },
        });
        if (!account || !account.telegramUser) return false;
        return account.telegramUser.isBanned;
    }

    async isAccountBannedByKey(key: string): Promise<boolean> {
        const account = await this.prisma.account.findUnique({
            where: { key },
            include: { telegramUser: true },
        });
        if (!account || !account.telegramUser) return false;
        return account.telegramUser.isBanned;
    }

    public generateKey(length: number = 6): string {

        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const nanoid = customAlphabet(alphabet, length);
        return nanoid();
    }

    async giveAccountKey(telegramId: string, phone: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
        if (!telegramId) throw new NotFoundException('telegramId is required');

        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: this.sanitizeId(telegramId) },
        });

        if (!user) throw new NotFoundException('User not found');

        const account = await this.prisma.account.findUnique({
            where: { phone },
        });

        if (!account) throw new NotFoundException('Account not found');

        const newKey = this.generateKey(6);

        return this.prisma.account.update({
            where: { phone },
            data: {
                telegramUserId: user.id,
                key: newKey,
            },
        });
    }

    async refreshAccountKey(phone: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        const newKey = this.generateKey(6);

        return this.prisma.account.update({
            where: { phone },
            data: { key: newKey },
        });
    }

    async refreshKeysForUser(telegramUserId: number) {
        const accounts = await this.prisma.account.findMany({
            where: { telegramUserId },
        });

        for (const account of accounts) {
            await this.prisma.account.update({
                where: { id: account.id },
                data: { key: this.generateKey(6) },
            });
        }
    }

    async takeAwayAccount(accountId: number, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        return this.prisma.account.update({
            where: { id: accountId },
            data: {
                telegramUserId: null,
                key: this.generateKey(6),
            },
        });
    }

    async getAvailableAccounts() {
        return this.prisma.account.findMany();
    }

    private sanitizeId(id: any): bigint {
        const sanitized = String(id).trim().replace(/[^\d-]/g, '');
        if (!sanitized) throw new NotFoundException('Invalid telegramId format');
        return BigInt(sanitized);
    }
}
