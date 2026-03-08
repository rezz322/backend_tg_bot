import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { BotService } from '../../bot/bot.service';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private botService: BotService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const adminId = request.query?.adminId || request.body?.adminId;

        if (!adminId || !this.botService.checkAdmin(adminId)) {
            throw new ForbiddenException('Access denied: Admin privileges required');
        }

        return true;
    }
}
