-- Seed data for PawPal
-- Run this in Supabase SQL Editor after schema.sql

-- Insert personality tags (avoid duplicates)
INSERT INTO public.personality_tags (tag_name, description) VALUES
  -- Temperament
  ('Friendly', 'Sociable and approachable with people'),
  ('Cautious', 'Takes time to warm up to new people'),
  ('Affectionate', 'Loves cuddles and physical contact'),
  ('Shy', 'Timid and reserved around strangers'),
  ('Protective', 'Guards territory and loved ones'),
  ('Independent', 'Self-reliant and doesn''t need constant attention'),
  ('Intelligent', 'Quick learner and problem solver'),
  ('Clingy', 'Wants to be close to humans all the time'),
  
  -- Energy Level
  ('Low', 'Prefers lounging and gentle walks'),
  ('Medium', 'Enjoys moderate exercise and play'),
  ('High', 'Needs lots of exercise and mental stimulation'),
  
  -- Playfulness
  ('Playful', 'Loves games and interactive play'),
  ('Calm', 'Peaceful and serene disposition'),
  ('Toy-Focused', 'Enjoys playing with toys and objects'),
  ('Enjoys Fetch', 'Loves retrieving balls and sticks'),
  ('Loves Water', 'Enjoys swimming and water play'),
  
  -- Sociability
  ('Good with Kids', 'Patient and gentle with children'),
  ('Good with Dogs', 'Gets along well with other dogs'),
  ('Good with Cats', 'Peaceful coexistence with cats'),
  ('Needs Experienced Handler', 'Requires someone with dog experience'),
  
  -- Special Needs
  ('Senior', 'Older dog needing gentle care'),
  ('Disabled', 'Has physical limitations but full of love'),
  ('Medical Care Needed', 'Requires ongoing medical attention')
ON CONFLICT (tag_name) DO NOTHING;

-- Get tag IDs for use in dog records
DO $$
DECLARE
  tag_friendly INT;
  tag_cautious INT;
  tag_affectionate INT;
  tag_shy INT;
  tag_protective INT;
  tag_independent INT;
  tag_intelligent INT;
  tag_clingy INT;
  tag_low INT;
  tag_medium INT;
  tag_high INT;
  tag_playful INT;
  tag_calm INT;
  tag_toy_focused INT;
  tag_enjoys_fetch INT;
  tag_loves_water INT;
  tag_good_kids INT;
  tag_good_dogs INT;
  tag_good_cats INT;
  tag_experienced INT;
  tag_senior INT;
  tag_disabled INT;
  tag_medical INT;
BEGIN
  -- Get tag IDs
  SELECT id INTO tag_friendly FROM personality_tags WHERE tag_name = 'Friendly';
  SELECT id INTO tag_cautious FROM personality_tags WHERE tag_name = 'Cautious';
  SELECT id INTO tag_affectionate FROM personality_tags WHERE tag_name = 'Affectionate';
  SELECT id INTO tag_shy FROM personality_tags WHERE tag_name = 'Shy';
  SELECT id INTO tag_protective FROM personality_tags WHERE tag_name = 'Protective';
  SELECT id INTO tag_independent FROM personality_tags WHERE tag_name = 'Independent';
  SELECT id INTO tag_intelligent FROM personality_tags WHERE tag_name = 'Intelligent';
  SELECT id INTO tag_clingy FROM personality_tags WHERE tag_name = 'Clingy';
  SELECT id INTO tag_low FROM personality_tags WHERE tag_name = 'Low';
  SELECT id INTO tag_medium FROM personality_tags WHERE tag_name = 'Medium';
  SELECT id INTO tag_high FROM personality_tags WHERE tag_name = 'High';
  SELECT id INTO tag_playful FROM personality_tags WHERE tag_name = 'Playful';
  SELECT id INTO tag_calm FROM personality_tags WHERE tag_name = 'Calm';
  SELECT id INTO tag_toy_focused FROM personality_tags WHERE tag_name = 'Toy-Focused';
  SELECT id INTO tag_enjoys_fetch FROM personality_tags WHERE tag_name = 'Enjoys Fetch';
  SELECT id INTO tag_loves_water FROM personality_tags WHERE tag_name = 'Loves Water';
  SELECT id INTO tag_good_kids FROM personality_tags WHERE tag_name = 'Good with Kids';
  SELECT id INTO tag_good_dogs FROM personality_tags WHERE tag_name = 'Good with Dogs';
  SELECT id INTO tag_good_cats FROM personality_tags WHERE tag_name = 'Good with Cats';
  SELECT id INTO tag_experienced FROM personality_tags WHERE tag_name = 'Needs Experienced Handler';
  SELECT id INTO tag_senior FROM personality_tags WHERE tag_name = 'Senior';
  SELECT id INTO tag_disabled FROM personality_tags WHERE tag_name = 'Disabled';
  SELECT id INTO tag_medical FROM personality_tags WHERE tag_name = 'Medical Care Needed';

  -- Insert sample dogs across Delhi/NCR
  INSERT INTO public.dogs (
    name, age_years, gender, description, area, location_lat, location_lng,
    health_sterilised, health_vaccinated, health_dewormed,
    compatibility_kids, compatibility_dogs, compatibility_cats,
    energy_level, temperament, playfulness, special_needs,
    personality_tag_ids, images, status
  ) VALUES
  
  -- South Delhi Dogs
  ('Charlie', 3.5, 'male', 'A gentle golden retriever mix who loves children and long walks in the park.', 'Saket', 28.5244, 77.2066, true, true, true, true, true, false, 'Medium', 'Friendly', 'Playful', null, ARRAY[tag_friendly, tag_good_kids, tag_medium, tag_playful], ARRAY['https://picsum.photos/seed/pawpal1/640/480', 'https://picsum.photos/seed/pawpal1b/640/480'], 'available'),
  
  ('Bella', 2.0, 'female', 'Sweet and cautious street dog who is slowly learning to trust humans.', 'Hauz Khas', 28.5494, 77.1960, false, true, false, false, true, true, 'Low', 'Cautious', 'Calm', null, ARRAY[tag_cautious, tag_calm, tag_low, tag_good_cats], ARRAY['https://picsum.photos/seed/pawpal2/640/480'], 'available'),
  
  ('Max', 4.0, 'male', 'Intelligent and protective dog who needs an experienced handler.', 'Malviya Nagar', 28.5355, 77.2056, true, false, true, false, false, false, 'High', 'Protective', 'Toy-Focused', null, ARRAY[tag_protective, tag_intelligent, tag_high, tag_experienced], ARRAY['https://picsum.photos/seed/pawpal3/640/480', 'https://picsum.photos/seed/pawpal3b/640/480'], 'pending'),
  
  -- North Delhi Dogs
  ('Luna', 1.5, 'female', 'Playful puppy who loves fetch and gets along with everyone.', 'Rohini', 28.7041, 77.1025, false, true, true, true, true, true, 'High', 'Playful', 'Enjoys Fetch', null, ARRAY[tag_playful, tag_enjoys_fetch, tag_high, tag_good_kids, tag_good_dogs], ARRAY['https://picsum.photos/seed/pawpal4/640/480'], 'available'),
  
  ('Rocky', 5.0, 'male', 'Senior dog with a calm temperament, perfect for a quiet home.', 'Pitampura', 28.6972, 77.1350, true, true, true, true, false, true, 'Low', 'Calm', 'Calm', null, ARRAY[tag_senior, tag_calm, tag_low, tag_good_kids], ARRAY['https://picsum.photos/seed/pawpal5/640/480'], 'available'),
  
  ('Moti', 3.0, 'male', 'Affectionate indie dog who loves water and swimming.', 'Model Town', 28.7206, 77.1839, false, false, false, true, true, false, 'Medium', 'Affectionate', 'Loves Water', null, ARRAY[tag_affectionate, tag_loves_water, tag_medium, tag_good_dogs], ARRAY['https://picsum.photos/seed/pawpal6/640/480', 'https://picsum.photos/seed/pawpal6b/640/480'], 'available'),
  
  -- West Delhi Dogs
  ('Sheru', 2.5, 'male', 'Independent street dog who is slowly warming up to humans.', 'Dwarka', 28.5921, 77.0460, false, true, false, false, true, false, 'Medium', 'Independent', 'Calm', null, ARRAY[tag_independent, tag_calm, tag_medium], ARRAY['https://picsum.photos/seed/pawpal7/640/480'], 'available'),
  
  ('Priya', 4.5, 'female', 'Clingy and affectionate dog who needs lots of attention.', 'Karol Bagh', 28.6519, 77.1909, true, true, true, true, false, true, 'Low', 'Clingy', 'Calm', null, ARRAY[tag_clingy, tag_affectionate, tag_low, tag_good_kids], ARRAY['https://picsum.photos/seed/pawpal8/640/480'], 'pending'),
  
  -- Central Delhi Dogs
  ('Bruno', 3.0, 'male', 'Intelligent and toy-focused dog who loves puzzle games.', 'Lajpat Nagar', 28.5652, 77.2430, false, true, true, false, true, false, 'Medium', 'Intelligent', 'Toy-Focused', null, ARRAY[tag_intelligent, tag_toy_focused, tag_medium, tag_good_dogs], ARRAY['https://picsum.photos/seed/pawpal9/640/480', 'https://picsum.photos/seed/pawpal9b/640/480'], 'available'),
  
  ('Kali', 6.0, 'female', 'Senior dog with some mobility issues but lots of love to give.', 'Connaught Place', 28.6315, 77.2167, true, true, true, true, false, true, 'Low', 'Affectionate', 'Calm', 'Senior with mild arthritis', ARRAY[tag_senior, tag_disabled, tag_affectionate, tag_calm], ARRAY['https://picsum.photos/seed/pawpal10/640/480'], 'available'),
  
  -- East Delhi Dogs
  ('Tiger', 2.0, 'male', 'Shy but friendly once he gets to know you.', 'Mayur Vihar', 28.6127, 77.2773, false, false, true, true, true, true, 'Medium', 'Shy', 'Playful', null, ARRAY[tag_shy, tag_friendly, tag_medium, tag_playful, tag_good_kids], ARRAY['https://picsum.photos/seed/pawpal11/640/480'], 'available'),
  
  ('Golu', 1.0, 'male', 'Young pup who needs medical care for a minor skin condition.', 'Laxmi Nagar', 28.6353, 77.2772, false, true, false, true, true, false, 'High', 'Playful', 'Playful', 'Needs treatment for skin condition', ARRAY[tag_medical, tag_playful, tag_high, tag_good_kids], ARRAY['https://picsum.photos/seed/pawpal12/640/480'], 'available'),
  
  -- Noida Dogs
  ('Simba', 4.0, 'male', 'Protective and intelligent, great as a guard dog.', 'Noida Sector 62', 28.6271, 77.3747, true, true, true, false, false, false, 'High', 'Protective', 'Calm', null, ARRAY[tag_protective, tag_intelligent, tag_high, tag_experienced], ARRAY['https://picsum.photos/seed/pawpal13/640/480', 'https://picsum.photos/seed/pawpal13b/640/480'], 'available'),
  
  ('Coco', 2.5, 'female', 'Affectionate and good with all animals and kids.', 'Noida Sector 18', 28.5706, 77.3272, false, true, true, true, true, true, 'Medium', 'Affectionate', 'Playful', null, ARRAY[tag_affectionate, tag_good_kids, tag_good_dogs, tag_good_cats, tag_playful], ARRAY['https://picsum.photos/seed/pawpal14/640/480'], 'pending'),
  
  -- Gurugram Dogs
  ('Oscar', 3.5, 'male', 'High energy dog who loves fetch and needs lots of exercise.', 'Gurugram DLF Phase 3', 28.4647, 77.0937, false, false, false, false, true, false, 'High', 'Energetic', 'Enjoys Fetch', null, ARRAY[tag_high, tag_enjoys_fetch, tag_playful, tag_good_dogs], ARRAY['https://picsum.photos/seed/pawpal15/640/480'], 'available'),
  
  ('Daisy', 5.5, 'female', 'Calm senior who just wants a peaceful retirement home.', 'Gurugram Sushant Lok', 28.4601, 77.0637, true, true, true, true, false, true, 'Low', 'Calm', 'Calm', null, ARRAY[tag_senior, tag_calm, tag_low, tag_good_kids], ARRAY['https://picsum.photos/seed/pawpal16/640/480'], 'available'),
  
  -- Ghaziabad Dogs
  ('Buddy', 2.0, 'male', 'Friendly and intelligent pup who loves learning new tricks.', 'Ghaziabad Indirapuram', 28.6410, 77.3592, false, true, false, true, true, false, 'Medium', 'Friendly', 'Playful', null, ARRAY[tag_friendly, tag_intelligent, tag_medium, tag_playful, tag_good_kids], ARRAY['https://picsum.photos/seed/pawpal17/640/480', 'https://picsum.photos/seed/pawpal17b/640/480'], 'available'),
  
  ('Rani', 4.0, 'female', 'Independent but affectionate once she trusts you.', 'Ghaziabad Vaishali', 28.6507, 77.3371, true, false, true, false, false, true, 'Low', 'Independent', 'Calm', null, ARRAY[tag_independent, tag_affectionate, tag_low, tag_calm], ARRAY['https://picsum.photos/seed/pawpal18/640/480'], 'available'),
  
  -- Faridabad Dogs
  ('Leo', 1.5, 'male', 'Young and playful with a love for water activities.', 'Faridabad Sector 15', 28.4089, 77.3178, false, true, true, true, true, false, 'High', 'Playful', 'Loves Water', null, ARRAY[tag_playful, tag_loves_water, tag_high, tag_good_kids, tag_good_dogs], ARRAY['https://picsum.photos/seed/pawpal19/640/480'], 'available'),
  
  ('Maya', 3.0, 'female', 'Cautious but warming up, needs patient and experienced handler.', 'Faridabad NIT', 28.3959, 77.3210, false, false, false, false, true, false, 'Medium', 'Cautious', 'Calm', null, ARRAY[tag_cautious, tag_calm, tag_medium, tag_experienced], ARRAY['https://picsum.photos/seed/pawpal20/640/480'], 'pending')

  ON CONFLICT DO NOTHING;

END $$;

-- Insert sample dogs across Delhi/NCR
-- Note: These are fictional dogs for testing purposes

INSERT INTO public.dogs (
    name, age_years, gender, description, area, location_lat, location_lng,
    health_sterilised, health_vaccinated, health_dewormed,
    compatibility_kids, compatibility_dogs, compatibility_cats,
    energy_level, temperament, playfulness, special_needs,
    personality_tag_ids, status
) VALUES
-- Saket area
('Buddy', 2.5, 'male', 'A golden-brown street dog who loves children and has been the neighborhood favorite for 2 years. Very gentle and house-trained.', 'Saket', 28.5245, 77.2066, true, true, true, true, true, false, 'medium', 'friendly', 'playful', null, ARRAY[1,6,17,18], 'available'),

('Luna', 1.8, 'female', 'Beautiful black and white female, very intelligent and learns quickly. Currently being fed by local residents.', 'Saket', 28.5251, 77.2071, true, true, false, true, false, true, 'high', 'intelligent', 'playful', null, ARRAY[1,7,13,17], 'available'),

-- Rohini area
('Rocky', 4.0, 'male', 'Large protective male, excellent guard dog but gentle with family. Needs experienced handler.', 'Rohini Sector 3', 28.7041, 77.1025, false, true, true, false, true, false, 'medium', 'protective', 'calm', null, ARRAY[5,20,14], 'available'),

('Shera', 3.2, 'male', 'Independent spirit who comes around for food but maintains his dignity. Good with other dogs.', 'Rohini Sector 7', 28.7196, 77.1092, true, false, true, true, true, false, 'low', 'independent', 'calm', null, ARRAY[6,9,18], 'pending'),

-- Dwarka area
('Moti', 2.0, 'female', 'Plump and affectionate, loves belly rubs and treats. Very social with humans and dogs.', 'Dwarka Sector 12', 28.5921, 77.0460, true, true, true, true, true, false, 'low', 'affectionate', 'calm', null, ARRAY[3,9,17,18], 'available'),

('Simba', 1.5, 'male', 'Young energetic pup who loves to play fetch. Great with kids and very trainable.', 'Dwarka Sector 8', 28.5704, 77.0724, false, true, false, true, true, true, 'high', 'playful', 'toy-focused', null, ARRAY[1,11,15,16,17], 'available'),

-- Noida area
('Princess', 5.0, 'female', 'Senior lady with grace and wisdom. Perfect for someone wanting a calm companion.', 'Noida Sector 62', 28.6271, 77.3647, true, true, true, true, false, true, 'low', 'calm', 'calm', 'senior care needed', ARRAY[2,9,14,21], 'available'),

('Tiger', 3.5, 'male', 'Brave and loyal, has been protecting the local market for years. Needs someone who understands his protective nature.', 'Noida Sector 18', 28.5706, 77.3272, true, true, true, false, false, false, 'medium', 'protective', 'calm', null, ARRAY[5,20], 'available'),

-- Gurgaon area
('Angel', 2.8, 'female', 'Sweet and gentle soul, loves water and enjoys baths. Very affectionate with humans.', 'DLF Phase 1', 28.4743, 77.1025, true, true, true, true, true, true, 'medium', 'affectionate', 'loves water', null, ARRAY[3,10,17,18,19], 'available'),

('Bruno', 4.5, 'male', 'Large friendly giant who thinks he''s a lapdog. Great with children despite his size.', 'Sohna Road', 28.3670, 77.0558, false, false, true, true, true, false, 'medium', 'friendly', 'playful', null, ARRAY[1,13,17], 'available'),

-- Ghaziabad area
('Coco', 1.2, 'female', 'Young shy pup who needs patience and love. Once she trusts you, she''s the most loyal companion.', 'Indirapuram', 28.6412, 77.3421, false, true, false, true, false, true, 'medium', 'shy', 'cautious', null, ARRAY[4,2,10], 'available'),

('Max', 3.8, 'male', 'High energy dog who loves long walks and outdoor adventures. Perfect for an active family.', 'Vaishali', 28.6490, 77.3226, true, true, true, true, true, false, 'high', 'energetic', 'playful', null, ARRAY[11,13,16], 'available'),

-- More diverse examples
('Kali', 6.0, 'female', 'Wise senior dog with three legs but unlimited spirit. Looking for a quiet home to spend her golden years.', 'Lajpat Nagar', 28.5677, 77.2366, true, true, true, true, false, true, 'low', 'gentle', 'calm', 'disabled, needs special care', ARRAY[21,22,9,14], 'available'),

('Chocolate', 2.2, 'male', 'Brown beauty who''s great with cats and small animals. Very gentle and patient.', 'Karol Bagh', 28.6507, 77.1907, true, true, false, true, true, true, 'medium', 'gentle', 'calm', null, ARRAY[1,17,18,19], 'available'),

('Storm', 1.0, 'male', 'Young energetic pup who needs lots of attention and training. Will make a great companion with proper care.', 'Janakpuri', 28.6219, 77.0856, false, false, true, true, true, false, 'high', 'energetic', 'very playful', 'needs training', ARRAY[11,13,20], 'available'),

('Honey', 4.2, 'female', 'Golden-colored beauty who''s been a mother to many pups. Now it''s her turn to be pampered.', 'Pitampura', 28.6942, 77.1314, true, true, true, true, false, false, 'low', 'maternal', 'calm', null, ARRAY[3,9,17], 'available'),

('Shadow', 3.0, 'male', 'Black dog who follows his favorite human everywhere. Extremely loyal and protective.', 'Mayur Vihar', 28.6089, 77.2951, true, false, true, false, false, false, 'medium', 'clingy', 'protective', null, ARRAY[8,5,20], 'adopted'),

('Bella', 2.7, 'female', 'Beautiful and intelligent, knows basic commands and house rules. Looking for a family to call her own.', 'Vasant Kunj', 28.5244, 77.1596, true, true, true, true, true, true, 'medium', 'intelligent', 'eager to learn', null, ARRAY[7,1,17,18,19], 'pending'),

('Rusty', 5.5, 'male', 'Old soul who prefers quiet companionship over active play. Perfect for seniors or quiet households.', 'Laxmi Nagar', 28.6345, 77.2767, true, true, true, true, false, true, 'low', 'calm', 'prefers quiet time', 'senior', ARRAY[9,14,21], 'available'),

('Snowball', 1.8, 'female', 'White fluffy street dog who loves being groomed and pampered. Very affectionate and social.', 'Connaught Place', 28.6315, 77.2167, false, true, false, true, true, false, 'medium', 'social', 'loves grooming', null, ARRAY[3,1,17], 'available');
