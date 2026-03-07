import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BotService {
    constructor(private prisma: PrismaService) { }

    checkAdmin(id: string): boolean {
        const adminIdsString = process.env.ADMIN_IDS || '';
        const adminIds = adminIdsString.split(',').map(s => s.trim());
        return adminIds.includes(id);
    }
}
