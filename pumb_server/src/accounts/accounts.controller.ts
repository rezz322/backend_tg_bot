import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
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
    async findAll() {
        return this.accountsService.findAll();
    }

    @Get('get-available-accounts')
    async getAvailableAccounts() {
        return this.accountsService.getAvailableAccounts();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const account = await this.accountsService.findOne(+id);
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

    @Get('check-ban/:number')
    async isAccountBanned(@Param('number') number: string) {
        return { isBanned: await this.accountsService.isAccountBanned(number) };
    }

    @Get('key-check-ban/:key')
    async isAccountBannedByKey(@Param('key') key: string) {
        return { isBanned: await this.accountsService.isAccountBannedByKey(key) };
    }

    @Post('admin/info/:number')
    async getAccountInfo(@Param('number') number: string, @Body() body: { adminId: string }) {
        return this.accountsService.getAccountInfo(number, body.adminId);
    }

    @Post('admin/refresh/:number')
    async refreshAccountKey(@Param('number') number: string, @Body() body: { adminId: string }) {
        return this.accountsService.refreshAccountKey(number, body.adminId);
    }

    @Post('admin/give-key')
    async giveKey(@Body() body: { telegramId: string; number: string; adminId: string }) {
        return this.accountsService.giveAccountKey(body.telegramId, body.number, body.adminId);
    }
}
