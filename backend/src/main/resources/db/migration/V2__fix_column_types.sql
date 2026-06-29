-- V2__fix_column_types.sql
-- Hibernate maps Kotlin Int to INTEGER (int4), but V1 created these as SMALLINT (int2).
-- This migration aligns the DB types with what Hibernate expects.

ALTER TABLE payment_sources
    ALTER COLUMN closing_day TYPE INTEGER,
    ALTER COLUMN due_day TYPE INTEGER;

ALTER TABLE transactions
    ALTER COLUMN installment_number TYPE INTEGER,
    ALTER COLUMN installments_total TYPE INTEGER;
