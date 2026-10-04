-- Product photo corrections checked 4 October 2026. No price or stock edits.
-- Sources and exact variants: api/data/catalog-evidence.js
BEGIN;
UPDATE public.products AS p
SET image_url = v.new_image
FROM (VALUES
  ('jp-eb04-bb', '/EB-04-bb-750x750.webp', 'https://www.japan2uk.com/cdn/shop/files/One_Piece_Egghead_Crisis_EB-04_Japanese_Booster_Box._700x700.png?v=1770216071', 'EB-04 EGGHEAD CRISIS Booster Box Japanese ONE PIECE CARD', 'EB-04', 'Booster Box'),
  ('jp-m1l-bb', '/M1L-bb-750x750.webp', 'https://www.japan2uk.com/cdn/shop/files/Pokemon_Mega_Brave_m1L_Japanese_Booster_Box_700x700.png?v=1789482776', 'M1L Mega Brave booster box Japanese Pokemon Card', 'M1L Mega Brave', 'Booster Box'),
  ('jp-m1s-bb', '/M1S-bb-750x750.webp', 'https://www.japan2uk.com/cdn/shop/files/Pokemon_Mega_Symphonia_m1S_Japanese_Booster_Box.._700x700.png?v=1789483042', 'M1S Mega Symphonia booster box Japanese Pokemon Card', 'M1S Mega Symphonia', 'Booster Box'),
  ('jp-m2-bb', '/M2-bb-750x750.webp', 'https://www.japan2uk.com/cdn/shop/files/Pokemon_Inferno_X_m2_Japanese_Booster_Box..._700x700.png?v=1768309365', 'M2 Inferno X booster box Japanese Pokemon Card', 'M2 Inferno X', 'Booster Box'),
  ('jp-m2a-bb', '/M2a-bb-750x750.webp', 'https://www.japan2uk.com/cdn/shop/files/Pokemon_Mega_Dream_ex_High_Class_m2a_Japanese_Booster_Box_700x700.png?v=1778140921', 'M2a MEGA Dream ex booster box Japanese Pokemon Card', 'M2a MEGA Dream ex', 'Booster Box'),
  ('jp-m3-bb', '/M3-bb-1024x1024.webp', 'https://www.japan2uk.com/cdn/shop/files/Pokemon_Nihil_Zero_m3_Japanese_Booster_Box._700x700.png?v=1772463775', 'M3 Munikis Zero (Nihil Zero) booster box Japanese Pokemon Card', 'M3 Munikis Zero', 'Booster Box'),
  ('jp-m4-bb', '/M4-bb-750x750.webp', 'https://www.japan2uk.com/cdn/shop/files/Pokemon_Ninja_Spinner_m4_Japanese_Booster_Box._700x700.png?v=1773678988', 'M4 Ninja Spinner booster box Japanese Pokemon Card', 'M4 Ninja Spinner', 'Booster Box'),
  ('jp-op15-bb', '/OP-15-bb-750x750.webp.webp', 'https://www.japan2uk.com/cdn/shop/files/One_Piece_Adventure_on_KAMI_s_Island_OP-15_Japanese_Booster_Box._700x700.png?v=1772789014', 'OP-15 Adventure on KAMI’s Island booster box Japanese ONE PIECE CARD', 'OP-15', 'Booster Box'),
  ('pk-151-bb', 'https://tcg.pokemon.com/assets/img/cards-sv/en-us/SV3_EN_1_151.jpg', 'https://www.japan2uk.com/cdn/shop/files/Pokemon_151_sv2a_Japanese_Booster_Box.._700x700.png?v=1769533711', 'Pokemon Card 151 Booster Box Japanese', 'SV2a', 'Booster Box'),
  ('tcg-2000277120', 'https://tcgrepublic.com/media/binary/000/282/919/282919.png.l2_thumbnail.jpg', 'https://tcgrepublic.com/media/binary/000/282/919/282919.png.thumbnail.jpg', 'Counterspell Foil JPN Alternate Art', 'Magic: The Gathering', 'Magic: The Gathering'),
  ('tcg-2000286991', 'https://tcgrepublic.com/media/binary/000/282/919/282919.png.l2_thumbnail.jpg', 'https://tcgrepublic.com/media/binary/000/293/108/293108.png.thumbnail.jpg', 'Ragavan, Nimble Pilferer Foil', 'Magic: The Gathering', 'Magic: The Gathering')
) AS v(id, old_image, new_image, expected_name, expected_set, expected_type)
WHERE p.id = v.id AND p.image_url = v.old_image AND p.name = v.expected_name
  AND p.set_name = v.expected_set AND p.card_type = v.expected_type AND p.language = 'Japanese'
RETURNING p.id, p.image_url, p.price, p.stock;
UPDATE public.products
SET description = 'Japanese Pokemon M4 Ninja Spinner Booster Box. 30 packs per box, 5 cards per pack.'
WHERE id = 'jp-m4-bb' AND language = 'Japanese' AND set_name = 'M4 Ninja Spinner'
  AND description = 'Official Japanese Pokemon M4 Ninja Spinner Booster Box. 20 packs per box.';
COMMIT;
