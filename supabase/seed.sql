-- Catálogo inicial de servicios (sin datos de pacientes).
-- En remoto: ejecutar una vez desde el SQL Editor de Supabase.
insert into public.servicios (nombre, categoria, duracion_min) values
  ('Consulta ginecológica',          'Consulta',      30),
  ('Planificación familiar',         'Consulta',      30),
  ('Control prenatal',               'Obstetricia',   30),
  ('Ecografía obstétrica',           'Ecografía',     30),
  ('Ecografía genética',             'Ecografía',     45),
  ('Ecografía transvaginal',         'Ecografía',     30),
  ('Ecografía 7D',                   'Ecografía',     45),
  ('Papanicolaou (PAP)',             'Prevención',    20),
  ('Colposcopia',                    'Procedimiento', 30),
  ('Termoablación',                  'Procedimiento', 45),
  ('Procedimiento ginecológico',     'Procedimiento', 60),
  ('Láser CO2 ginecológico',         'Procedimiento', 45),
  ('Labioplastia',                   'Procedimiento', 120),
  ('Coordinación de cesárea',        'Obstetricia',   30)
on conflict (nombre) do nothing;
