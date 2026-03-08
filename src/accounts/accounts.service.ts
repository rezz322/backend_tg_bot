import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, Prisma } from '@prisma/client';
import { BotService } from '../bot/bot.service';
import { sanitizeId, generateKey } from '../utils';
import axios from 'axios';
import { customAlphabet } from 'nanoid';


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


    async findAllAdmin(): Promise<any[]> {
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
                user: {
                    select: {
                        username: true,
                        telegramId: true
                    }
                }
            }
        });
    }

    async findByTelegramId(telegramId: string): Promise<any[]> {
        return this.prisma.account.findMany({
            where: {
                user: {
                    telegramId: {
                        equals: telegramId,
                        mode: 'insensitive'
                    }
                }
            },
            include: {
                user: true
            }
        });
    }


    async getAvailableAccounts() {
        return this.prisma.account.findMany({
            where: {
                userId: null
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

    async getAccountInfo(phone: string) {

        const account = await this.prisma.account.findUnique({
            where: { phone },
            include: { user: true },
        });

        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    async getAccountByKey(key: string) {
        let account = await this.prisma.account.findUnique({
            where: { key },
            include: { user: true },
        });
        if (!account) throw new NotFoundException('Account with this key not found');
        if (!account.isBanned && account.expiresAt && new Date() > account.expiresAt) {
            account = await this.prisma.account.update({
                where: { id: account.id },
                data: { isBanned: true },
                include: { user: true },
            });
        }
        return account;
    }


    public generateKey(length: number = 6): string {
        // Increased complexity and length for security
        const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz!@#$%^&*'; // Removed ambiguous characters
        const nanoid = customAlphabet(alphabet, length);
        return nanoid();
    }

    async giveAccountKey(idOrTelegramId: string | number, phone: string, days?: number) {

        const sanitizedId = sanitizeId(idOrTelegramId);

        let user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: sanitizedId },
            include: { accounts: true },
        });

        if (!user) throw new NotFoundException('User not found');

        if (user.accountLimit !== -1 && user.accounts.length >= user.accountLimit) {
            throw new ForbiddenException(`Лимит аккаунтов исчерпан (${user.accountLimit})`);
        }

        const account = await this.prisma.account.findUnique({
            where: { phone },
        });

        if (!account) throw new NotFoundException('Account not found');

        if (account.userId) {
            throw new ForbiddenException('Этот аккаунт уже привязан к другому пользователю');
        }

        const keyToUse = account.key || this.generateKey(12);

        const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

        return this.prisma.account.update({
            where: { phone },
            data: {
                userId: user.id,
                key: keyToUse,
                expiresAt,
            },
        });
    }

    async giveAccountKeyByUsername(username: string, phone: string, days?: number) {

        const user = await this.prisma.telegramUser.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            },
        });

        if (!user) throw new NotFoundException('User not found');

        return this.giveAccountKey(user.telegramId, phone, days);
    }

    async autoIssueKey(idOrTelegramId: string | number, phone: string, pin: string) {
        const sanitizedPin = pin.trim();

        const sanitizedId = sanitizeId(idOrTelegramId);
        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: sanitizedId, },
            include: { accounts: true },
        });

        if (!user) throw new NotFoundException('User not found in Telegram database');

        if (user.accountLimit !== -1 && user.accounts.length >= user.accountLimit) {
            throw new ForbiddenException(`Лимит аккаунтов исчерпан (${user.accountLimit})`);
        }

        console.log(`Auto-issue attempt: user=${user.id} (tg=${sanitizedId}), phone=${phone}, pin=${sanitizedPin}`);
        console.log(phone);
        const account = await this.prisma.account.findUnique({
            where: {
                phone: phone,
            }
        });
        console.log(account);
        if (!account) throw new NotFoundException('No matching available account found for these details');

        if (account.userId) {
            throw new ForbiddenException('Этот аккаунт уже привязан к другому пользователю');
        }

        if (account.pin_code != sanitizedPin) throw new ForbiddenException('No matching available account found for these details');

        return this.prisma.account.update({
            where: { id: account.id },
            data: {
                userId: user.id,
                key: account.key || this.generateKey(6)
            }
        });
    }

    async refreshAccountKey(phone: string) {

        const newKey = this.generateKey(6);

        return this.prisma.account.update({
            where: { phone },
            data: { key: newKey },
        });
    }

    async refreshKeysForUser(telegramUserId: number) {
        const accounts = await this.prisma.account.findMany({
            where: {
                userId: telegramUserId
            },
        });

        for (const account of accounts) {
            await this.prisma.account.update({
                where: { id: account.id },
                data: { key: this.generateKey(6) },
            });
        }
    }

    async takeAwayAccount(accountId: number) {

        return this.prisma.account.update({
            where: { id: accountId },
            data: {
                userId: null,
                key: this.generateKey(6),
            },
        });
    }

    async toggleAccountBan(accountId: number) {

        const account = await this.prisma.account.findUnique({
            where: { id: accountId }
        });

        if (!account) throw new NotFoundException('Account not found');

        return this.prisma.account.update({
            where: { id: accountId },
            data: { isBanned: !account.isBanned }
        });
    }

    async removeUserFromAccount(phone: string, userIdentifier: string) {
        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: userIdentifier }
        });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.account.update({
            where: { phone },
            data: {
                userId: null
            }
        });
    }


}
