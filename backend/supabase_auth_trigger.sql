-- 1. Create a function to handle new user signups from Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    phone,
    role,
    university_id,
    business_name,
    service_type,
    is_verified,
    created_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'universityId',
    new.raw_user_meta_data->>'businessName',
    new.raw_user_meta_data->>'serviceType',
    true, -- Auto-verify for now, or change if using email confirmations
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger on the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. (Optional but recommended) Ensure RLS is enabled on profiles but allows users to read their own data
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
