import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { TelegramUsersService } from './telegram-users.service';
import { Prisma, TelegramUser } from '@prisma/client';

@Controller('users')
export class TelegramUsersController {
    constructor(private readonly telegramUsersService: TelegramUsersService) { }

    @Post()
    async create(@Body() data: { id: string; username?: string }): Promise<TelegramUser> {
        if (!data.id) throw new NotFoundException('id is required');
        return this.telegramUsersService.checkWhitelistAndAdd(data);
    }

    @Post('admin/whitelist')
    async toggleWhitelist(@Body() body: { telegramId: string; adminId: string }) {
        return this.telegramUsersService.toggleWhitelist(body.telegramId, body.adminId);
    }

    @Post('admin/whitelist/username')
    async toggleWhitelistByUsername(@Body() body: { username: string; adminId: string }) {
        return this.telegramUsersService.toggleWhitelistByUsername(body.username, body.adminId);
    }

    @Get()
    async findAll() {
        return this.telegramUsersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        // If it's a large number, it's probably a telegramId
        const isLargeNumber = id.length > 9 || (id.length === 9 && id > '2147483647');

        if (isLargeNumber) {
            const user = await this.telegramUsersService.findByTelegramId(id);
            if (!user) throw new NotFoundException('User not found');
            return user;
        }

        const user = await this.telegramUsersService.findOne(+id);
        if (!user) {
            // Fallback: maybe it's still a telegramId but shorter
            const userByTg = await this.telegramUsersService.findByTelegramId(id);
            if (!userByTg) throw new NotFoundException('User not found');
            return userByTg;
        }
        return user;
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: Prisma.TelegramUserUpdateInput) {
        return this.telegramUsersService.update(+id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.telegramUsersService.remove(+id);
    }

    @Post('admin/info')
    async getTelegramUser(@Body() body: { telegramId: string; adminId: string }) {
        const user = await this.telegramUsersService.getTelegramUserInfo(body.telegramId, body.adminId);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    @Post('admin/info/username')
    async getTelegramUserByUsername(@Body() body: { username: string; adminId: string }) {
        const user = await this.telegramUsersService.getTelegramUserInfoByUsername(body.username, body.adminId);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    @Post('admin/ban')
    async toggleBan(@Body() body: { telegramId: string; adminId: string }) {
        return this.telegramUsersService.toggleBan(body.telegramId, body.adminId);
    }

    @Post('admin/ban/username')
    async toggleBanByUsername(@Body() body: { username: string; adminId: string }) {
        return this.telegramUsersService.toggleBanByUsername(body.username, body.adminId);
    }
}
