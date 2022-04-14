import {never, object, Struct} from 'superstruct';
import Boom from '@hapi/boom';
import type {ObjectSchema, ObjectType} from 'superstruct/lib/utils';

export function assertStruct<T>(struct: Struct<T>, value: unknown): T {
    const [err, ret] = struct.validate(value, {coerce: true});
    if (err)
        throw Boom.badData(err.message, err);
    return ret!!;
}

const rawObject = object();

export function partialObject<S extends ObjectSchema>(schema?: S): Struct<Partial<ObjectType<S>>, S> {
    const knowns = schema ? Object.keys(schema) : [];
    const Never = never();
    return new Struct({
        type: 'object',
        schema: schema ? schema : null,
        * entries(value) {
            if (schema && typeof value === 'object' && value != null) {
                const unknowns = new Set(Object.keys(value));

                for (const key of knowns) {
                    if (unknowns.delete(key))
                        yield [key, value[key], schema[key]];
                }

                for (const key of unknowns) {
                    yield [key, value[key], Never];
                }
            }
        },
        validator: rawObject.validator,
        coercer: rawObject.coercer,
    }) as any;
}
