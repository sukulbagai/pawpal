import { supabaseAdmin } from './supabase';
import { DogCreateInput, DogCreateSchema, DogListQuery } from './validators';

export interface Dog {
  id: string;
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
  personality_tag_ids?: number[];
}

export interface DogCreateResult {
  id: string;
  name: string | null;
  area: string;
  images: string[];
  status: 'available' | 'pending' | 'adopted';
  created_at: string;
}

export async function listDogs(params: Partial<DogListQuery> = {}): Promise<{
  items: Dog[];
  total: number;
}> {
  const {
    q,
    tagIds,
    energy,
    compatKids,
    compatDogs,
    compatCats,
    status = 'available',
    lat,
    lng,
    radiusKm,
    limit = 24,
    offset = 0
  } = params;

  try {
    // Start building query
    let query = supabaseAdmin
      .from('dogs')
      .select('*, personality_tag_ids', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false });

    // Text search on name or area
    if (q && q.trim()) {
      query = query.or(`name.ilike.%${q}%,area.ilike.%${q}%`);
    }

    // Energy level filter
    if (energy) {
      query = query.eq('energy_level', energy);
    }

    // Compatibility filters
    if (compatKids !== undefined) {
      query = query.eq('compatibility_kids', compatKids);
    }
    if (compatDogs !== undefined) {
      query = query.eq('compatibility_dogs', compatDogs);
    }
    if (compatCats !== undefined) {
      query = query.eq('compatibility_cats', compatCats);
    }

    // Tag filter - check if any of the provided tag IDs overlap with dog's personality_tag_ids
    if (tagIds && tagIds.length > 0) {
      query = query.overlaps('personality_tag_ids', tagIds);
    }

    // Geographic radius filter (approximate bounding box)
    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      const latDelta = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
      
      query = query
        .gte('location_lat', lat - latDelta)
        .lte('location_lat', lat + latDelta)
        .gte('location_lng', lng - lngDelta)
        .lte('location_lng', lng + lngDelta);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching dogs:', error);
      throw new Error(`Failed to fetch dogs: ${error.message}`);
    }

    // Transform to match expected format
    const items = (data || []).map(dog => ({
      ...dog,
      personality_tags: [] // Will be populated if needed
    }));

    return {
      items,
      total: count || 0
    };
  } catch (error) {
    console.error('Error in listDogs:', error);
    throw error;
  }
}

export async function getDogById(id: string): Promise<Dog | null> {
  // First get the dog
  const { data: dogData, error: dogError } = await supabaseAdmin
    .from('dogs')
    .select('*')
    .eq('id', id)
    .single();

  if (dogError) {
    if (dogError.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching dog:', dogError);
    throw new Error(`Failed to fetch dog: ${dogError.message}`);
  }

  // Then get personality tags
  const { data: tagsData, error: tagsError } = await supabaseAdmin
    .from('dog_personality_tags')
    .select(`
      personality_tags (
        id,
        tag_name
      )
    `)
    .eq('dog_id', id);

  if (tagsError) {
    console.error('Error fetching personality tags:', tagsError);
  }

  // Combine the data
  const dog = {
    ...dogData,
    personality_tags: tagsData?.map((t: any) => t.personality_tags).filter(Boolean) || []
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
