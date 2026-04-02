# 개발 DB 스키마 (2026-03-13)

## books
| column_name    | data_type                | is_nullable | column_default               |
|----------------|--------------------------|-------------|------------------------------|
| isbn           | text                     | NO          | null                         |
| title          | text                     | NO          | null                         |
| author         | text                     | YES         | null                         |
| publisher      | text                     | YES         | null                         |
| cover_url      | text                     | YES         | null                         |
| official_toc   | jsonb                    | YES         | null                         |
| draft_toc      | jsonb                    | YES         | null                         |
| official_genre | text                     | YES         | null                         |
| draft_genre    | text                     | YES         | null                         |
| created_at     | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| updated_at     | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| draft_pages    | integer                  | YES         | null                         |
| official_pages | integer                  | YES         | null                         |

## comments
| column_name   | data_type                | is_nullable | column_default               |
|---------------|--------------------------|-------------|------------------------------|
| id            | uuid                     | NO          | uuid_generate_v4()           |
| group_book_id | uuid                     | NO          | null                         |
| user_id       | uuid                     | YES         | null                         |
| parent_id     | uuid                     | YES         | null                         |
| content       | text                     | NO          | null                         |
| anchor_text   | text                     | YES         | null                         |
| position_pct  | integer                  | NO          | null                         |
| created_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| updated_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) |

## group_books
| column_name       | data_type                | is_nullable | column_default               |
|-------------------|--------------------------|-------------|------------------------------|
| id                | uuid                     | NO          | uuid_generate_v4()           |
| group_id          | uuid                     | NO          | null                         |
| isbn              | text                     | NO          | null                         |
| toc_snapshot      | jsonb                    | YES         | null                         |
| status            | text                     | NO          | 'reading'::text              |
| started_at        | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| finished_at       | timestamp with time zone | YES         | null                         |
| target_start_date | date                     | YES         | null                         |
| target_end_date   | date                     | YES         | null                         |
| genre_snapshot    | text                     | YES         | null                         |
| created_at        | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| updated_at        | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| pages_snapshot    | integer                  | YES         | null                         |
| deleted_at        | timestamp with time zone | YES         | null                         |

## group_members
| column_name | data_type                | is_nullable | column_default               |
|-------------|--------------------------|-------------|------------------------------|
| id          | uuid                     | NO          | uuid_generate_v4()           |
| group_id    | uuid                     | NO          | null                         |
| user_id     | uuid                     | NO          | null                         |
| role        | text                     | NO          | 'member'::text               |
| joined_at   | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| left_at     | timestamp with time zone | YES         | null                         |

## groups
| column_name | data_type                | is_nullable | column_default               |
|-------------|--------------------------|-------------|------------------------------|
| id          | uuid                     | NO          | uuid_generate_v4()           |
| name        | text                     | NO          | null                         |
| invite_code | text                     | YES         | null                         |
| group_type  | text                     | NO          | 'social'::text               |
| status      | text                     | NO          | 'active'::text               |
| created_by  | uuid                     | YES         | null                         |
| deleted_at  | timestamp with time zone | YES         | null                         |
| created_at  | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| updated_at  | timestamp with time zone | NO          | timezone('utc'::text, now()) |

## notifications
| column_name | data_type                | is_nullable | column_default               |
|-------------|--------------------------|-------------|------------------------------|
| id          | uuid                     | NO          | uuid_generate_v4()           |
| user_id     | uuid                     | NO          | null                         |
| type        | text                     | NO          | null                         |
| title       | text                     | NO          | null                         |
| message     | text                     | YES         | null                         |
| source_id   | uuid                     | YES         | null                         |
| link        | text                     | YES         | null                         |
| is_read     | boolean                  | NO          | false                        |
| created_at  | timestamp with time zone | NO          | timezone('utc'::text, now()) |

## payments
| column_name     | data_type                | is_nullable | column_default     |
|-----------------|--------------------------|-------------|--------------------|
| id              | uuid                     | NO          | uuid_generate_v4() |
| user_id         | uuid                     | YES         | null               |
| subscription_id | uuid                     | YES         | null               |
| plan_id         | uuid                     | YES         | null               |
| order_id        | text                     | NO          | null               |
| payment_key     | text                     | YES         | null               |
| amount          | integer                  | NO          | null               |
| method          | text                     | YES         | null               |
| status          | text                     | NO          | null               |
| approved_at     | timestamp with time zone | YES         | null               |
| toss_response   | jsonb                    | YES         | null               |
| created_at      | timestamp with time zone | YES         | now()              |

## reactions
| column_name | data_type                | is_nullable | column_default               |
|-------------|--------------------------|-------------|------------------------------|
| id          | uuid                     | NO          | uuid_generate_v4()           |
| user_id     | uuid                     | NO          | null                         |
| comment_id  | uuid                     | NO          | null                         |
| type        | text                     | NO          | null                         |
| created_at  | timestamp with time zone | NO          | timezone('utc'::text, now()) |

## reviews
| column_name   | data_type                | is_nullable | column_default               |
|---------------|--------------------------|-------------|------------------------------|
| id            | uuid                     | NO          | uuid_generate_v4()           |
| user_id       | uuid                     | YES         | null                         |
| group_book_id | uuid                     | NO          | null                         |
| rating        | numeric                  | NO          | null                         |
| content       | text                     | YES         | null                         |
| created_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| updated_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) |

## subscription_limits
| column_name           | data_type                | is_nullable | column_default |
|-----------------------|--------------------------|-------------|----------------|
| tier                  | text                     | NO          | null           |
| max_groups_created    | integer                  | NO          | null           |
| max_books_per_group   | integer                  | NO          | null           |
| has_statistics_access | boolean                  | NO          | false          |
| created_at            | timestamp with time zone | YES         | now()          |
| updated_at            | timestamp with time zone | YES         | now()          |

## subscription_plans
| column_name           | data_type                | is_nullable | column_default     |
|-----------------------|--------------------------|-------------|--------------------|
| id                    | uuid                     | NO          | uuid_generate_v4() |
| name                  | text                     | NO          | null               |
| display_name          | text                     | NO          | null               |
| tier                  | text                     | NO          | null               |
| billing_period        | text                     | NO          | null               |
| billing_period_months | integer                  | NO          | null               |
| price                 | integer                  | NO          | null               |
| discount_percentage   | integer                  | YES         | 0                  |
| features              | jsonb                    | YES         | null               |
| is_active             | boolean                  | YES         | true               |
| created_at            | timestamp with time zone | YES         | now()              |

## subscriptions
| column_name  | data_type                | is_nullable | column_default     |
|--------------|--------------------------|-------------|--------------------|
| id           | uuid                     | NO          | uuid_generate_v4() |
| user_id      | uuid                     | YES         | null               |
| plan_id      | uuid                     | YES         | null               |
| status       | text                     | NO          | null               |
| start_date   | timestamp with time zone | NO          | null               |
| end_date     | timestamp with time zone | NO          | null               |
| auto_renew   | boolean                  | YES         | true               |
| billing_key  | text                     | YES         | null               |
| cancelled_at | timestamp with time zone | YES         | null               |
| created_at   | timestamp with time zone | YES         | now()              |
| updated_at   | timestamp with time zone | YES         | now()              |

## user_reading_progress
| column_name   | data_type                | is_nullable | column_default               |
|---------------|--------------------------|-------------|------------------------------|
| id            | uuid                     | NO          | uuid_generate_v4()           |
| user_id       | uuid                     | YES         | null                         |
| group_book_id | uuid                     | NO          | null                         |
| progress_pct  | integer                  | NO          | 0                            |
| last_read_at  | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| finished_at   | timestamp with time zone | YES         | null                         |
| created_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| updated_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| hidden        | boolean                  | NO          | false                        |

## user_wishlists
| column_name | data_type                | is_nullable | column_default    |
|-------------|--------------------------|-------------|-------------------|
| id          | uuid                     | NO          | gen_random_uuid() |
| user_id     | uuid                     | NO          | null              |
| isbn        | text                     | NO          | null              |
| created_at  | timestamp with time zone | NO          | now()             |

## users
| column_name           | data_type                | is_nullable | column_default                                                                                                                                   |
|-----------------------|--------------------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| id                    | uuid                     | NO          | null                                                                                                                                             |
| nickname              | text                     | YES         | null                                                                                                                                             |
| avatar_url            | text                     | YES         | null                                                                                                                                             |
| subscription_tier     | text                     | NO          | 'free'::text                                                                                                                                     |
| yearly_reading_goal   | integer                  | YES         | 50                                                                                                                                               |
| notification_settings | jsonb                    | NO          | jsonb_build_object('comment_reply', true, 'reaction', true, 'member_join', true, 'completion', true, 'book_added', true, 'group_archived', true) |
| app_settings          | jsonb                    | NO          | jsonb_build_object('library_view_mode', 'year', 'calendar_include_comments', true)                                                               |
| created_at            | timestamp with time zone | NO          | timezone('utc'::text, now())                                                                                                                     |
| updated_at            | timestamp with time zone | NO          | timezone('utc'::text, now())                                                                                                                     |
