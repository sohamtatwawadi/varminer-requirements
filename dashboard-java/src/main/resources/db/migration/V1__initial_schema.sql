-- VarMiner Postgres schema (Supabase-compatible). All timestamps UTC.

-- Users (Spring Security form login; BCrypt password)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX idx_users_username ON users(username);

-- Requirements (all legacy CSV columns + new fields)
CREATE TABLE requirements (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(255),
    type VARCHAR(100),
    requirement TEXT,
    description TEXT,
    acceptance_criteria TEXT,
    clear_req VARCHAR(10),
    estimate VARCHAR(50),
    dependency VARCHAR(500),
    priority VARCHAR(50),
    stack_rank VARCHAR(50),
    status VARCHAR(100) NOT NULL DEFAULT 'Not Started',
    start_sprint VARCHAR(100),
    target_sprint VARCHAR(100),
    release_text VARCHAR(255),
    release_quarter VARCHAR(50),
    release_month VARCHAR(10),
    release_date DATE,
    requestee_dept VARCHAR(255),
    requested_by VARCHAR(255),
    assignee VARCHAR(255),
    comments TEXT,
    tags TEXT[] DEFAULT '{}',
    risk_level VARCHAR(50),
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocker_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_release ON requirements(release_text);
CREATE INDEX idx_requirements_release_month ON requirements(release_month);
CREATE INDEX idx_requirements_updated_at ON requirements(updated_at);

-- Releases (release notes, planned date, status, comments)
CREATE TABLE releases (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    planned_date DATE,
    release_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'released', 'cancelled')),
    release_notes TEXT,
    internal_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TABLE release_requirement_links (
    id BIGSERIAL PRIMARY KEY,
    release_id BIGINT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    requirement_id BIGINT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    UNIQUE(release_id, requirement_id)
);

CREATE TABLE release_comments (
    id BIGSERIAL PRIMARY KEY,
    release_id BIGINT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    author_username VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX idx_release_comments_release ON release_comments(release_id);

-- Meetings (weekly/fortnightly)
CREATE TABLE meetings (
    id BIGSERIAL PRIMARY KEY,
    meeting_type VARCHAR(50) NOT NULL CHECK (meeting_type IN ('weekly', 'fortnightly')),
    meeting_date DATE NOT NULL,
    attendees TEXT,
    agenda TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TABLE meeting_decisions (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    decision_text TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE meeting_action_items (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    action_text TEXT NOT NULL,
    owner VARCHAR(255),
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE meeting_requirement_links (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    requirement_id BIGINT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    UNIQUE(meeting_id, requirement_id)
);

CREATE TABLE meeting_release_links (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    release_id BIGINT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    UNIQUE(meeting_id, release_id)
);

CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_meeting_action_items_status ON meeting_action_items(status);

-- Priority sets (week/month/quarter/custom)
CREATE TABLE priority_sets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timeframe VARCHAR(50) NOT NULL CHECK (timeframe IN ('week', 'month', 'quarter', 'custom')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TABLE priority_set_items (
    id BIGSERIAL PRIMARY KEY,
    priority_set_id BIGINT NOT NULL REFERENCES priority_sets(id) ON DELETE CASCADE,
    requirement_id BIGINT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE(priority_set_id, requirement_id)
);

CREATE INDEX idx_priority_set_items_set ON priority_set_items(priority_set_id);
