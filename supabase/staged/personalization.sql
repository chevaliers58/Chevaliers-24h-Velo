-- Personalization seed, safe to replay: never delete members or existing outings.
insert into public.patrols(name,category)
values ('Pumas','homme'),('Guépards','homme'),('Ocelots','homme'),('Jaguars','homme'),
       ('Autres membres de l''unité','homme')
on conflict (name) do nothing;

-- Integer thresholds round upward for the marathon and Channel Tunnel.
-- Keep inherited stages unless known to be troupe-specific, and improve the descriptions.
insert into public.expedition_waypoints
(id,name,subtitle,target_km,description,badge_name,badge_emoji,x,y)
values
('marathon','Un marathon','42,195 km, arrondis au prochain km',43,
 'En additionnant les sorties, la troupe couvre la distance d''un marathon.','Marathonien','🏃',0,0),
('tunnel-manche','Sous la Manche','Environ 50,5 km',51,
 'Le tunnel sous la Manche relie la France au Royaume-Uni.','Tunnelier','🚇',0,0),
('bruxelles-paris','Bruxelles–Paris','Environ 264 km à vol d''oiseau',264,
 'À vol d''oiseau, de la Grand-Place à la tour Eiffel !','Parisien','🗼',0,0),
('iss','Station spatiale internationale','Environ 400 km d''altitude',400,
 'La distance cumulée correspond à l''altitude habituelle de la Station spatiale internationale.','Astronaute','🛰️',0,0),
('tour-lune','Tour de la Lune','Environ 10 917 km à l''équateur lunaire',10917,
 'Un tour complet de notre satellite, sans quitter la Terre.','Lunaire','🌕',0,0),
('terre-lune','De la Terre à la Lune','Distance moyenne : 384 400 km',384400,
 'Le défi intersidéral : la distance moyenne qui nous sépare de la Lune.','Chevalier de l''espace','🚀',0,0)
on conflict (id) do nothing;
update public.expedition_waypoints set description='3 333 km : le tracé initialement prévu pour le Tour de France 2026. À combien de sorties la troupe atteindra-t-elle cette distance ?'
where id='tour-de-france' and description like '3 333 km : la distance totale du Tour de France 2026%';
update public.expedition_waypoints set description='Le centre scout international de Kandersteg accueille des scouts du monde entier depuis 1923. Notre palier symbolique est fixé à 700 km.'
where id='kandersteg' and description like '%Moustier%';
alter table public.timeline_distance_milestone_overrides
  drop constraint if exists timeline_distance_milestone_overrides_milestone_km_check;
alter table public.timeline_distance_milestone_overrides
  add constraint timeline_distance_milestone_overrides_milestone_km_check check (milestone_km > 0);
