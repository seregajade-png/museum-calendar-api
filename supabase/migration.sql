-- Museum Calendar Widget - Database Schema
-- Run this against your PostgreSQL database

create extension if not exists "uuid-ossp";

-- Holidays
create table holidays (
  id uuid primary key default uuid_generate_v4(),
  date date not null unique,
  label text,
  created_at timestamptz default now()
);

-- Tariffs
create table tariffs (
  id uuid primary key default uuid_generate_v4(),
  day_type text not null check (day_type in ('weekday', 'weekend')),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price integer not null default 0,
  purchasable boolean not null default true,
  tilda_product_id text,
  info_text text,
  info_categories text[],
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_holidays_date on holidays(date);
create index idx_tariffs_day_type on tariffs(day_type);
create index idx_tariffs_sort_order on tariffs(sort_order);

-- Seed: holidays 2025-2026
insert into holidays (date, label) values
  ('2025-01-01', 'Новогодние каникулы'), ('2025-01-02', 'Новогодние каникулы'),
  ('2025-01-03', 'Новогодние каникулы'), ('2025-01-04', 'Новогодние каникулы'),
  ('2025-01-05', 'Новогодние каникулы'), ('2025-01-06', 'Новогодние каникулы'),
  ('2025-01-07', 'Рождество'),          ('2025-01-08', 'Новогодние каникулы'),
  ('2025-02-23', 'День защитника Отечества'), ('2025-02-24', 'Перенос'),
  ('2025-03-08', 'Международный женский день'), ('2025-03-10', 'Перенос'),
  ('2025-05-01', 'Праздник Весны и Труда'), ('2025-05-02', 'Перенос'),
  ('2025-05-08', 'Перенос'), ('2025-05-09', 'День Победы'),
  ('2025-06-12', 'День России'), ('2025-06-13', 'Перенос'),
  ('2025-11-03', 'Перенос'), ('2025-11-04', 'День народного единства'),
  ('2025-12-31', 'Перенос'),
  ('2026-01-01', 'Новогодние каникулы'), ('2026-01-02', 'Новогодние каникулы'),
  ('2026-01-03', 'Новогодние каникулы'), ('2026-01-04', 'Новогодние каникулы'),
  ('2026-01-05', 'Новогодние каникулы'), ('2026-01-06', 'Новогодние каникулы'),
  ('2026-01-07', 'Рождество'),          ('2026-01-08', 'Новогодние каникулы'),
  ('2026-02-23', 'День защитника Отечества'),
  ('2026-03-08', 'Международный женский день'), ('2026-03-09', 'Перенос'),
  ('2026-05-01', 'Праздник Весны и Труда'), ('2026-05-04', 'Перенос'),
  ('2026-05-09', 'День Победы'), ('2026-05-11', 'Перенос'),
  ('2026-06-12', 'День России'),
  ('2026-11-04', 'День народного единства'),
  ('2026-12-31', 'Перенос');

-- Seed: weekday tariffs
insert into tariffs (slug, day_type, name, description, price, purchasable, sort_order) values
  ('weekday-full', 'weekday', 'Полный билет', 'Основная экспозиция / Временная выставка', 400, true, 1);

insert into tariffs (slug, day_type, name, description, price, purchasable, info_text, info_categories, sort_order) values
  ('weekday-discount', 'weekday', 'Льготный билет', 'Основная экспозиция + Временная выставка', 0, false,
   'Льготный билет приобретается в кассе при предъявлении документа, подтверждающего льготу.',
   ARRAY['Дети от 4 до 6 лет и пенсионеры', 'Члены многодетных семей', 'Участники СВО и члены их семей (муж/жена, дети)', 'Инвалиды I и II групп и сопровождающее лицо'],
   2);

-- Seed: weekend tariffs
insert into tariffs (slug, day_type, name, description, price, purchasable, sort_order) values
  ('weekend-full', 'weekend', 'Полный билет', 'Основная экспозиция + Временная выставка + Аудиогид в подарок', 600, true, 1),
  ('weekend-school-quest', 'weekend', 'Школьный (7–16 лет)', 'Основная экспозиция + Временная выставка + Квест-бродилка', 350, true, 2),
  ('weekend-school-master', 'weekend', 'Школьный (7–16 лет)', 'Основная экспозиция + Временная выставка + Мастер-класс', 400, true, 3),
  ('weekend-kids', 'weekend', 'Детский (4–6 лет)', 'Основная экспозиция + Временная выставка + Детский центр', 250, true, 4);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tariffs_updated_at
  before update on tariffs
  for each row execute function update_updated_at_column();
