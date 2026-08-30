import { z } from 'zod';

// Shared building blocks for the per-module *.validations.ts files so every
// route doesn't reinvent "required string" / "valid Mongo id" checks.

export const requiredString = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`);

export const objectId = (field = 'id') =>
  z
    .string({ required_error: `${field} is required` })
    .regex(/^[0-9a-fA-F]{24}$/, `${field} must be a valid id`);

export const idParam = (field = 'id') =>
  z.object({
    [field]: objectId(field),
  });
