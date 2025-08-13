import { z } from 'zod';

// Dog creation schema for POST /dogs
export const DogCreateSchema = z.object({
  name: z.string().optional().transform((val: string | undefined) => val?.trim()).pipe(z.string().max(80).optional()),
  age_years: z.number().optional().pipe(z.number().min(0).max(25).optional()),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
  description: z.string().optional().transform((val: string | undefined) => val?.trim()).pipe(z.string().max(1000).optional()),
  area: z.string().min(2, 'Area is required').max(120).transform((val: string) => val.trim()),
  location_lat: z.number().optional().pipe(z.number().min(-90).max(90).optional()),
  location_lng: z.number().optional().pipe(z.number().min(-180).max(180).optional()),
  health_sterilised: z.boolean().default(false),
  health_vaccinated: z.boolean().default(false),
  health_dewormed: z.boolean().default(false),
  microchip_id: z.string().optional().transform((val: string | undefined) => val?.trim()).pipe(z.string().max(80).optional()),
  compatibility_kids: z.boolean().optional(),
  compatibility_dogs: z.boolean().optional(),
  compatibility_cats: z.boolean().optional(),
  energy_level: z.string().optional().transform((val: string | undefined) => val?.trim()).pipe(z.string().max(20).optional()),
  temperament: z.string().optional().transform((val: string | undefined) => val?.trim()).pipe(z.string().max(100).optional()),
  playfulness: z.string().optional().transform((val: string | undefined) => val?.trim()).pipe(z.string().max(100).optional()),
  special_needs: z.string().optional().transform((val: string | undefined) => val?.trim()).pipe(z.string().max(200).optional()),
  personality_tag_ids: z.array(z.number()).max(20, 'Maximum 20 personality tags allowed').default([]),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least 1 image is required').max(6, 'Maximum 6 images allowed')
});

export type DogCreateInput = z.infer<typeof DogCreateSchema>;

// Dog listing query schema
export const DogListQuerySchema = z.object({
  q: z.string().optional(),
  tagIds: z.string().optional().transform(val => 
    val ? val.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : undefined
  ),
  energy: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['available', 'pending', 'adopted']).optional(),
  compatKids: z.string().optional().transform(val => val === 'true' ? true : undefined),
  compatDogs: z.string().optional().transform(val => val === 'true' ? true : undefined),
  compatCats: z.string().optional().transform(val => val === 'true' ? true : undefined),
  lat: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  lng: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  radiusKm: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  limit: z.string().optional().transform(val => {
    const num = val ? parseInt(val, 10) : 24;
    return Math.min(Math.max(num, 1), 50); // Clamp between 1 and 50
  }),
  offset: z.string().optional().transform(val => {
    const num = val ? parseInt(val, 10) : 0;
    return Math.max(num, 0); // Ensure non-negative
  }),
});

export type DogListQuery = z.infer<typeof DogListQuerySchema>;

// Adoption request schemas
export const AdoptionCreateSchema = z.object({
  dog_id: z.string().uuid(),
  message: z.string().max(500).optional().nullable(),
});

export type AdoptionCreateInput = z.infer<typeof AdoptionCreateSchema>;

export const AdoptionStatusUpdateSchema = z.object({
  status: z.enum(['approved', 'declined', 'cancelled']),
});

export type AdoptionStatusUpdateInput = z.infer<typeof AdoptionStatusUpdateSchema>;

// For updating dogs (future use)
export const DogUpdateSchema = DogCreateSchema.partial().omit({
  images: true, // Images handled separately
  personality_tag_ids: true // Tags handled separately
});

export type DogUpdateInput = z.infer<typeof DogUpdateSchema>;
