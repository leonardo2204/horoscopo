-- Seed data migration for horoscope system reference tables

-- Insert zodiac signs
INSERT INTO signs (name_en, name_pt, emoji, start_date, end_date, element, modality, ruling_planet) VALUES
('Aries', 'Áries', '♈', '03-21', '04-19', 'fire', 'cardinal', 'Mars'),
('Taurus', 'Touro', '♉', '04-20', '05-20', 'earth', 'fixed', 'Venus'),
('Gemini', 'Gêmeos', '♊', '05-21', '06-20', 'air', 'mutable', 'Mercury'),
('Cancer', 'Câncer', '♋', '06-21', '07-22', 'water', 'cardinal', 'Moon'),
('Leo', 'Leão', '♌', '07-23', '08-22', 'fire', 'fixed', 'Sun'),
('Virgo', 'Virgem', '♍', '08-23', '09-22', 'earth', 'mutable', 'Mercury'),
('Libra', 'Libra', '♎', '09-23', '10-22', 'air', 'cardinal', 'Venus'),
('Scorpio', 'Escorpião', '♏', '10-23', '11-21', 'water', 'fixed', 'Mars'),
('Sagittarius', 'Sagitário', '♐', '11-22', '12-21', 'fire', 'mutable', 'Jupiter'),
('Capricorn', 'Capricórnio', '♑', '12-22', '01-19', 'earth', 'cardinal', 'Saturn'),
('Aquarius', 'Aquário', '♒', '01-20', '02-18', 'air', 'fixed', 'Uranus'),
('Pisces', 'Peixes', '♓', '02-19', '03-20', 'water', 'mutable', 'Neptune');

-- Insert horoscope types
INSERT INTO horoscope_types (type, display_name_pt, cache_duration_hours) VALUES
('daily', 'Diário', 2),
('weekly', 'Semanal', 168),
('monthly', 'Mensal', 720);

-- Insert horoscope categories
INSERT INTO horoscope_categories (name, display_name_pt, icon) VALUES
('love', 'Amor', '💕'),
('career', 'Carreira', '💼'),
('health', 'Saúde', '💚'),
('finance', 'Finanças', '💰'),
('general', 'Geral', '✨'),
('family', 'Família', '👨‍👩‍👧‍👦'),
('friendship', 'Amizade', '🤝'),
('creativity', 'Criatividade', '🎨');