-- Créer la table profiles pour stocker les informations utilisateurs
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('ELEVE', 'ENSEIGNANT', 'PARENT', 'ADMIN')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Activer RLS sur la table profiles
alter table public.profiles enable row level security;

-- Policy: Les utilisateurs peuvent voir leur propre profil
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Policy: Les utilisateurs peuvent mettre à jour leur propre profil
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Fonction pour créer automatiquement un profil lors de l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'ELEVE')
  );
  return new;
end;
$$;

-- Trigger pour créer automatiquement un profil
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fonction pour mettre à jour automatiquement updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger pour mettre à jour automatiquement updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();