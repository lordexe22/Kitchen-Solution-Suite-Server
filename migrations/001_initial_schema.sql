-- Migration 001: Initial Schema
-- Creates all necessary tables and enums for authentication

-- Create public schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Drop existing objects if they exist (for clean re-runs)
DROP TABLE IF EXISTS public.api_platforms CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS public.user_type CASCADE;
DROP TYPE IF EXISTS public.user_state CASCADE;
DROP TYPE IF EXISTS public.platform_name CASCADE;

-- Create enums in public schema
CREATE TYPE public.user_type AS ENUM ('admin', 'employee', 'guest', 'dev');
CREATE TYPE public.user_state AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE public.platform_name AS ENUM ('local', 'google', 'facebook', 'x');

-- Create users table in public schema
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  type public.user_type NOT NULL DEFAULT 'guest',
  branch_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  state public.user_state NOT NULL DEFAULT 'pending',
  image_url TEXT
);

-- Create api_platforms table in public schema
CREATE TABLE public.api_platforms (
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform_name public.platform_name NOT NULL,
  token TEXT NOT NULL,
  linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, platform_name)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_type ON public.users(type);
CREATE INDEX idx_users_state ON public.users(state);
CREATE INDEX idx_api_platforms_user_id ON public.api_platforms(user_id);
