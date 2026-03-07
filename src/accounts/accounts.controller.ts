import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query } from '@nestjs/common';
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
    async findAll(@Query('adminId') adminId?: string) {
        if (adminId) {
            return this.accountsService.findAllAdmin(adminId);
        }
        return this.accountsService.findAll();
    }

    @Get('user/:username')
    async findByUsername(@Param('username') username: string) {
        return this.accountsService.findByUsername(username);
    }

    @Get('get-available-accounts')
    async getAvailableAccounts() {
        return this.accountsService.getAvailableAccounts();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const account = await this.accountsService.findOne(id);
        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: Prisma.AccountUpdateInput) {
        return this.accountsService.update(+id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.accountsService.remove(+id);
    }

    @Get('key/:key')
    async getAccountByKey(@Param('key') key: string) {
        return this.accountsService.getAccountByKey(key);
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
        return this.accountsService.toggleAccountBan(+id, body.adminId);
    }
}
