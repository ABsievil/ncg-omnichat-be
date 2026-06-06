import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AES, enc, lib, mode, pad } from 'crypto-js';
import { IHelperEncryptionService } from 'src/common/helper/interfaces/helper.encryption-service.interface';
import {
    IHelperJwtOptions,
    IHelperJwtVerifyOptions,
} from 'src/common/helper/interfaces/helper.interface';

@Injectable()
export class HelperEncryptionService implements IHelperEncryptionService {
    private readonly logger = new Logger(HelperEncryptionService.name);

    constructor(private readonly jwtService: JwtService) {}

    base64Encrypt(data: string): string {
        const buff: Buffer = Buffer.from(data, 'utf8');
        return buff.toString('base64');
    }

    base64Decrypt(data: string): string {
        const buff: Buffer = Buffer.from(data, 'base64');
        return buff.toString('utf8');
    }

    base64Compare(basicToken1: string, basicToken2: string): boolean {
        return basicToken1 === basicToken2;
    }

    generateRandomIv(): string {
        const randomWordArray = lib.WordArray.random(16);
        return randomWordArray.toString(enc.Hex);
    }

    aes256EncryptWithIv<T = Record<string, any>>(
        data: T,
        key: string
    ): { encryptedData: string; iv: string } {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        return {
            encryptedData: encrypted,
            iv: iv.toString('base64'),
        };
    }

    aes256Encrypt<T = Record<string, any>>(
        data: T,
        key: string,
        iv: string
    ): string {
        const cIv = enc.Utf8.parse(iv);
        const cipher = AES.encrypt(JSON.stringify(data), key, {
            mode: mode.CBC,
            padding: pad.Pkcs7,
            iv: cIv,
        });

        return cipher.toString();
    }

    aes256DecryptWithIv<T = Record<string, any>>(
        encryptedData: string,
        key: string,
        iv: string
    ): T {
        try {
            const ivBuffer = Buffer.from(iv, 'base64');
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                key,
                ivBuffer
            );
            let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);
        } catch (error) {
            this.logger.error(`Decryption failed: ${error.message}`);
            throw new Error(
                'Failed to decrypt data: Invalid format, wrong IV/key, or corrupted data'
            );
        }
    }

    aes256Decrypt<T = Record<string, any>>(
        encrypted: string,
        key: string,
        iv: string
    ): T {
        try {
            const cIv = enc.Utf8.parse(iv);
            const cipher = AES.decrypt(encrypted, key, {
                mode: mode.CBC,
                padding: pad.Pkcs7,
                iv: cIv,
            });

            return JSON.parse(cipher.toString(enc.Utf8));
        } catch (error) {
            this.logger.error(`Decryption failed: ${error.message}`);
            throw new Error(
                'Failed to decrypt data: Invalid format or corrupted data'
            );
        }
    }

    aes256Compare(aes1: string, aes2: string): boolean {
        return aes1 === aes2;
    }

    jwtEncrypt(
        payload: Record<string, any>,
        options: IHelperJwtOptions
    ): string {
        return this.jwtService.sign(payload as any, {
            secret: options.secretKey,
            expiresIn: options.expiredIn,
            notBefore: options.notBefore ?? 0,
            audience: options.audience,
            issuer: options.issuer,
            subject: options.subject,
        } as any);
    }

    jwtDecrypt<T>(token: string): T {
        return this.jwtService.decode<T>(token);
    }

    jwtVerify(token: string, options: IHelperJwtVerifyOptions): boolean {
        try {
            this.jwtService.verify(token, {
                secret: options.secretKey,
                audience: options.audience,
                issuer: options.issuer,
                subject: options.subject,
                ignoreExpiration: options.ignoreExpiration ?? false,
            });

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }
}
