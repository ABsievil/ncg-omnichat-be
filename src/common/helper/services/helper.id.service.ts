import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class HelperIdService {
    isSnowflakeId(id: string): boolean {
        if (!id) {
            return false;
        }

        // snowflake format
        if (!/^[0-9]+$/.test(id)) {
            return false;
        }

        try {
            const value = BigInt(id);
            return value > 0n;
        } catch {
            return false;
        }
    }

    isValidId(id: string): boolean {
        if (!id) {
            return false;
        }

        // Hỗ trợ cả UUID và Snowflake ID
        return isUUID(id) || this.isSnowflakeId(id);
    }
}
