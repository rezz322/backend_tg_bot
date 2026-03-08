import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query } from '@nestjs/common';
import { TelegramUsersService } from './telegram-users.service';
import { Prisma, TelegramUser } from '@prisma/client';
import { Admin } from '../common/decorators/admin.decorator';
import { UserAccess } from '../common/decorators/access.decorator';

@Controller('users')
export class TelegramUsersController {
    constructor(private readonly telegramUsersService: TelegramUsersService) { }

    @UserAccess()
    @Get('check-access/:id')
    async checkAccess(@Param('id') id: string, @Query('username') username?: string) {
        return this.telegramUsersService.checkAccess(id, username);
    }

    @UserAccess()
    @Get('check-admin/:id')
    async checkAdmin(@Param('id') id: string) {
        return { isAdmin: this.telegramUsersService.isAdmin(id) };
    }

    @Admin()
    @Post('admin/whitelist/username')
    async toggleWhitelistByUsername(@Body() body: { username: string }) {
        return this.telegramUsersService.toggleWhitelistByUsername(body.username);
    }

    @Admin()
    @Get()
    async findAll() {
        return this.telegramUsersService.findAll();
    }

    @Admin()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.telegramUsersService.findOne(id);
        if (!user) {
            const userByTg = await this.telegramUsersService.findByTelegramId(id);
            if (!userByTg) throw new NotFoundException('User not found');
            return userByTg;
        }
        return user;
    }

    @UserAccess()
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: Prisma.TelegramUserUpdateInput) {
        return this.telegramUsersService.update(id, data);
    }


    @Admin()
    @Post('admin/info/username')
    async getTelegramUserByUsername(@Body() body: { username: string }) {
        const user = await this.telegramUsersService.getTelegramUserInfoByUsername(body.username);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    @Admin()
    @Post('admin/ban/:id')
    async toggleBan(@Param('id') id: string) {
        return this.telegramUsersService.toggleBan(id);
    }
}
