-- Skanini — temps réel sur les commandes (vue cuisine / caisse)
--
-- La cuisine doit voir arriver les commandes sans rafraîchir sa page. On
-- publie donc les changements de `orders` sur le canal Realtime. Le RLS
-- continue de s'appliquer : chaque gérant ne reçoit que les événements de
-- son propre établissement.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

alter publication supabase_realtime add table orders;
