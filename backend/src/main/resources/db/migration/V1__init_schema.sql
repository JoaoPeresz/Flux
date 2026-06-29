-- V1__init_schema.sql
-- Flux - Initial database schema

-- Enable pgcrypto for gen_random_uuid() on PostgreSQL 14
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    avatar_color VARCHAR(7)  NOT NULL DEFAULT '#6C63FF',
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name      VARCHAR(100) NOT NULL,
    icon      VARCHAR(50)  NOT NULL DEFAULT 'tag',
    color     VARCHAR(7)   NOT NULL DEFAULT '#6C63FF',
    is_income BOOLEAN      NOT NULL DEFAULT false
);

-- Default categories
INSERT INTO categories (name, icon, color, is_income) VALUES
    ('Moradia',          'home',          '#EF4444', false),
    ('Alimentação',      'utensils',      '#F97316', false),
    ('Transporte',       'car',           '#EAB308', false),
    ('Saúde',            'heart-pulse',   '#22C55E', false),
    ('Lazer',            'gamepad-2',     '#3B82F6', false),
    ('Vestuário',        'shirt',         '#8B5CF6', false),
    ('Educação',         'book-open',     '#06B6D4', false),
    ('Contas & Serviços','zap',           '#F59E0B', false),
    ('Supermercado',     'shopping-cart', '#10B981', false),
    ('Investimentos',    'trending-up',   '#6366F1', false),
    ('Pet',              'paw-print',     '#EC4899', false),
    ('Outras',           'circle-ellipsis','#6B7280', false),
    ('Salário',          'wallet',        '#22C55E', true),
    ('Freelance',        'briefcase',     '#10B981', true),
    ('Outras Receitas',  'plus-circle',   '#6B7280', true);

-- ============================================================
-- PAYMENT SOURCES
-- ============================================================
CREATE TYPE payment_source_type AS ENUM (
    'CREDIT_CARD',
    'DEBIT',
    'CASH',
    'PIX',
    'BOLETO',
    'AUTO_DEBIT'
);

CREATE TABLE payment_sources (
    id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100)        NOT NULL,
    type        payment_source_type NOT NULL,
    closing_day SMALLINT,           -- only for CREDIT_CARD (1-28)
    due_day     SMALLINT,           -- only for CREDIT_CARD (1-28)
    color       VARCHAR(7)          NOT NULL DEFAULT '#6C63FF',
    icon        VARCHAR(50)         NOT NULL DEFAULT 'credit-card',
    created_at  TIMESTAMP           NOT NULL DEFAULT now()
);

-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE budgets (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID    NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    reference_month DATE    NOT NULL, -- always stored as first day of month: 2025-07-01
    limit_amount    NUMERIC(12, 2) NOT NULL,
    UNIQUE (user_id, category_id, reference_month)
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TYPE transaction_type AS ENUM (
    'FIXED',
    'INSTALLMENT',
    'VARIABLE',
    'ONE_TIME',
    'INCOME'
);

CREATE TABLE transactions (
    id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id          UUID             NOT NULL REFERENCES categories(id),
    payment_source_id    UUID             REFERENCES payment_sources(id),
    description          VARCHAR(255)     NOT NULL,
    amount               NUMERIC(12, 2)   NOT NULL,
    transaction_date     DATE             NOT NULL,   -- date of purchase
    competence_date      DATE             NOT NULL,   -- billing month (first day): calculated
    type                 transaction_type NOT NULL,

    -- Installment fields
    installment_group_id UUID,                        -- groups all installments of same purchase
    installment_number   SMALLINT,
    installments_total   SMALLINT,

    -- Recurrence fields
    recurrence_end_date  DATE,                        -- null = no end

    -- Flags
    is_shared            BOOLEAN          NOT NULL DEFAULT false,
    is_paid              BOOLEAN          NOT NULL DEFAULT false,
    notes                TEXT,
    created_at           TIMESTAMP        NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_competence ON transactions(user_id, competence_date);
CREATE INDEX idx_transactions_installment_group ON transactions(installment_group_id);

-- ============================================================
-- TRANSACTION SPLITS (shared expenses)
-- ============================================================
CREATE TABLE transaction_splits (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID           NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    user_id        UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount         NUMERIC(12, 2) NOT NULL
);
