import { Inject, Injectable, mixin, PipeTransform, Type } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

export function RequestArrayPipe(separator: string): Type<PipeTransform> {
    @Injectable()
    class MixinRequestArrayPipe implements PipeTransform {
        constructor(
            @Inject(REQUEST)
            private readonly request: Request
        ) {}

        async transform(value: string): Promise<string[] | any> {
            if (!value) {
                return [];
            }

            const values = value
                .split(separator)
                .map(col => col.trim())
                .filter(Boolean);
            if (values.length === 0) return [];

            return values;
        }
    }
    return mixin(MixinRequestArrayPipe);
}
