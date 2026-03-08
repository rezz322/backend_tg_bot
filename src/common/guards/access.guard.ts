import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TelegramUsersService } from '../../telegram-users/telegram-users.service';

@Injectable()
export class AccessGuard implements CanActivate {
    constructor(private telegramUsersService: TelegramUsersService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        // Assuming the bot sends userId in the request (e.g., query or body)
        const userId =
            request.body?.telegramId ||
            request.query?.telegramId ||
            request.body?.userId ||
            request.query?.userId ||
            request.params?.id ||
            request.params?.identifier ||
            request.query?.id;

        if (!userId) {
            throw new ForbiddenException('User ID is required for access check');
        }

        const access = await this.telegramUsersService.checkAccess(userId);

        if (!access.allowed) {
            throw new ForbiddenException(access.message);
        }

        return true;
    }
}
