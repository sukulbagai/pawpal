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

//For validation of query parameters in GET requests
export const DogListQuerySchema = z.object({
  q: z.string().optional().transform((val: string | undefined) => val?.trim()),
  tagIds: z.string().optional().transform((val: string | undefined) => 
    val ? val.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : undefined
  ).pipe(z.array(z.number()).optional()),
  energy: z.enum(['low', 'medium', 'high']).optional(),
  compatKids: z.string().optional().transform((val: string | undefined) => 
    val === 'true' ? true : val === 'false' ? false : undefined
  ).pipe(z.boolean().optional()),
  compatDogs: z.string().optional().transform((val: string | undefined) => 
    val === 'true' ? true : val === 'false' ? false : undefined
  ).pipe(z.boolean().optional()),
  compatCats: z.string().optional().transform((val: string | undefined) => 
    val === 'true' ? true : val === 'false' ? false : undefined
  ).pipe(z.boolean().optional()),
  status: z.enum(['available', 'pending', 'adopted']).optional(),
  lat: z.string().optional().transform((val: string | undefined) => 
    val ? parseFloat(val) : undefined
  ).pipe(z.number().min(-90).max(90).optional()),
  lng: z.string().optional().transform((val: string | undefined) => 
    val ? parseFloat(val) : undefined
  ).pipe(z.number().min(-180).max(180).optional()),
  radiusKm: z.string().optional().transform((val: string | undefined) => 
    val ? parseFloat(val) : undefined
  ).pipe(z.number().min(0.1).max(100).optional()),
  limit: z.string().optional().transform((val: string | undefined) => 
    val ? Math.min(parseInt(val, 10), 50) : 24
  ).pipe(z.number().min(1).max(50)),
  offset: z.string().optional().transform((val: string | undefined) => 
    val ? parseInt(val, 10) : 0
  ).pipe(z.number().min(0))
});

export type DogListQuery = z.infer<typeof DogListQuerySchema>;

// For updating dogs (future use)
export const DogUpdateSchema = DogCreateSchema.partial().omit({
  images: true, // Images handled separately
  personality_tag_ids: true // Tags handled separately
});

export type DogUpdateInput = z.infer<typeof DogUpdateSchema>;
