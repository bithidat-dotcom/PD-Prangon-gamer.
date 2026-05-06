-- Run this in your Supabase SQL Editor to set up the database for Conector/qchatr

-- 1. Create Users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  display_name text,
  photo_url text,
  banner_url text,
  bio text,
  phone_number text,
  connections uuid[] default '{}',
  muted_users uuid[] default '{}',
  blocked_users uuid[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Chats table
create table if not exists public.chats (
  id text primary key,
  name text,
  participants uuid[] default '{}',
  owner_id uuid references auth.users,
  is_group boolean default false,
  last_message text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text references public.chats(id) on delete cascade not null,
  sender_id uuid references auth.users not null,
  content text not null,
  type text default 'text',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Stories table
create table if not exists public.stories (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references auth.users not null,
  author_name text,
  author_photo text,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- Enable RLS (Optional, but recommended)
alter table public.users enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.stories enable row level security;

-- Basic Policies (Public access for demo purposes, harden these later)
create policy "Public users can view profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create policy "Users can view chats they are in" on public.chats for select using (auth.uid() = any(participants));
create policy "Users can create chats" on public.chats for insert with check (auth.uid() = any(participants));
create policy "Users can update chats they are in" on public.chats for update using (auth.uid() = any(participants));

create policy "Users can view messages in their chats" on public.messages for select using (
  exists (select 1 from public.chats where id = chat_id and auth.uid() = any(participants))
);
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);

create policy "Users can view stories" on public.stories for select using (true);
create policy "Users can post stories" on public.stories for insert with check (auth.uid() = author_id);
