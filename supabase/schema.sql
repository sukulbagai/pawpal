-- PawPal Database Schema
-- Run this first in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE role AS ENUM ('adopter', 'feeder', 'shelter', 'admin');
CREATE TYPE dog_status AS ENUM ('available', 'pending', 'adopted');
CREATE TYPE gender AS ENUM ('male', 'female', 'unknown');

-- Create tables
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE NOT NULL,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    role role NOT NULL DEFAULT 'adopter',
    locality text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.personality_tags (
    id serial PRIMARY KEY,
    tag_name text UNIQUE NOT NULL,
    description text
);

CREATE TABLE public.dogs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    age_years numeric(3,1),
    gender gender DEFAULT 'unknown',
    description text,
    area text, -- colony/locality name
    location_lat numeric(9,6),
    location_lng numeric(9,6),
    health_sterilised boolean DEFAULT false,
    health_vaccinated boolean DEFAULT false,
    health_dewormed boolean DEFAULT false,
    microchip_id text,
    compatibility_kids boolean,
    compatibility_dogs boolean,
    compatibility_cats boolean,
    energy_level text, -- low/medium/high
    temperament text, -- friendly/shy/protective...
    playfulness text, -- playful/calm/water-loving...
    special_needs text,
    personality_tag_ids int[] DEFAULT '{}',
    images text[] DEFAULT '{}', -- public image URLs
    posted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status dog_status NOT NULL DEFAULT 'available',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.adoption_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
    adopter_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    message text,
    status text NOT NULL DEFAULT 'pending', -- pending/approved/declined
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
    uploader_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    doc_type text NOT NULL, -- vaccination | sterilisation | adoption_agreement
    url text NOT NULL, -- storage signed URL or path
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_dogs_status_created ON public.dogs(status, created_at);
CREATE INDEX idx_dogs_location_lat ON public.dogs(location_lat);
CREATE INDEX idx_dogs_location_lng ON public.dogs(location_lng);
CREATE INDEX idx_adoption_requests_dog_status ON public.adoption_requests(dog_id, status, created_at);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
