-- Run after migrations/20260911_today.sql in the Neon SQL Editor.
-- All fixture data and changes are rolled back, including any previous focus.
BEGIN;
DO $$
DECLARE
  owner_id text;
  first_id uuid := gen_random_uuid();
  second_id uuid := gen_random_uuid();
  legacy_id uuid := gen_random_uuid();
  saved public.items%ROWTYPE;
  completion timestamptz;
BEGIN
  SELECT user_id INTO STRICT owner_id FROM public.items LIMIT 1;
  INSERT INTO public.items(id, user_id, content, type, status, priority, tags, due_date)
  VALUES (first_id, owner_id, 'Workflow verification A', 'todo', 'todo', 'none', '{}', '2026-09-19T00:00:00Z'),
         (second_id, owner_id, 'Workflow verification B', 'todo', 'todo', 'none', '{}', NULL);

  PERFORM public.set_today_focus(first_id, '2026-09-11');
  SELECT * INTO saved FROM public.items WHERE id = first_id;
  ASSERT saved.planned_for = '2026-09-11'::date AND saved.focused_on = '2026-09-11'::date;
  ASSERT saved.due_date = '2026-09-19T00:00:00Z'::timestamptz;
  ASSERT saved.completed_at IS NULL;
  PERFORM public.set_today_focus(second_id, '2026-09-11');
  ASSERT (SELECT count(*) = 1 FROM public.items WHERE user_id = owner_id AND focused_on IS NOT NULL);
  ASSERT (SELECT focused_on IS NULL AND planned_for = '2026-09-11'::date FROM public.items WHERE id = first_id);

  UPDATE public.items SET status = 'done' WHERE id = second_id RETURNING completed_at INTO completion;
  ASSERT completion IS NOT NULL;
  ASSERT (SELECT focused_on IS NULL FROM public.items WHERE id = second_id);
  UPDATE public.items SET description = 'edit after completion' WHERE id = second_id;
  ASSERT (SELECT completed_at = completion FROM public.items WHERE id = second_id);
  UPDATE public.items SET status = 'todo' WHERE id = second_id;
  ASSERT (SELECT completed_at IS NULL FROM public.items WHERE id = second_id);

  PERFORM public.set_today_focus(first_id, '2026-09-11');
  UPDATE public.items SET waiting_for = 'Reply', review_on = '2026-09-12' WHERE id = first_id;
  ASSERT (SELECT focused_on IS NULL FROM public.items WHERE id = first_id);
  UPDATE public.items SET type = 'note' WHERE id = first_id;
  ASSERT (SELECT planned_for IS NULL AND waiting_for IS NULL AND review_on IS NULL FROM public.items WHERE id = first_id);

  INSERT INTO public.items(id, user_id, content, type, status, priority, tags, completed_at)
  VALUES (legacy_id, owner_id, 'Restored historical task', 'todo', 'done', 'none', '{}', NULL);
  ASSERT (SELECT completed_at IS NULL FROM public.items WHERE id = legacy_id);
  ASSERT NOT (SELECT prosecdef FROM pg_proc WHERE oid = 'public.set_today_focus(uuid,date)'::regprocedure);
END;
$$;
ROLLBACK;
