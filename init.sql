CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) UNIQUE,
    custom_alias VARCHAR(50) UNIQUE,
    click_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clicks (
    id BIGSERIAL PRIMARY KEY,
    url_id UUID REFERENCES urls(id),
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    referrer TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    device_type VARCHAR(20)
);