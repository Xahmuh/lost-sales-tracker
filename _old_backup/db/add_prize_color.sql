-- Add color column to spin_prizes if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'spin_prizes' and column_name = 'color') then
    alter table spin_prizes add column color text default null;
  end if;
end $$;
