import { supabaseAdmin } from './supabase';
import { DogCreateInput, DogCreateSchema } from './validators';

export interface Dog {
  id: number;
  name: string | null;
  breed: string | null;
  age_years: number | null;
  gender: 'male' | 'female' | 'unknown';
  description: string | null;
  area: string;
  location_lat: number | null;
  location_lng: number | null;
  images: string[];
  health_sterilised: boolean;
  health_vaccinated: boolean;
  health_dewormed: boolean;
  microchip_id: string | null;
  compatibility_kids: boolean | null;
  compatibility_dogs: boolean | null;
  compatibility_cats: boolean | null;
  energy_level: string | null;
  temperament: string | null;
  playfulness: string | null;
  special_needs: string | null;
  status: 'available' | 'pending' | 'adopted';
  posted_by: string;
  created_at: string;
  updated_at: string;
  personality_tags?: Array<{
    id: number;
    tag_name: string;
  }>;
}

export interface DogCreateResult {
  id: number;
  name: string | null;
  area: string;
  images: string[];
  status: 'available' | 'pending' | 'adopted';
  created_at: string;
}

export async function listDogs(options: {
  limit?: number;
  offset?: number;
  area?: string;
  status?: 'available' | 'pending' | 'adopted';
  breed?: string;
  gender?: 'male' | 'female' | 'unknown';
} = {}): Promise<{
  dogs: Dog[];
  total: number;
}> {
  const {
    limit = 20,
    offset = 0,
    area,
    status = 'available',
    breed,
    gender
  } = options;

  try {
    // Simple query without complex joins for now
    let query = supabaseAdmin
      .from('dogs')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (area) {
      query = query.ilike('area', `%${area}%`);
    }

    if (breed) {
      query = query.ilike('breed', `%${breed}%`);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching dogs:', error);
      throw new Error(`Failed to fetch dogs: ${error.message}`);
    }

    // Transform to match expected format
    const dogs = (data || []).map(dog => ({
      ...dog,
      personality_tags: [] // We'll implement this properly later
    }));

    return {
      dogs,
      total: count || 0
    };
  } catch (error) {
    console.error('Error in listDogs:', error);
    throw error;
  }
}

export async function getDogById(id: number): Promise<Dog | null> {
  const { data, error } = await supabaseAdmin
    .from('dogs')
    .select(`
      *,
      personality_tags:dog_personality_tags(
        personality_tag:personality_tags(id, tag_name)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching dog:', error);
    throw new Error(`Failed to fetch dog: ${error.message}`);
  }

  // Transform the personality tags structure
  const dog = {
    ...data,
    personality_tags: data.personality_tags?.map((pt: any) => pt.personality_tag).filter(Boolean) || []
  };

  return dog;
}

export async function createDog({ 
  data, 
  ownerUserId 
}: { 
  data: DogCreateInput; 
  ownerUserId: string; 
}): Promise<DogCreateResult> {
  // Validate input data
  const validatedData = DogCreateSchema.parse(data);
  
  // Prepare dog data for insertion
  const dogData = {
    name: validatedData.name || null,
    age_years: validatedData.age_years || null,
    gender: validatedData.gender,
    description: validatedData.description || null,
    area: validatedData.area,
    location_lat: validatedData.location_lat || null,
    location_lng: validatedData.location_lng || null,
    images: validatedData.images,
    health_sterilised: validatedData.health_sterilised,
    health_vaccinated: validatedData.health_vaccinated,
    health_dewormed: validatedData.health_dewormed,
    microchip_id: validatedData.microchip_id || null,
    compatibility_kids: validatedData.compatibility_kids || null,
    compatibility_dogs: validatedData.compatibility_dogs || null,
    compatibility_cats: validatedData.compatibility_cats || null,
    energy_level: validatedData.energy_level || null,
    temperament: validatedData.temperament || null,
    playfulness: validatedData.playfulness || null,
    special_needs: validatedData.special_needs || null,
    status: 'available' as const,
    posted_by: ownerUserId
  };

  // Insert the dog record
  const { data: dogResult, error: dogError } = await supabaseAdmin
    .from('dogs')
    .insert(dogData)
    .select('id, name, area, images, status, created_at')
    .single();

  if (dogError) {
    console.error('Error creating dog:', dogError);
    throw new Error(`Failed to create dog: ${dogError.message}`);
  }

  // Insert personality tag associations if any
  if (validatedData.personality_tag_ids.length > 0) {
    const tagAssociations = validatedData.personality_tag_ids.map(tagId => ({
      dog_id: dogResult.id,
      personality_tag_id: tagId
    }));

    const { error: tagError } = await supabaseAdmin
      .from('dog_personality_tags')
      .insert(tagAssociations);

    if (tagError) {
      console.error('Error creating dog personality tag associations:', tagError);
      // Note: We don't throw here as the dog was created successfully
      // The tags can be added later
    }
  }

  return dogResult;
}
