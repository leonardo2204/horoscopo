-- Translation migration for horoscope_categories names to Portuguese

UPDATE horoscope_categories SET name = 'amor' WHERE name = 'love';
UPDATE horoscope_categories SET name = 'carreira' WHERE name = 'career';
UPDATE horoscope_categories SET name = 'saude' WHERE name = 'health';
UPDATE horoscope_categories SET name = 'financas' WHERE name = 'finance';
UPDATE horoscope_categories SET name = 'geral' WHERE name = 'general';
UPDATE horoscope_categories SET name = 'familia' WHERE name = 'family';
UPDATE horoscope_categories SET name = 'amizade' WHERE name = 'friendship';
UPDATE horoscope_categories SET name = 'criatividade' WHERE name = 'creativity';