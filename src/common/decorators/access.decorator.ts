import { applyDecorators, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../guards/access.guard';

export function UserAccess() {
    return applyDecorators(UseGuards(AccessGuard));
}
