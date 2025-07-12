import Ajv, { AnySchema, ValidateFunction } from 'ajv';
import { Fields } from './types';

export const createComparisonObject = (primitiveType: string | string[]) => {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      $gt: { type: primitiveType, nullable: true },
      $lt: { type: primitiveType, nullable: true },
      $gte: { type: primitiveType, nullable: true },
      $lte: { type: primitiveType, nullable: true },
      $ne: { type: primitiveType, nullable: true },
    },
  };
};

export const createFieldSchema = (primitiveType: string | string[]) => ({
  anyOf: [
    { type: primitiveType },
    createComparisonObject(primitiveType),
  ]
});

export const baseQuerySchema = {
  $limit: { type: 'integer', nullable: true, minimum: 0, default: 10 },
  $skip: { type: 'integer', nullable: true, minimum: 0, default: 0 },
  $sort: {
    type: 'object',
    additionalProperties: { type: 'integer', enum: [1, -1] },
    nullable: true
  },
};

export const createQuerySchema = (fields: Fields): ValidateFunction => {
  const resolvedSchema: Record<string, any> = {};

  for (let field in fields) {
    resolvedSchema[field] = createFieldSchema(fields[field].type);
  }

  const jsonSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...resolvedSchema,
      $or: {
        type: 'array',
        items: {
          type: 'object',
          maxProperties: 1,
          properties: {
            ...resolvedSchema,
          },
        }
      },
      $limit: { type: 'integer', nullable: true, minimum: 0, default: 10 },
      $skip: { type: 'integer', nullable: true, minimum: 0, default: 0 },
      $sort: {
        type: 'object',
        additionalProperties: { type: 'integer', enum: [1, -1] },
        nullable: true
      }
    },
  };

  const ajv = new Ajv({ allErrors: true });

  const compiled = ajv.compile(jsonSchema);

  return compiled;
};
