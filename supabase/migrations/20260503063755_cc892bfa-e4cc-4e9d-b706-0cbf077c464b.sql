UPDATE public.knowledge_articles
SET content = replace(content, E'\\n', E'\n'),
    excerpt = replace(excerpt, E'\\n', ' ')
WHERE content LIKE '%\\n%' OR excerpt LIKE '%\\n%';