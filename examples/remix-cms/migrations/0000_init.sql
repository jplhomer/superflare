-- Migration number: 0000 	 2023-01-29T13:42:11.033Z
drop table if exists users;
create table users (
  id integer primary key,
  name text,
  email text not null unique,
  password text not null,
  createdAt timestamp not null default current_timestamp,
  updatedAt timestamp not null default current_timestamp
);

drop table if exists articles;
create table articles (
  id integer primary key,
  title text not null,
  slug text not null unique,
  content text,
  userId integer not null references users(id),
  status text not null default 'draft',
  createdAt timestamp not null default current_timestamp,
  updatedAt timestamp not null default current_timestamp
);
