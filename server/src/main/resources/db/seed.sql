INSERT INTO categories (name, slug) VALUES
    ('Frontend',     'frontend'),
    ('Backend',      'backend'),
    ('Cloud',        'cloud'),
    ('DevOps',       'devops'),
    ('AI/ML',        'ai'),
    ('Architecture', 'architecture'),
    ('General',      'general')
ON CONFLICT (slug) DO NOTHING;
