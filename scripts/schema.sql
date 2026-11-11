create table if not exists settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'אוכל ישראלי בפראג',
  is_open boolean not null default true,
  closed_message text not null default 'ההזמנות סגורות כרגע. נחזור בקרוב!',
  admin_whatsapp text not null default '',
  pickup_address text not null default '',
  open_hour int not null default 8,
  close_hour int not null default 20,
  lead_minutes int not null default 120,
  edit_window_hours int not null default 12
);
insert into settings (id) values (1) on conflict do nothing;
-- Weekdays on which food can be collected or delivered (0 = Sunday ... 6 = Saturday).
alter table settings add column if not exists pickup_days int[] not null default '{0,1,2,3,4,5,6}';

create table if not exists dishes (
  id serial primary key,
  name text not null,
  description text not null default '',
  price int not null check (price >= 0),
  image bytea,
  visible boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists orders (
  id serial primary key,
  token text not null unique,
  name text not null,
  phone text not null,
  note text not null default '',
  method text not null check (method in ('pickup', 'delivery')),
  address text not null default '',
  scheduled_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'done', 'cancelled')),
  delivery_fee int check (delivery_fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select setval('orders_id_seq', 1000, true) where not exists (select 1 from orders);

create table if not exists order_items (
  id serial primary key,
  order_id int not null references orders (id) on delete cascade,
  dish_id int not null references dishes (id),
  dish_name text not null,
  unit_price int not null,
  qty int not null check (qty > 0)
);
create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists orders_scheduled_idx on orders (scheduled_at);
