-- KursAI Database Schema for Supabase

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============ USERS ============
create table if not exists public.users (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    email text unique not null,
    avatar text,
    role text default 'owner' check (role in ('owner', 'staff', 'admin')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own data"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update own data"
    on public.users for update
    using (auth.uid() = id);

-- ============ BUSINESSES ============
create table if not exists public.businesses (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.users(id) on delete cascade not null,
    name text not null,
    logo text,
    address text,
    phone text,
    timezone text default 'Asia/Jakarta',
    created_at timestamptz default now()
);

alter table public.businesses enable row level security;

create policy "Owner can manage businesses"
    on public.businesses for all
    using (auth.uid() = owner_id);

-- ============ PRODUCTS ============
create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    name text not null,
    sku text,
    category text,
    stock integer default 0,
    buy_price numeric(12,0) default 0,
    sell_price numeric(12,0) default 0,
    min_stock integer default 0,
    unit text default 'pcs',
    description text,
    created_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Users can manage products"
    on public.products for all
    using (
        exists (
            select 1 from public.businesses
            where id = business_id and owner_id = auth.uid()
        )
    );

-- ============ TRANSACTIONS ============
create type transaction_type as enum ('penjualan', 'pengeluaran', 'pembelian', 'kasbon', 'pendapatan_lain');

create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete set null,
    type transaction_type not null,
    quantity integer default 1,
    amount numeric(12,0) not null,
    note text,
    customer_name text,
    date timestamptz default now(),
    created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Users can manage transactions"
    on public.transactions for all
    using (
        exists (
            select 1 from public.businesses
            where id = business_id and owner_id = auth.uid()
        )
    );

-- ============ INVOICES ============
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');

create table if not exists public.invoices (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    invoice_number text not null,
    customer_name text not null,
    customer_phone text,
    customer_address text,
    subtotal numeric(12,0) default 0,
    tax numeric(12,0) default 0,
    total numeric(12,0) not null,
    status invoice_status default 'draft',
    notes text,
    due_date timestamptz,
    created_at timestamptz default now()
);

alter table public.invoices enable row level security;

create policy "Users can manage invoices"
    on public.invoices for all
    using (
        exists (
            select 1 from public.businesses
            where id = business_id and owner_id = auth.uid()
        )
    );

-- ============ INVOICE ITEMS ============
create table if not exists public.invoice_items (
    id uuid default uuid_generate_v4() primary key,
    invoice_id uuid references public.invoices(id) on delete cascade not null,
    description text not null,
    quantity integer not null,
    price numeric(12,0) not null,
    total numeric(12,0) not null
);

alter table public.invoice_items enable row level security;

create policy "Users can manage invoice items"
    on public.invoice_items for all
    using (
        exists (
            select 1 from public.invoices i
            join public.businesses b on b.id = i.business_id
            where i.id = invoice_id and b.owner_id = auth.uid()
        )
    );

-- ============ DOCUMENTS ============
create type document_type as enum ('surat_penawaran', 'surat_perjanjian', 'invoice', 'kwitansi', 'surat_jalan');

create table if not exists public.documents (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    type document_type not null,
    title text not null,
    content jsonb,
    file_path text,
    created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can manage documents"
    on public.documents for all
    using (
        exists (
            select 1 from public.businesses
            where id = business_id and owner_id = auth.uid()
        )
    );

-- ============ CONVERSATIONS ============
create table if not exists public.conversations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    business_id uuid references public.businesses(id) on delete cascade not null,
    title text default 'Percakapan Baru',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.conversations enable row level security;

create policy "Users can manage conversations"
    on public.conversations for all
    using (auth.uid() = user_id);

-- ============ MESSAGES ============
create type message_role as enum ('user', 'assistant', 'system');

create table if not exists public.messages (
    id uuid default uuid_generate_v4() primary key,
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    role message_role not null,
    content text not null,
    created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can manage messages"
    on public.messages for all
    using (
        exists (
            select 1 from public.conversations
            where id = conversation_id and user_id = auth.uid()
        )
    );

-- ============ SUBSCRIPTIONS ============
create type plan_type as enum ('free', 'pro', 'business');

create table if not exists public.subscriptions (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references public.businesses(id) on delete cascade unique not null,
    plan plan_type default 'free',
    max_transactions integer default 50,
    max_products integer default 50,
    max_staff integer default 1,
    ai_enabled boolean default true,
    start_date timestamptz default now(),
    end_date timestamptz,
    is_active boolean default true
);

alter table public.subscriptions enable row level security;

create policy "Users can view subscriptions"
    on public.subscriptions for select
    using (
        exists (
            select 1 from public.businesses
            where id = business_id and owner_id = auth.uid()
        )
    );

-- ============ TEAM MEMBERS ============
create table if not exists public.team_members (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    role text default 'staff' check (role in ('manager', 'staff')),
    can_create_transaction boolean default true,
    can_manage_stock boolean default false,
    can_view_reports boolean default false,
    invited_at timestamptz default now()
);

alter table public.team_members enable row level security;

create policy "Users can manage team members"
    on public.team_members for all
    using (
        exists (
            select 1 from public.businesses
            where id = business_id and owner_id = auth.uid()
        )
    );

-- ============ INDEXES ============
create index idx_products_business on public.products(business_id);
create index idx_transactions_business on public.transactions(business_id);
create index idx_transactions_date on public.transactions(date);
create index idx_invoices_business on public.invoices(business_id);
create index idx_conversations_user on public.conversations(user_id);
create index idx_conversations_business on public.conversations(business_id);
create index idx_messages_conversation on public.messages(conversation_id);

-- ============ TRIGGER: auto-create user on signup ============
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, name, email)
    values (new.id, new.raw_user_meta_data->>'name', new.email);
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============ TRIGGER: update updated_at ============
create or replace function public.update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger users_updated_at
    before update on public.users
    for each row execute function public.update_updated_at();

create trigger conversations_updated_at
    before update on public.conversations
    for each row execute function public.update_updated_at();
