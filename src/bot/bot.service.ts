import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { checkIsAdmin } from '../utils';

@Injectable()
export class BotService {
    constructor(private prisma: PrismaService) { }

    checkAdmin(id: string): boolean {
        return checkIsAdmin(id);
    }
}
