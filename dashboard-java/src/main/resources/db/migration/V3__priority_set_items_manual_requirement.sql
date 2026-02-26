-- Allow priority items without a linked backlog requirement (manual requirement text)
ALTER TABLE priority_set_items
    ADD COLUMN IF NOT EXISTS requirement_text TEXT;
ALTER TABLE priority_set_items
    ALTER COLUMN requirement_id DROP NOT NULL;
