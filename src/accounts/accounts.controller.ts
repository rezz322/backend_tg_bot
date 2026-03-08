import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';
import { Admin } from '../common/decorators/admin.decorator';
import { UserAccess } from '../common/decorators/access.decorator';

@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    async create(@Body() data: Prisma.AccountCreateInput) {
        return this.accountsService.create(data);
    }

    @Admin()
    @Get()
    async findAll() {
        return this.accountsService.findAllAdmin();
    }

    @UserAccess()
    @Get('user/:identifier')
    async findByUser(@Param('identifier') identifier: string) {
        let response = this.accountsService.findByUsername(identifier);
        return response;
    }


    @UserAccess()
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: Prisma.AccountUpdateInput) {
        return this.accountsService.update(+id, data);
    }


    @Get('key/:key')
    async getAccountByKey(@Param('key') key: string) {
        return this.accountsService.getAccountByKey(key);
    }


    @Admin()
    @Post('admin/info/:phone')
    async getAccountInfo(@Param('phone') phone: string) {
        return this.accountsService.getAccountInfo(phone);
    }

    @Admin()
    @Post('admin/refresh/:phone')
    async refreshAccountKey(@Param('phone') phone: string) {
        return this.accountsService.refreshAccountKey(phone);
    }

    @Admin()
    @Post('admin/give-key')
    async giveKey(@Body() body: { userId?: number; telegramId?: string; phone: string; days?: number }) {
        const id = body.telegramId || body.userId;
        if (!id) throw new NotFoundException('User identification (userId or telegramId) is required');
        return this.accountsService.giveAccountKey(id, body.phone, body.days);
    }

    @Admin()
    @Post('admin/give-key/username')
    async giveKeyByUsername(@Body() body: { username: string; phone: string; days?: number }) {
        return this.accountsService.giveAccountKeyByUsername(body.username, body.phone, body.days);
    }

    @UserAccess()
    @Post('auto-issue')
    async autoIssueKey(@Body() body: { telegramId?: string; fullName: string; phone: string; pin: string }) {
        const id = body.telegramId;
        if (!id) throw new NotFoundException('User identification (userId or telegramId) is required');
        return this.accountsService.autoIssueKey(id, body.phone, body.pin);
    }

    @Admin()
    @Post('admin/take-away/:id')
    async takeAwayAccount(@Param('id') id: string) {
        return this.accountsService.takeAwayAccount(+id);
    }

    @Admin()
    @Post('admin/toggle-ban/:id')
    async toggleAccountBan(@Param('id') id: string) {
        return this.accountsService.toggleAccountBan(+id);
    }

    @Admin()
    @Delete('admin/remove-account')
    async removeAccountFromUser(
        @Body() body: { phone: string; identifier: string }
    ) {
        if (!body.identifier) throw new NotFoundException('User identifier required');
        return this.accountsService.removeUserFromAccount(body.phone, body.identifier);
    }
}
