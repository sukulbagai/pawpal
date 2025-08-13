// Query string helpers for dog list filtering

export interface DogListQuery {
  q?: string;
  energy?: 'low' | 'medium' | 'high';
  status?: 'available' | 'pending' | 'adopted';
  compatKids?: boolean;
  compatDogs?: boolean;
  compatCats?: boolean;
  tagIds?: number[];
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
  offset?: number;
}

// Helper functions for type coercion
export function coerceBool(value: string | null): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function coerceNumber(value: string | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

export function coerceNumArray(value: string | null): number[] | undefined {
  if (value === null || value === undefined) return undefined;
  try {
    const nums = value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    return nums.length > 0 ? nums : undefined;
  } catch {
    return undefined;
  }
}

// Parse URL search params into DogListQuery
export function parseDogListQuery(search: string): DogListQuery {
  const params = new URLSearchParams(search);
  
  return {
    q: params.get('q') || undefined,
    energy: (params.get('energy') as 'low' | 'medium' | 'high') || undefined,
    status: (params.get('status') as 'available' | 'pending' | 'adopted') || undefined,
    compatKids: coerceBool(params.get('compatKids')),
    compatDogs: coerceBool(params.get('compatDogs')),
    compatCats: coerceBool(params.get('compatCats')),
    tagIds: coerceNumArray(params.get('tagIds')),
    lat: coerceNumber(params.get('lat')),
    lng: coerceNumber(params.get('lng')),
    radiusKm: coerceNumber(params.get('radiusKm')),
    limit: coerceNumber(params.get('limit')) || 24,
    offset: coerceNumber(params.get('offset')) || 0,
  };
}

// Convert DogListQuery to URL search string
export function stringifyDogListQuery(query: DogListQuery): string {
  const params = new URLSearchParams();
  
  if (query.q) params.set('q', query.q);
  if (query.energy) params.set('energy', query.energy);
  if (query.status) params.set('status', query.status);
  if (query.compatKids !== undefined) params.set('compatKids', query.compatKids.toString());
  if (query.compatDogs !== undefined) params.set('compatDogs', query.compatDogs.toString());
  if (query.compatCats !== undefined) params.set('compatCats', query.compatCats.toString());
  if (query.tagIds && query.tagIds.length > 0) params.set('tagIds', query.tagIds.join(','));
  if (query.lat !== undefined) params.set('lat', query.lat.toString());
  if (query.lng !== undefined) params.set('lng', query.lng.toString());
  if (query.radiusKm !== undefined) params.set('radiusKm', query.radiusKm.toString());
  if (query.limit && query.limit !== 24) params.set('limit', query.limit.toString());
  if (query.offset && query.offset !== 0) params.set('offset', query.offset.toString());
  
  return params.toString();
}

// Create default query
export function createDefaultQuery(): DogListQuery {
  return {
    limit: 24,
    offset: 0,
  };
}

// Helper to build query string for API calls
export function buildApiQueryString(query: DogListQuery): string {
  return stringifyDogListQuery(query);
}
