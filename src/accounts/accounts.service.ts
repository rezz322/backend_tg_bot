import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, Prisma } from '@prisma/client';
import { BotService } from '../bot/bot.service';
import { sanitizeId, generateKey } from '../utils';
import axios from 'axios';


@Injectable()
export class AccountsService {
    constructor(
        private prisma: PrismaService,
        private botService: BotService
    ) { }

    async create(data: Prisma.AccountCreateInput): Promise<Account> {
        const existingAccount = await this.prisma.account.findUnique({
            where: { phone: data.phone },
        });

        if (!existingAccount || !existingAccount.key) {
            data.key = generateKey(12);
        } else {
            data.key = existingAccount.key;
        }

        axios.post(process.env.TG_API + '/notify/account_created', {
            phone: data.phone,
            full_name: data.full_name,
            pin: data.pin_code,
        });

        return this.prisma.account.upsert({
            where: { phone: data.phone },
            update: data,
            create: data,
        });
    }


    async findAllAdmin(adminId: string): Promise<any[]> {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
        return this.prisma.account.findMany({
            select: {
                id: true,
                phone: true,
                key: true,
                full_name: true,
                pin_code: true,
                brand: true,
                model: true,
                isBanned: true,
                telegramUsers: {
                    select: {
                        username: true,
                        telegramId: true
                    }
                }
            }
        });
    }

    async findByUsername(username: string): Promise<any[]> {
        return this.prisma.account.findMany({
            where: {
                telegramUsers: {
                    some: {
                        username: {
                            equals: username,
                            mode: 'insensitive'
                        }
                    }
                }
            },
            include: {
                telegramUsers: true
            }
        });
    }

    async findByTelegramId(telegramId: string): Promise<any[]> {
        const tid = sanitizeId(telegramId);
        return this.prisma.account.findMany({
            where: {
                telegramUsers: {
                    some: {
                        telegramId: tid
                    }
                }
            },
            include: {
                telegramUsers: true
            }
        });
    }

    async getAvailableAccounts(adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
        return this.prisma.account.findMany({
            where: {
                telegramUsers: {
                    none: {}
                }
            }
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
            include: { telegramUsers: true },
        });

        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    async getAccountByKey(key: string) {
        let account = await this.prisma.account.findUnique({
            where: { key },
            include: { telegramUsers: true },
        });

        if (!account) throw new NotFoundException('Account with this key not found');

        // Check for expiration and auto-ban
        if (!account.isBanned && account.expiresAt && new Date() > account.expiresAt) {
            account = await this.prisma.account.update({
                where: { id: account.id },
                data: { isBanned: true },
                include: { telegramUsers: true },
            });
        }

        // Check for account ban
        if (account.isBanned) {
            throw new ForbiddenException('Account is banned');
        }

        // Return only requested fields
        return {
            brand: account.brand,
            manufacturer: account.manufacturer,
            model: account.model,
            board: account.board,
            hardware: account.hardware,
            product: account.product,
            device: account.device,
            fingerprint: account.fingerprint,
            release: account.release,
            sdk: account.sdk,
            security_patch: account.security_patch,
            android_id: account.android_id,
            phone: account.phone,
            correlation_id: account.correlation_id,
            device_id: account.device_id,
        };
    }

    async isAccountBanned(phone: string): Promise<boolean> {
        const account = await this.prisma.account.findUnique({
            where: { phone },
            include: { telegramUsers: true },
        });
        if (!account) return false;
        if (account.isBanned) return true;
        return account.telegramUsers.some(user => user.isBanned);
    }

    async isAccountBannedByKey(key: string): Promise<boolean> {
        const account = await this.prisma.account.findUnique({
            where: { key },
            include: { telegramUsers: true },
        });
        if (!account) return false;
        if (account.isBanned) return true;
        return account.telegramUsers.some(user => user.isBanned);
    }

    async giveAccountKey(idOrTelegramId: string | number, phone: string, adminId: string, days?: number) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        let user = await this.prisma.telegramUser.findUnique({
            where: { id: typeof idOrTelegramId === 'number' ? idOrTelegramId : -1 }, // Try internal ID if number
        });

        if (!user) {
            // Try as telegramId
            const sanitizedId = sanitizeId(idOrTelegramId);
            user = await this.prisma.telegramUser.findUnique({
                where: { telegramId: sanitizedId },
            });
        }

        if (!user) throw new NotFoundException('User not found');

        const account = await this.prisma.account.findUnique({
            where: { phone },
        });

        if (!account) throw new NotFoundException('Account not found');

        const keyToUse = account.key || generateKey(12);

        const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

        return this.prisma.account.update({
            where: { phone },
            data: {
                telegramUsers: {
                    connect: { id: user.id }
                },
                key: keyToUse,
                expiresAt,
            },
        });
    }

    async giveAccountKeyByUsername(username: string, phone: string, adminId: string, days?: number) {
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

        return this.giveAccountKey(user.id, phone, adminId, days);
    }

    async autoIssueKey(idOrTelegramId: string | number, phone: string, pin: string) {
        const sanitizedPin = pin.trim();

        const sanitizedId = sanitizeId(idOrTelegramId);
        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: sanitizedId },
        });

        if (!user) throw new NotFoundException('User not found in Telegram database');

        console.log(`Auto-issue attempt: user=${user.id} (tg=${sanitizedId}), phone=${phone}, pin=${sanitizedPin}`);
        console.log(phone);
        // find matching account
        const account = await this.prisma.account.findUnique({
            where: {
                phone: phone,
            }
        });
        console.log(account);
        if (!account) throw new NotFoundException('No matching available account found for these details');
        if (account.pin_code != sanitizedPin) throw new ForbiddenException('No matching available account found for these details');

        return this.prisma.account.update({
            where: { id: account.id },
            data: {
                telegramUsers: {
                    connect: { id: user.id }
                },
                key: account.key || generateKey(12)
            }
        });
    }

    async refreshAccountKey(phone: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        const newKey = generateKey(12);

        return this.prisma.account.update({
            where: { phone },
            data: { key: newKey },
        });
    }

    async refreshKeysForUser(telegramUserId: number) {
        const accounts = await this.prisma.account.findMany({
            where: {
                telegramUsers: {
                    some: { id: telegramUserId }
                }
            },
        });

        for (const account of accounts) {
            await this.prisma.account.update({
                where: { id: account.id },
                data: { key: generateKey(12) },
            });
        }
    }

    async takeAwayAccount(accountId: number, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        return this.prisma.account.update({
            where: { id: accountId },
            data: {
                telegramUsers: {
                    set: [] // Disconnect all users
                },
                key: generateKey(12),
            },
        });
    }

    async toggleAccountBan(accountId: number, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        const account = await this.prisma.account.findUnique({
            where: { id: accountId }
        });

        if (!account) throw new NotFoundException('Account not found');

        return this.prisma.account.update({
            where: { id: accountId },
            data: { isBanned: !account.isBanned }
        });
    }
}
