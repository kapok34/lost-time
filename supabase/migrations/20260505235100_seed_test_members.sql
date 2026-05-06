-- Seed 2 test members for gallery preview
-- Test account 1: member@losttime.test / password123
-- Test account 2: member2@losttime.test / password123

DO $$
DECLARE
  uid1 UUID := '11111111-1111-1111-1111-111111111111';
  uid2 UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Insert auth users (bcrypt hash for "password123")
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (uid1, 'member@losttime.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (uid2, 'member2@losttime.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert approved profiles with member numbers
  INSERT INTO public.profiles (id, display_name, language, location, status, member_number, questionnaire_language, created_at, updated_at)
  VALUES
    (uid1, 'Member One', 'en', 'Paris, France', 'approved', 1, 'en', now(), now()),
    (uid2, 'Member Two', 'fr', 'Kyoto, Japan', 'approved', 2, 'fr', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert sample answers for member 1 (English)
  INSERT INTO public.questionnaire_answers (user_id, question_id, answer)
  VALUES
    (uid1, 1, 'Honesty'),
    (uid1, 2, 'Kindness and curiosity'),
    (uid1, 3, 'Persistence'),
    (uid1, 4, 'Their loyalty'),
    (uid1, 5, 'Impatience'),
    (uid1, 6, 'Reading by the window'),
    (uid1, 7, 'A quiet morning with coffee'),
    (uid1, 8, 'Loud crowds'),
    (uid1, 9, 'A gardener in Provence'),
    (uid1, 10, 'A small village by the sea'),
    (uid1, 11, 'Deep blue'),
    (uid1, 12, 'Autumn'),
    (uid1, 13, 'Early morning'),
    (uid1, 14, 'The owl'),
    (uid1, 15, 'Proust, Woolf, Borges'),
    (uid1, 16, 'Kurosawa, Ozu'),
    (uid1, 17, 'Atticus Finch'),
    (uid1, 18, 'Vermeer, Morandi'),
    (uid1, 19, 'Bach, Satie'),
    (uid1, 20, 'Miles Davis'),
    (uid1, 21, 'My grandmother'),
    (uid1, 22, 'Rosa Parks'),
    (uid1, 23, 'Dark chocolate'),
    (uid1, 24, 'Fresh bread and red wine'),
    (uid1, 25, 'Sylvia, Julian'),
    (uid1, 26, 'Rudeness'),
    (uid1, 27, 'Tyrants'),
    (uid1, 28, 'The moon landing'),
    (uid1, 29, 'Universal education'),
    (uid1, 30, 'Perfect pitch'),
    (uid1, 31, 'Quietly, among friends'),
    (uid1, 32, 'Hopeful'),
    (uid1, 33, 'Selfishness'),
    (uid1, 34, 'Stay curious')
  ON CONFLICT DO NOTHING;

  -- Insert sample answers for member 2 (French)
  INSERT INTO public.questionnaire_answers (user_id, question_id, answer)
  VALUES
    (uid2, 1, 'La gentillesse'),
    (uid2, 2, 'L\'empathie et l\'humour'),
    (uid2, 3, 'La rêverie'),
    (uid2, 4, 'Leur écoute'),
    (uid2, 5, 'La procrastination'),
    (uid2, 6, 'La marche en forêt'),
    (uid2, 7, 'Un repas partagé'),
    (uid2, 8, 'Le bruit constant'),
    (uid2, 9, 'Un libraire à Lisbonne'),
    (uid2, 10, 'Une maison avec un jardin'),
    (uid2, 11, 'Le vert mousse'),
    (uid2, 12, 'Le printemps'),
    (uid2, 13, 'Le crépuscule'),
    (uid2, 14, 'Le rossignol'),
    (uid2, 15, 'Camus, Duras'),
    (uid2, 16, 'Truffaut, Varda'),
    (uid2, 17, 'Elizabeth Bennet'),
    (uid2, 18, 'Cézanne, Bonnard'),
    (uid2, 19, 'Debussy, Fauré'),
    (uid2, 20, 'Billie Holiday'),
    (uid2, 21, 'Mon professeur de piano'),
    (uid2, 22, 'Marie Curie'),
    (uid2, 23, 'Les madeleines'),
    (uid2, 24, 'Le thé vert et les mochis'),
    (uid2, 25, 'Haru, Sora'),
    (uid2, 26, 'L\'indifférence'),
    (uid2, 27, 'Les dictateurs'),
    (uid2, 28, 'La liberation de Paris'),
    (uid2, 29, 'La semaine de quatre jours'),
    (uid2, 30, 'La mémoire photographique'),
    (uid2, 31, 'En paix, près de la mer'),
    (uid2, 32, 'Sereine'),
    (uid2, 33, 'L\'arrogance'),
    (uid2, 34, 'Prends ton temps')
  ON CONFLICT DO NOTHING;
END $$;
