import { Injectable } from '@nestjs/common';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import * as crypto from 'crypto';
import { SHA256, enc } from 'crypto-js';
import {
    HASH_ALGORITHM,
    HASH_DELIMITER,
    HASH_DIGEST,
} from 'src/common/helper/constants/hash.constants';
import { IHelperHashService } from 'src/common/helper/interfaces/helper.hash-service.interface';

@Injectable()
export class HelperHashService implements IHelperHashService {
    randomSalt(length: number): string {
        return genSaltSync(length);
    }

    bcrypt(passwordString: string, salt: string): string {
        return hashSync(passwordString, salt);
    }

    bcryptCompare(passwordString: string, passwordHashed: string): boolean {
        return compareSync(passwordString, passwordHashed);
    }

    sha256(string: string): string {
        return SHA256(string).toString(enc.Hex);
    }

    sha256Compare(hashOne: string, hashTwo: string): boolean {
        return hashOne === hashTwo;
    }
    sha256WithSecret(data: string, secret: string): string {
        const hash = crypto.createHash(HASH_ALGORITHM);
        const rawString = data + `${HASH_DELIMITER}${secret}`;
        hash.update(rawString);
        const hashString = hash.digest(HASH_DIGEST);
        return hashString;
    }

    isValidDataChecksum(data: any, checksum: string, secret: string): boolean {
        const dataString = JSON.stringify(data);
        const hashString = this.sha256WithSecret(dataString, secret);
        return checksum === hashString;
    }
}
