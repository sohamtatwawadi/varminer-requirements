-- Add per-item fields: start sprint, end sprint, assignee, release date
ALTER TABLE priority_set_items
    ADD COLUMN IF NOT EXISTS start_sprint VARCHAR(100),
    ADD COLUMN IF NOT EXISTS end_sprint VARCHAR(100),
    ADD COLUMN IF NOT EXISTS assignee VARCHAR(255),
    ADD COLUMN IF NOT EXISTS release_date DATE;
