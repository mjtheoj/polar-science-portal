-- Demo seed for local SIH judging (run AFTER 002_repository.sql + 002b_storage.sql)
-- Paste into Supabase SQL Editor → Run. Safe to re-run (upserts by unique keys).
-- Clearly fictional — do not present as real NCPOR holdings.

-- Institutions
INSERT INTO public.institutions (name, short_name, country, website) VALUES
  ('National Centre for Polar and Ocean Research', 'NCPOR', 'India', 'https://ncpor.res.in'),
  ('Indian Institute of Tropical Meteorology', 'IITM', 'India', 'https://www.tropmet.res.in'),
  ('National Institute of Oceanography', 'NIO', 'India', 'https://www.nio.res.in')
ON CONFLICT (name) DO NOTHING;

-- Topics
INSERT INTO public.research_topics (name, slug, description) VALUES
  ('Sea Ice Dynamics', 'sea-ice-dynamics', 'Formation, drift, melt of polar sea ice'),
  ('Glaciology', 'glaciology', 'Ice sheets, glaciers, mass balance'),
  ('Oceanography', 'oceanography', 'Polar ocean circulation, salinity, currents'),
  ('Marine Biology', 'marine-biology', 'Polar ecosystems and biodiversity'),
  ('Atmospheric Science', 'atmospheric-science', 'Polar atmosphere, aerosols, climate'),
  ('Paleoclimate', 'paleoclimate', 'Ice cores and past climate'),
  ('Climate Change', 'climate-change', 'Anthropogenic change in polar regions')
ON CONFLICT (name) DO NOTHING;

-- Locations (representative, not exhaustive)
INSERT INTO public.locations (name, description, latitude, longitude, region) VALUES
  ('Maitri Station', 'Indian Antarctic station, Schirmacher Oasis', -70.765, 11.732, 'Antarctic'),
  ('Bharati Station', 'Indian Antarctic station, Larsemann Hills', -69.407, 76.186, 'Antarctic'),
  ('Himadri Station', 'Indian Arctic station, Ny-Ålesund', 78.922, 11.932, 'Arctic'),
  ('Southern Ocean — Prydz Bay', 'Coastal polynya region', -69.0, 76.0, 'Southern Ocean'),
  ('Schirmacher Oasis', 'Ice-free oasis near Maitri', -70.75, 11.65, 'Antarctic')
ON CONFLICT DO NOTHING;

-- Expeditions
INSERT INTO public.expeditions (code, name, description, region, year, start_date, end_date, station) VALUES
  ('43-ISEA', '43rd Indian Scientific Expedition to Antarctica', 'Summer team — sea-ice and geology', 'Antarctic', 2023, '2023-11-15', '2024-04-10', 'Maitri'),
  ('44-ISEA', '44th Indian Scientific Expedition to Antarctica', 'Winter-over, atmospheric and glaciology', 'Antarctic', 2024, '2024-11-10', '2025-03-30', 'Bharati'),
  ('46-ISEA', '46th Indian Scientific Expedition to Antarctica (demo)', 'Fictional future expedition for SIH demo — education outreach focus', 'Antarctic', 2026, '2026-11-01', '2027-03-31', 'Maitri'),
  ('IND-ARC-2023', 'Indian Arctic Expedition 2023', 'Himadri atmospheric observations', 'Arctic', 2023, '2023-07-01', '2023-08-15', 'Himadri')
ON CONFLICT (code) DO NOTHING;

-- Note: documents below use the first admin/researcher profile if exists, else they will fail FK.
-- So we create placeholder documents only if at least one profile exists.
DO $$
DECLARE
  author UUID;
  inst UUID;
  exp46 UUID; exp43 UUID; expArc UUID;
  locMaitri UUID; locBharati UUID;
  tSea UUID; tGlac UUID; tOcean UUID; tBio UUID; tAtm UUID;
BEGIN
  SELECT id INTO author FROM public.profiles LIMIT 1;
  IF author IS NULL THEN
    RAISE NOTICE 'No profiles yet — register a user first, then re-run seed for documents.';
    RETURN;
  END IF;
  SELECT id INTO inst FROM public.institutions WHERE short_name='NCPOR';
  SELECT id INTO exp46 FROM public.expeditions WHERE code='46-ISEA';
  SELECT id INTO exp43 FROM public.expeditions WHERE code='43-ISEA';
  SELECT id INTO expArc FROM public.expeditions WHERE code='IND-ARC-2023';
  SELECT id INTO locMaitri FROM public.locations WHERE name='Maitri Station';
  SELECT id INTO locBharati FROM public.locations WHERE name='Bharati Station';
  SELECT id INTO tSea FROM public.research_topics WHERE slug='sea-ice-dynamics';
  SELECT id INTO tGlac FROM public.research_topics WHERE slug='glaciology';
  SELECT id INTO tOcean FROM public.research_topics WHERE slug='oceanography';
  SELECT id INTO tBio FROM public.research_topics WHERE slug='marine-biology';
  SELECT id INTO tAtm FROM public.research_topics WHERE slug='atmospheric-science';

  -- Avoid duplicates by title unique check
  IF NOT EXISTS (SELECT 1 FROM public.documents WHERE title='46-ISEA Expedition Report 2026 — Sea-Ice Core Analysis (DEMO)') THEN
    INSERT INTO public.documents (title, description, content_type, author_id, institution_id, expedition_id, location_id, publication_date, keywords, visibility, approval_status, processing_status, metadata)
    VALUES
      ('46-ISEA Expedition Report 2026 — Sea-Ice Core Analysis (DEMO)', 'Fictional synthesis of sea-ice thickness transects near Maitri, with CTD casts and drone imagery. Demo data only.', 'expedition_report', author, inst, exp46, locMaitri, '2026-03-15', ARRAY['sea ice','Maitri','CTD','DEMO'], 'public', 'published', 'ready', '{"pages": 42, "doi": "10.0000/demo.46isea.2026", "demo": true}'::jsonb),
      ('Southern Ocean Salinity Anomalies 2023–2024 — Prydz Bay Mooring (DEMO)', 'Fictional dataset description for moored CTD at 500m, showing freshening events. Use as search/education seed.', 'dataset', author, inst, exp43, locMaitri, '2024-05-20', ARRAY['Southern Ocean','salinity','mooring','DEMO'], 'public', 'published', 'ready', '{"rows": 18250, "format": "CSV", "demo": true}'::jsonb),
      ('Glacial Mass Balance — Schirmacher Oasis 2023 (DEMO)', 'Fictional stake measurements and GPR profiles indicating surface lowering of 0.3 m w.e.', 'publication', author, inst, exp43, locMaitri, '2024-02-10', ARRAY['glaciology','mass balance','DEMO'], 'public', 'submitted', 'ready', '{"journal": "Polar Science (demo)", "demo": true}'::jsonb),
      ('Arctic Haze Optical Depth — Himadri 2023 (DEMO)', 'Fictional sun-photometer record from Ny-Ålesund showing spring haze peak.', 'dataset', author, inst, expArc, NULL, '2023-09-01', ARRAY['Arctic haze','aerosol','Himadri','DEMO'], 'internal', 'under_review', 'ready', '{"instrument": "sun photometer", "demo": true}'::jsonb),
      ('Emperor Penguin Colony Census — Larsemann Hills (DEMO)', 'Fictional UAV survey estimating 3,200 breeding pairs, with gallery media placeholders.', 'photograph', author, inst, exp43, locBharati, '2024-01-15', ARRAY['penguin','UAV','biodiversity','DEMO'], 'public', 'published', 'ready', '{"photographer": "Demo User", "license": "CC-BY-4.0", "demo": true}'::jsonb),
      ('Introduction to Polar Oceans — Student Primer (DEMO)', 'Fictional educational resource linking the 46-ISEA report to classroom activities.', 'educational_resource', author, inst, exp46, NULL, '2026-03-20', ARRAY['education','oceanography','primer','DEMO'], 'public', 'published', 'ready', '{"level": "School", "pages": 12, "demo": true}'::jsonb)
    ;
  END IF;

  -- Link topics
  INSERT INTO public.document_topics (document_id, topic_id)
  SELECT d.id, tSea FROM public.documents d CROSS JOIN (SELECT tSea AS t) s WHERE d.title LIKE '46-ISEA%' AND NOT EXISTS (SELECT 1 FROM public.document_topics WHERE document_id=d.id AND topic_id=tSea)
  UNION ALL SELECT d.id, tOcean FROM public.documents d CROSS JOIN (SELECT tOcean AS t) s WHERE d.title LIKE 'Southern Ocean%' AND NOT EXISTS (SELECT 1 FROM public.document_topics WHERE document_id=d.id AND topic_id=tOcean)
  ON CONFLICT DO NOTHING;
END $$;
