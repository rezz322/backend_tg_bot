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
        const existingAccount = await this.prisma.account.findUnique({
            where: { phone: data.phone },
        });

        if (!existingAccount || !existingAccount.key) {
            data.key = this.generateKey(6);
        } else {
            data.key = existingAccount.key;
        }

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

    async findByUsername(username: string, adminId: string): Promise<any[]> {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
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

    async findByTelegramId(telegramId: string, adminId: string): Promise<any[]> {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');
        const tid = this.sanitizeId(telegramId);
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
                device_id: true,
                full_name: true,
                pin_code: true,
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
            include: { telegramUsers: true },
        });

        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    async getAccountByKey(key: string) {
        const account = await this.prisma.account.findUnique({
            where: { key },
            include: { telegramUsers: true },
        });

        if (!account) throw new NotFoundException('Account with this key not found');

        // Check for account ban
        if (account.isBanned) {
            throw new ForbiddenException('Account is banned');
        }

        // Check for owner ban (any owner)
        const bannedOwner = account.telegramUsers.find(user => user.isBanned);
        if (bannedOwner) {
            throw new ForbiddenException('User is banned');
        }

        // Check for expiration
        if (account.expiresAt && new Date() > account.expiresAt) {
            throw new ForbiddenException('Account key has expired');
        }

        return account;
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

    public generateKey(length: number = 12): string {
        // Increased complexity and length for security
        const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz!@#$%^&*'; // Removed ambiguous characters
        const nanoid = customAlphabet(alphabet, length);
        return nanoid();
    }

    async giveAccountKey(idOrTelegramId: string | number, phone: string, adminId: string, days?: number) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        let user = await this.prisma.telegramUser.findUnique({
            where: { id: typeof idOrTelegramId === 'number' ? idOrTelegramId : -1 }, // Try internal ID if number
        });

        if (!user) {
            // Try as telegramId
            const sanitizedId = this.sanitizeId(idOrTelegramId);
            user = await this.prisma.telegramUser.findUnique({
                where: { telegramId: sanitizedId },
            });
        }

        if (!user) throw new NotFoundException('User not found');

        const account = await this.prisma.account.findUnique({
            where: { phone },
        });

        if (!account) throw new NotFoundException('Account not found');

        const keyToUse = account.key || this.generateKey(12);

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

    async autoIssueKey(idOrTelegramId: string | number, fullName: string, phone: string, pin: string) {
        const sanitizedPhone = phone.trim().replace(/[^\d]/g, ''); // Remove all non-digits for comparison
        const sanitizedFullName = fullName.trim();
        const sanitizedPin = pin.trim();

        const sanitizedId = this.sanitizeId(idOrTelegramId);
        const user = await this.prisma.telegramUser.findUnique({
            where: { telegramId: sanitizedId },
        });

        if (!user) throw new NotFoundException('User not found in Telegram database');

        console.log(`Auto-issue attempt: user=${user.id} (tg=${sanitizedId}), name=${sanitizedFullName}, phone=${sanitizedPhone}, pin=${sanitizedPin}`);

        // find matching account
        const accounts = await this.prisma.account.findMany({
            where: {
                full_name: {
                    equals: sanitizedFullName,
                    mode: 'insensitive'
                },
                pin_code: sanitizedPin,
                // telegramUserId check replaced by logic for "available" or just many-to-many
                // For "multi-user" we might allow it even if others are connected, 
                // but let's assume "available" means "not banned and can be connected"
                isBanned: false
            }
        });

        console.log(`Found ${accounts.length} potential accounts matching name and pin`);
        if (accounts.length > 0) {
            accounts.forEach(acc => {
                console.log(`Potential Account: id=${acc.id}, phone=${acc.phone}, sanitizedPhone=${acc.phone.replace(/[^\d]/g, '')}`);
            });
        }

        // Filter by sanitized phone number
        const account = accounts.find(acc => {
            const accPhoneSanitized = acc.phone.replace(/[^\d]/g, '');
            return accPhoneSanitized === sanitizedPhone;
        });

        if (!account) throw new NotFoundException('No matching available account found for these details');

        return this.prisma.account.update({
            where: { id: account.id },
            data: {
                telegramUsers: {
                    connect: { id: user.id }
                },
                key: account.key || this.generateKey(12)
            }
        });
    }

    async refreshAccountKey(phone: string, adminId: string) {
        if (!this.botService.checkAdmin(adminId)) throw new ForbiddenException('Access denied');

        const newKey = this.generateKey(12);

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
                data: { key: this.generateKey(12) },
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
                key: this.generateKey(6),
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


    private sanitizeId(id: any): bigint {
        const sanitized = String(id).trim().replace(/[^\d-]/g, '');
        if (!sanitized) throw new NotFoundException('Invalid telegramId format');
        return BigInt(sanitized);
    }
}
