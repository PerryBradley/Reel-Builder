-- Reels table
create table reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  template text not null default 'showcase',
  clips jsonb not null default '[]',
  branding_preset_id text,
  share_token text unique,
  views jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Branding presets table
create table branding_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  background text not null default 'black',
  logo_url text,
  logo_data_url text,
  logo_link_url text,
  fallback_text text,
  font text not null default 'Inter',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Site settings table (logo, company name per user)
create table site_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  site_logo_data_url text,
  updated_at timestamptz default now()
);

-- Enable RLS on all tables
alter table reels enable row level security;
alter table branding_presets enable row level security;
alter table site_settings enable row level security;

-- RLS policies (users can only see their own data)
create policy "Users can manage their own reels"
  on reels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own presets"
  on branding_presets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own settings"
  on site_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow public read access to reels via share_token
create policy "Public can view reels by share token"
  on reels for select
  using (share_token is not null);

-- Allow anonymous read of branding presets linked to a publicly shared reel
create policy "Public can read presets linked to shared reels"
  on branding_presets for select
  using (
    exists (
      select 1 from reels
      where reels.share_token is not null
        and reels.branding_preset_id is not null
        and reels.branding_preset_id = branding_presets.id::text
    )
  );

-- Append a single view event to a reel by share token (public analytics; bypasses RLS)
create or replace function public.append_reel_view(p_share_token text, p_event jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update reels
  set
    views = coalesce(views, '[]'::jsonb) || jsonb_build_array(p_event),
    updated_at = now()
  where share_token = p_share_token;
end;
$$;

grant execute on function public.append_reel_view(text, jsonb) to anon, authenticated;
