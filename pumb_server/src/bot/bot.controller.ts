import { Controller, Get, Param, NotFoundException, Res } from '@nestjs/common';
import { BotService } from './bot.service';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('bot')
export class BotController {
    constructor(private readonly botService: BotService) { }

    @Get('check-admin/:id')
    checkAdmin(@Param('id') id: string) {
        return { isAdmin: this.botService.checkAdmin(id) };
    }

    @Get('client-apk')
    async getClientApk(@Res() res: Response) {
        const filePath = join(process.cwd(), 'uploads', 'apkcreate.py');
        if (!existsSync(filePath)) throw new NotFoundException('Client file not found');
        return res.sendFile(filePath);
    }

    @Get('admin-apk')
    async getAdminApk(@Res() res: Response) {
        try {
            const filePath = join(process.cwd(), 'uploads', 'merged_unsigned.apk');
            if (!existsSync(filePath)) throw new NotFoundException('Admin APK not found');
            console.log(123123);
            return res.download(filePath);
        } catch (error) {
            console.log(error);
            throw new NotFoundException('Admin APK not found');
        }
    }
}
