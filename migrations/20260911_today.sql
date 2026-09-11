BEGIN;

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS planned_for date,
  ADD COLUMN IF NOT EXISTS focused_on date,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_step text,
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS waiting_for text,
  ADD COLUMN IF NOT EXISTS review_on date,
  ADD COLUMN IF NOT EXISTS source_note_id uuid REFERENCES public.items(id) ON DELETE SET NULL;

-- Set the default separately so historical rows retain NULL.
ALTER TABLE public.items ALTER COLUMN completed_at SET DEFAULT now();

-- Existing done items have an unknown completion time. Do not backfill a guess.
CREATE OR REPLACE FUNCTION public.maintain_item_workflow()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.waiting_for := nullif(trim(NEW.waiting_for), '');
  IF NEW.type = 'todo' AND NEW.status = 'done' THEN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.status IS DISTINCT FROM 'done' OR OLD.type IS DISTINCT FROM 'todo' THEN
        NEW.completed_at := now();
      ELSE
        NEW.completed_at := OLD.completed_at;
      END IF;
    END IF;
    NEW.focused_on := NULL;
    NEW.waiting_for := NULL;
    NEW.review_on := NULL;
  ELSE
    NEW.completed_at := NULL;
  END IF;
  IF NEW.type = 'note' THEN
    NEW.planned_for := NULL;
    NEW.focused_on := NULL;
    NEW.waiting_for := NULL;
    NEW.review_on := NULL;
    NEW.source_note_id := NULL;
  ELSE
    NEW.pinned := false;
  END IF;
  IF NEW.waiting_for IS NOT NULL OR NEW.focused_on IS DISTINCT FROM NEW.planned_for THEN
    NEW.focused_on := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER items_workflow_before_write
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.maintain_item_workflow();

CREATE UNIQUE INDEX IF NOT EXISTS items_one_focus_per_user
  ON public.items(user_id) WHERE focused_on IS NOT NULL;

-- Runs with the caller's existing permissions and row-level security.
-- The transaction and lock make switching focus atomic across devices.
CREATE OR REPLACE FUNCTION public.set_today_focus(target_id uuid, target_day date)
RETURNS SETOF public.items LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE owner_id public.items.user_id%TYPE;
BEGIN
  IF target_day IS NULL THEN RAISE EXCEPTION 'A planning date is required'; END IF;
  SELECT user_id INTO owner_id FROM public.items
    WHERE id = target_id AND type = 'todo' AND status <> 'done' AND waiting_for IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task is not available'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  RETURN QUERY UPDATE public.items SET focused_on = NULL
    WHERE user_id = owner_id AND focused_on IS NOT NULL AND id <> target_id RETURNING *;
  RETURN QUERY UPDATE public.items
    SET focused_on = target_day, planned_for = target_day, status = 'in_progress'
    WHERE id = target_id AND status <> 'done' AND waiting_for IS NULL RETURNING *;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task is no longer available'; END IF;
END;
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
