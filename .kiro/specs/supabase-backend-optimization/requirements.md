# Supabase Backend Optimization

## Overview
Optimize the Supabase backend for better performance, maintainability, and migration readiness while reducing technical debt.

## Problem Statement
Current backend has several issues:
1. **Data Duplication**: Tournament data stored in both `tournament_selections` table AND `cat_app_users.tournament_data` JSONB
2. **Redundant RLS Policies**: Multiple overlapping policies causing confusion and potential security gaps
3. **Missing Constraints**: No unique constraints on critical relationships (e.g., user_name + name_id in ratings)
4. **JSONB Overuse**: Tournament data in JSONB makes querying slow and migration difficult
5. **Unused/Legacy Code**: `increment_selection` RPC is a no-op, materialized view not refreshed
6. **Type Mismatches**: `user_roles` table exists but `cat_app_users.user_role` is VARCHAR, not using the enum
7. **No Composite Keys**: Missing composite primary keys where natural (user_name, name_id)

## Goals
- **Performance**: Reduce query times by 50%+ through proper indexing and denormalization removal
- **Maintainability**: Clear schema with single source of truth for each data type
- **Migration Ready**: Structured data that can be exported/imported easily
- **Lean**: Remove unused tables, columns, functions, and policies
- **Robust**: Add proper constraints, foreign keys, and validation

## Acceptance Criteria

### AC1: Consolidate Tournament Data Storage
- [ ] Choose single source of truth: either `tournament_selections` table OR `cat_app_users.tournament_data`
- [ ] Migrate all tournament data to chosen location
- [ ] Remove duplicate storage mechanism
- [ ] Update all queries to use single source

### AC2: Simplify RLS Policies
- [ ] Audit all RLS policies and remove duplicates
- [ ] Consolidate "Anyone can X" and "Users can X" policies
- [ ] Document final policy set with clear security model
- [ ] Ensure policies use consistent helper functions

### AC3: Add Missing Database Constraints
- [ ] Add unique constraint on `cat_name_ratings(user_name, name_id)`
- [ ] Add composite primary keys where appropriate
- [ ] Add check constraints for data validation
- [ ] Add missing foreign key constraints

### AC4: Remove Legacy/Unused Code
- [ ] Remove or properly implement `increment_selection` RPC
- [ ] Remove `leaderboard_stats` materialized view or add refresh schedule
- [ ] Remove unused columns (e.g., `cat_name_options.user_name`, `popularity_score`, `total_tournaments`)
- [ ] Clean up duplicate role systems

### AC5: Optimize Indexes
- [ ] Review all indexes and remove unused ones
- [ ] Add covering indexes for common query patterns
- [ ] Add partial indexes for filtered queries
- [ ] Document index strategy

### AC6: Normalize Role Management
- [ ] Use `user_roles` table as single source of truth
- [ ] Remove `cat_app_users.user_role` column
- [ ] Update all role checks to use `user_roles` table
- [ ] Ensure role enum is used consistently

### AC7: Create Migration Scripts
- [ ] Export script for current schema
- [ ] Import script for new schema
- [ ] Data transformation scripts
- [ ] Rollback procedures

## Non-Goals
- Changing authentication mechanism (username-based is fine)
- Rewriting frontend code (only update API calls as needed)
- Adding new features (optimization only)

## Success Metrics
- Query performance improved by 50%+
- Database size reduced by 30%+
- Migration time < 5 minutes for full export/import
- Zero data loss during migration
- All tests passing after optimization
