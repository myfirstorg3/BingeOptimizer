-- ============================================================================
-- BLASTOISE DATABASE SCHEMA
-- Supports: PostgreSQL, MySQL, SQLite (with dialect adaptations)
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url VARCHAR(500),
    bio TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    show_online_status BOOLEAN DEFAULT TRUE,
    login_provider ENUM('local', 'google', 'facebook') DEFAULT 'local',
    provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_provider (login_provider, provider_id)
);

-- ============================================================================
-- USER PREFERENCES & FRIENDSHIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    preferred_moods JSON,
    preferred_genres JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_friendship (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    avatar_data LONGBLOB NOT NULL,
    file_name VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_avatar (user_id)
);

-- ============================================================================
-- MEDIA TABLE (Movies, TV Series, Anime)
-- ============================================================================
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100) NOT NULL,
    external_source ENUM('omdb', 'tmdb', 'local') DEFAULT 'omdb',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poster_url VARCHAR(500),
    backdrop_url VARCHAR(500),
    type ENUM('movie', 'tv', 'anime') NOT NULL,
    release_date DATE,
    end_date DATE,
    duration_minutes INT,
    number_of_seasons INT,
    number_of_episodes INT,
    synopsis TEXT,
    avg_rating DECIMAL(3, 1),
    rating_count INT DEFAULT 0,
    language VARCHAR(10),
    country VARCHAR(100),
    last_review_fetch_at TIMESTAMP,
    last_api_fetch_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_external (external_id, external_source),
    KEY idx_title (title),
    KEY idx_type (type),
    KEY idx_release_date (release_date)
);

-- ============================================================================
-- GENRES & MEDIA GENRES
-- ============================================================================
CREATE TABLE IF NOT EXISTS genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_genres (
    media_id UUID NOT NULL,
    genre_id UUID NOT NULL,
    PRIMARY KEY (media_id, genre_id),
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
    KEY idx_genre_id (genre_id)
);

-- ============================================================================
-- REVIEWS & AI SUMMARIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL,
    external_review_id VARCHAR(255),
    source VARCHAR(50),
    author VARCHAR(100),
    content TEXT,
    score DECIMAL(3, 1),
    review_date DATE,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    KEY idx_media_id (media_id),
    KEY idx_fetched_at (fetched_at)
);

CREATE TABLE IF NOT EXISTS ai_review_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL UNIQUE,
    summary_text TEXT,
    sentiment_score DECIMAL(3, 2),
    review_count_basis INT,
    llm_model_used VARCHAR(50),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_update_at TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    KEY idx_next_update (next_update_at)
);

-- ============================================================================
-- USER INTERACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL,
    user_id UUID NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_media_id (media_id)
);

CREATE TABLE IF NOT EXISTS user_media_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    media_id UUID NOT NULL,
    watch_status ENUM('unwatched', 'watching', 'completed', 'abandoned') DEFAULT 'unwatched',
    personal_rating DECIMAL(3, 1),
    episodes_watched INT DEFAULT 0,
    total_episodes INT,
    runtime_watched_mins INT DEFAULT 0,
    last_watched_at TIMESTAMP,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_media (user_id, media_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    KEY idx_status (watch_status)
);

-- ============================================================================
-- COLLECTIONS & COLLECTION ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cover_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    sort_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    UNIQUE KEY unique_collection_name (user_id, name)
);

CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL,
    media_id UUID NOT NULL,
    user_score INT,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    UNIQUE KEY unique_item (collection_id, media_id),
    KEY idx_media_id (media_id)
);

-- ============================================================================
-- TIER LISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tier_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    collection_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
    KEY idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS tier_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_list_id UUID NOT NULL,
    media_id UUID NOT NULL,
    tier CHAR(1),
    position INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tier_list_id) REFERENCES tier_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    KEY idx_tier_list_id (tier_list_id)
);

-- ============================================================================
-- BINGE SESSIONS (Optimization Results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS binge_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    time_available_mins INT NOT NULL,
    selected_moods JSON,
    genre_filter VARCHAR(255),
    candidate_media_ids JSON,
    ranked_results JSON,
    llm_model_used VARCHAR(50),
    llm_latency_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_created_at (created_at)
);

-- ============================================================================
-- VECTOR EMBEDDINGS (For search)
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL UNIQUE,
    embedding VECTOR(1536),
    title_embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_genre_name ON genres(name);
CREATE INDEX idx_collection_user ON collections(user_id);
CREATE INDEX idx_user_status ON user_media_status(user_id, watch_status);
CREATE INDEX idx_binge_user_date ON binge_sessions(user_id, created_at DESC);
CREATE INDEX idx_review_date ON reviews(review_date DESC);
