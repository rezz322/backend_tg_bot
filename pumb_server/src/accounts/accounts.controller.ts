import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';

@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    async create(@Body() data: Prisma.AccountCreateInput) {
        this.accountsService.create(data);
    }

    @Get()
    async findAll() {
        return this.accountsService.findAll();
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
    async giveKey(@Body() body: { telegramId: string; phone: string; adminId: string }) {
        return this.accountsService.giveAccountKey(body.telegramId, body.phone, body.adminId);
    }

    @Post('admin/take-away/:id')
    async takeAwayAccount(@Param('id') id: string, @Body() body: { adminId: string }) {
        return this.accountsService.takeAwayAccount(+id, body.adminId);
    }
}
