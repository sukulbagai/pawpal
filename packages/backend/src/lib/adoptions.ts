import { supabaseAdmin } from './supabase';

export interface AdoptionRequest {
  id: string;
  dog_id: string;
  adopter_id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  created_at: string;
}

export interface IncomingRequestListItem {
  id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  created_at: string;
  dog: {
    id: string;
    name: string | null;
    area: string;
    images: string[];
    status: 'available' | 'pending' | 'adopted';
  };
  adopter: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  contact_visible: boolean;
}

export interface OutgoingRequestListItem {
  id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  created_at: string;
  dog: {
    id: string;
    name: string | null;
    area: string;
    images: string[];
    status: 'available' | 'pending' | 'adopted';
  };
  caretaker: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

/**
 * Creates a new adoption request
 */
export async function createAdoptionRequest({
  dogId,
  adopterAuthUserId,
  message,
}: {
  dogId: string;
  adopterAuthUserId: string;
  message?: string | null;
}) {
  // First, resolve the adopter's user ID from their auth user ID
  const { data: adopter, error: adopterError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_user_id', adopterAuthUserId)
    .single();

  if (adopterError || !adopter) {
    throw new Error('Adopter not found');
  }

  // Fetch the dog and ensure it exists
  const { data: dog, error: dogError } = await supabaseAdmin
    .from('dogs')
    .select('id, posted_by, status')
    .eq('id', dogId)
    .single();

  if (dogError || !dog) {
    throw new Error('Dog not found');
  }

  // Prevent adopter from requesting their own dog
  if (dog.posted_by === adopter.id) {
    throw new Error('Cannot request adoption of your own dog');
  }

  // Check for existing active request by the same adopter for the same dog
  const { data: existingRequest, error: existingError } = await supabaseAdmin
    .from('adoption_requests')
    .select('id')
    .eq('dog_id', dogId)
    .eq('adopter_id', adopter.id)
    .eq('status', 'pending')
    .single();

  if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows found
    throw new Error('Error checking for existing requests');
  }

  if (existingRequest) {
    throw new Error('You already have a pending request for this dog');
  }

  // Create the adoption request
  const { data: newRequest, error: createError } = await supabaseAdmin
    .from('adoption_requests')
    .insert({
      dog_id: dogId,
      adopter_id: adopter.id,
      message: message || null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (createError) {
    throw new Error('Failed to create adoption request');
  }

  return newRequest;
}

/**
 * Lists incoming adoption requests for an owner
 */
export async function listIncomingRequests({ ownerAuthUserId }: { ownerAuthUserId: string }) {
  // First, resolve the owner's user ID from their auth user ID
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_user_id', ownerAuthUserId)
    .single();

  if (ownerError || !owner) {
    throw new Error('Owner not found');
  }

  // Fetch adoption requests for dogs posted by this owner
  const { data: requests, error: requestsError } = await supabaseAdmin
    .from('adoption_requests')
    .select(`
      id,
      message,
      status,
      created_at,
      dogs!inner (
        id,
        name,
        area,
        images,
        status,
        posted_by
      ),
      adopter:users!adoption_requests_adopter_id_fkey (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('dogs.posted_by', owner.id)
    .order('created_at', { ascending: false });

  if (requestsError) {
    throw new Error('Failed to fetch incoming requests');
  }

  // Transform the data and apply contact visibility rules
  const transformedRequests: IncomingRequestListItem[] = requests.map((request: any) => ({
    id: request.id,
    message: request.message,
    status: request.status,
    created_at: request.created_at,
    dog: {
      id: request.dogs.id,
      name: request.dogs.name,
      area: request.dogs.area,
      images: request.dogs.images,
      status: request.dogs.status,
    },
    adopter: {
      id: request.adopter.id,
      name: request.adopter.name,
      email: request.status === 'approved' ? request.adopter.email : null,
      phone: request.status === 'approved' ? request.adopter.phone : null,
    },
    contact_visible: request.status === 'approved',
  }));

  return transformedRequests;
}

/**
 * Lists outgoing adoption requests for an adopter
 */
export async function listOutgoingRequests({ adopterAuthUserId }: { adopterAuthUserId: string }) {
  // First, resolve the adopter's user ID from their auth user ID
  const { data: adopter, error: adopterError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_user_id', adopterAuthUserId)
    .single();

  if (adopterError || !adopter) {
    throw new Error('Adopter not found');
  }

  // Fetch adoption requests made by this adopter
  const { data: requests, error: requestsError } = await supabaseAdmin
    .from('adoption_requests')
    .select(`
      id,
      message,
      status,
      created_at,
      dogs (
        id,
        name,
        area,
        images,
        status,
        posted_by,
        owner:users!dogs_posted_by_fkey (
          id,
          name,
          email,
          phone
        )
      )
    `)
    .eq('adopter_id', adopter.id)
    .order('created_at', { ascending: false });

  if (requestsError) {
    throw new Error('Failed to fetch outgoing requests');
  }

  // Transform the data and apply contact visibility rules
  const transformedRequests: OutgoingRequestListItem[] = requests.map((request: any) => ({
    id: request.id,
    message: request.message,
    status: request.status,
    created_at: request.created_at,
    dog: {
      id: request.dogs.id,
      name: request.dogs.name,
      area: request.dogs.area,
      images: request.dogs.images,
      status: request.dogs.status,
    },
    caretaker: request.status === 'approved' ? {
      name: request.dogs.owner.name,
      email: request.dogs.owner.email,
      phone: request.dogs.owner.phone,
    } : null,
  }));

  return transformedRequests;
}

/**
 * Gets the current user's adoption request for a specific dog (if any)
 */
export async function getMyRequestForDog({
  dogId,
  userAuthUserId,
}: {
  dogId: string;
  userAuthUserId: string;
}): Promise<AdoptionRequest | null> {
  // First, resolve the user's ID from their auth user ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_user_id', userAuthUserId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  // Fetch the user's adoption request for this dog
  const { data: request, error: requestError } = await supabaseAdmin
    .from('adoption_requests')
    .select('*')
    .eq('dog_id', dogId)
    .eq('adopter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requestError) {
    throw new Error('Failed to fetch adoption request');
  }

  return request;
}

/**
 * Updates the status of an adoption request
 */
export async function updateAdoptionStatus({
  requestId,
  ownerAuthUserId,
  status,
}: {
  requestId: string;
  ownerAuthUserId: string;
  status: 'approved' | 'declined' | 'cancelled';
}) {
  // First, resolve the owner's user ID from their auth user ID
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_user_id', ownerAuthUserId)
    .single();

  if (ownerError || !owner) {
    console.error('Owner not found:', ownerError);
    throw new Error('Owner not found');
  }

  // Fetch the adoption request first
  const { data: adoptionRequest, error: adoptionError } = await supabaseAdmin
    .from('adoption_requests')
    .select('id, status, dog_id')
    .eq('id', requestId)
    .single();

  if (adoptionError || !adoptionRequest) {
    console.error('Adoption request not found:', adoptionError);
    throw new Error('Adoption request not found');
  }

  // Then fetch the dog to verify ownership
  const { data: dog, error: dogError } = await supabaseAdmin
    .from('dogs')
    .select('id, status, posted_by')
    .eq('id', adoptionRequest.dog_id)
    .single();

  if (dogError || !dog) {
    console.error('Dog not found:', dogError);
    throw new Error('Dog not found');
  }

  // Verify that the owner owns the dog
  if (dog.posted_by !== owner.id) {
    console.error('Unauthorized access attempt:', { 
      dogOwner: dog.posted_by, 
      requestingUser: owner.id 
    });
    throw new Error('Unauthorized: You can only update requests for your own dogs');
  }

  // Update the adoption request status
  const { data: updatedRequest, error: updateError } = await supabaseAdmin
    .from('adoption_requests')
    .update({ status })
    .eq('id', requestId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Failed to update adoption request status:', updateError);
    throw new Error('Failed to update adoption request status');
  }

  // If approved and the dog is still available, update dog status to pending
  let updatedDog = null;
  if (status === 'approved' && dog.status === 'available') {
    const { data: dogUpdate, error: dogUpdateError } = await supabaseAdmin
      .from('dogs')
      .update({ status: 'pending' })
      .eq('id', dog.id)
      .select('*')
      .single();

    if (dogUpdateError) {
      // Log error but don't fail the whole operation
      console.error('Failed to update dog status to pending:', dogUpdateError);
    } else {
      updatedDog = dogUpdate;
    }
  }

  return {
    request: updatedRequest,
    dog: updatedDog,
  };
}
