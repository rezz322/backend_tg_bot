import { NotFoundException } from '@nestjs/common';
import { customAlphabet } from 'nanoid';

/**
 * Sanitizes Telegram ID by removing non-numeric characters and converting to bigint.
 */
export function sanitizeId(id: any): string {
    const sanitized = String(id).trim().replace(/[^\d-]/g, '');
    if (!sanitized) throw new NotFoundException('Invalid telegramId format');
    return sanitized;
}

/**
 * Generates a random key of specified length.
 */
export function generateKey(length: number = 12): string {
    const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', length);
    return nanoid();
}

/**
 * Checks if a user ID is an admin based on environment variables.
 */
export function checkIsAdmin(id: string): boolean {
    const adminIdsString = process.env.ADMIN_IDS || '';
    const adminIds = adminIdsString.split(',').map(s => s.trim());
    return adminIds.includes(String(id));
}
