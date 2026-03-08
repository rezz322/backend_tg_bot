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

}
