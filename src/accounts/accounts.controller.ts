import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query, ForbiddenException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';

@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    async create(@Body() data: Prisma.AccountCreateInput) {
        return this.accountsService.create(data);
    }

    @Get()
    async findAll(@Query('adminId') adminId: string) {
        return this.accountsService.findAllAdmin(adminId);
    }

    @Get('user/:identifier')
    async findByUser(@Param('identifier') identifier: string, @Query('adminId') adminId: string) {
        const isNumeric = /^\d+$/.test(identifier);
        const isLargeNumber = identifier.length > 9 || (identifier.length === 9 && identifier > '2147483647');

        if (isNumeric && (isLargeNumber || identifier.length > 5)) {
            return this.accountsService.findByTelegramId(identifier, adminId);
        }

        return this.accountsService.findByUsername(identifier, adminId);
    }

    @Get('get-available-accounts')
    async getAvailableAccounts(@Query('adminId') adminId: string) {
        // Only admin should see available accounts
        return this.accountsService.getAvailableAccounts(adminId);
    }

    @Get(':key')
    async findOne(@Param('key') key: string) {
        return this.accountsService.getAccountByKey(key);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: Prisma.AccountUpdateInput) {
        return this.accountsService.update(+id, data);
    }


    @Get('check-ban/:phone')
    async isAccountBanned(@Param('phone') phone: string) {
        return { isBanned: await this.accountsService.isAccountBanned(phone) };
    }

    @Get('key-check-ban/:key')
    async isAccountBannedByKey(@Param('key') key: string) {
        return { isBanned: await this.accountsService.isAccountBannedByKey(key) };
    }

    @Post('admin/info/:phone')
    async getAccountInfo(@Param('phone') phone: string, @Body() body: { adminId: string }) {
        return this.accountsService.getAccountInfo(phone, body.adminId);
    }

    @Post('admin/refresh/:phone')
    async refreshAccountKey(@Param('phone') phone: string, @Body() body: { adminId: string }) {
        return this.accountsService.refreshAccountKey(phone, body.adminId);
    }

    @Post('admin/give-key')
    async giveKey(@Body() body: { userId?: number; telegramId?: string; phone: string; adminId: string; days?: number }) {
        const id = body.telegramId || body.userId;
        if (!id) throw new NotFoundException('User identification (userId or telegramId) is required');
        return this.accountsService.giveAccountKey(id, body.phone, body.adminId, body.days);
    }

    @Post('admin/give-key/username')
    async giveKeyByUsername(@Body() body: { username: string; phone: string; adminId: string; days?: number }) {
        return this.accountsService.giveAccountKeyByUsername(body.username, body.phone, body.adminId, body.days);
    }

    @Post('auto-issue')
    async autoIssueKey(@Body() body: { userId?: number; telegramId?: string; fullName: string; phone: string; pin: string }) {
        const id = body.telegramId || body.userId;
        if (!id) throw new NotFoundException('User identification (userId or telegramId) is required');
        return this.accountsService.autoIssueKey(id, body.fullName, body.phone, body.pin);
    }

    @Post('admin/take-away/:id')
    async takeAwayAccount(@Param('id') id: string, @Body() body: { adminId: string }) {
        return this.accountsService.takeAwayAccount(+id, body.adminId);
    }

    @Post('admin/toggle-ban/:id')
    async toggleAccountBan(@Param('id') id: string, @Body() body: { adminId: string }) {
        this.accountsService.toggleAccountBan(+id, body.adminId);
    }
}
