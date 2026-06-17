-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables/views to allow clean setup
drop table if exists public.reports cascade;
drop table if exists public.messages cascade;
drop table if exists public.requests cascade;
drop table if exists public.profiles cascade;
drop view if exists public.profiles cascade;

-- Create profiles table linked to Auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  phone text,
  blood_group text,
  state text,
  district text,
  city text,
  role text default 'donor',
  donor_type text default 'volunteer',
  kyc_status text default 'none',
  available boolean default true,
  email_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create automatic profile creation on signup trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, available)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'donor'),
    coalesce((new.raw_user_meta_data->>'available')::boolean, true)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Create requests table
create table public.requests (
  id uuid default gen_random_uuid() primary key,
  patient_name text not null,
  blood_group text not null,
  hospital text not null,
  state text,
  district text,
  city text,
  contact text,
  urgency text default 'Critical',
  status text default 'pending',
  requester_id uuid references auth.users on delete cascade,
  targeted_donor_id uuid references auth.users on delete set null,
  
  -- Fulfilled info
  donor_id uuid references auth.users on delete set null,
  donor_name text,
  donor_phone text,
  completed_at timestamp with time zone,
  
  -- Legacy accepted info
  accepted_by uuid references auth.users on delete set null,
  accepted_at timestamp with time zone,
  confirmed_by uuid references auth.users on delete set null,
  donor_contact text,
  
  -- Real-time accepted status dictionary (equivalent to firestore map)
  accepted_donors jsonb default '{}'::jsonb,
  
  -- Last message info
  last_message_at bigint,
  last_message_by uuid references auth.users(id) on delete set null,
  last_message_text text,
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on requests
alter table public.requests enable row level security;

-- Requests RLS policies
create policy "Requests are viewable by everyone"
  on public.requests for select
  using (true);

create policy "Authenticated users can create requests"
  on public.requests for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update their own requests or requests they accepted"
  on public.requests for update
  using (
    auth.uid() = requester_id or 
    auth.role() = 'authenticated'
  );

create policy "Users can delete their own requests"
  on public.requests for delete
  using (auth.uid() = requester_id);


-- Create messages table (secure chat)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.requests(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  created_at bigint not null -- using timestamp millisecond numeric matching firestore's Date.now()
);

-- Enable RLS on messages
alter table public.messages enable row level security;

-- Messages RLS policies
create policy "Requesters and accepted/confirmed donors can view messages"
  on public.messages for select
  using (
    auth.role() = 'authenticated' and (
      exists (
        select 1 from public.requests r
        where r.id = request_id and (
          r.requester_id = auth.uid() or
          r.confirmed_by = auth.uid() or
          (r.accepted_donors->>auth.uid()::text) is not null or
          r.accepted_by = auth.uid()
        )
      )
    )
  );

create policy "Requesters and accepted/confirmed donors can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.requests r
      where r.id = request_id and (
        r.requester_id = auth.uid() or
        r.confirmed_by = auth.uid() or
        (r.accepted_donors->>auth.uid()::text) is not null or
        r.accepted_by = auth.uid()
      )
    )
  );


-- Create reports table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  target_user_id uuid references auth.users(id) on delete cascade,
  target_name text,
  reason text,
  status text default 'pending',
  timestamp timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on reports
alter table public.reports enable row level security;

-- Reports RLS policies
create policy "Authenticated users can submit reports"
  on public.reports for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can view reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Enable Realtime replication for requests and messages tables
alter publication supabase_realtime add table public.requests, public.messages;

