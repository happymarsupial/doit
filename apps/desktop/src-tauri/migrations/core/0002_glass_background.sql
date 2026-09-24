-- The window is now transparent with native Mica/Acrylic/vibrancy behind
-- it, so the builtin themes' background needs to be translucent instead of
-- a solid color for the glass effect to actually show through.
UPDATE themes
SET tokens_json = replace(tokens_json, '"bg": "#f4f4f6"', '"bg": "rgba(244,244,246,0.78)"')
WHERE is_builtin = 1 AND is_dark = 0;

UPDATE themes
SET tokens_json = replace(tokens_json, '"bg": "#1c1c1e"', '"bg": "rgba(28,28,30,0.78)"')
WHERE is_builtin = 1 AND is_dark = 1;
