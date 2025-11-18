
select
  get_total_positive_credits ();

----------------------------------------------------------------------------------------
alter table credits
add column expires_at TIMESTAMP,
add column is_expired BOOLEAN default false;

alter table credits
alter column expires_at
set default (NOW() + INTERVAL '1 year');

create index idx_credit_expires on credits (expires_at)
where
  is_expired = false;

-- trigger to update the expiriation on the updation of the credits _await_response
create or replace function update_credit_expiration () RETURNS TRIGGER as $$
BEGIN
  -- Case 1: credit increased → extend expiration
  IF NEW.credits > OLD.credits THEN
    NEW.expires_at := NOW() + INTERVAL '1 year';
  END IF;

  -- Case 2: credit decreased → keep old expiration
  -- (Do nothing)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

create trigger trigger_update_credit_expiration BEFORE
update on credits for EACH row
execute FUNCTION update_credit_expiration ();

-- admin update the expriring time of the credits
create or replace function admin_update_credit_expiry (p_customer_id TEXT, p_new_expiry TIMESTAMPTZ) RETURNS VOID as $$
BEGIN
  UPDATE credits
  SET expires_at = p_new_expiry
  WHERE customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

----------------------------------------------------------------------------------------
-- updating the credit expiring table
alter table credit_transactions
add column expires_at TIMESTAMP,
add column is_expired BOOLEAN default false,
create index idx_credit_trans_expires on credit_transactions (expires_at)
where
  is_expired = false;

alter table credit_transactions
add column expires_at TIMESTAMP default (NOW() + INTERVAL '1 year');

--adding the function to track the expiring credits
create or replace function get_expiring_credits (p_days_threshold INTEGER default 30) RETURNS table (
  customer_id TEXT,
  email TEXT,
  full_name TEXT,
  credits INTEGER,
  expires_at TIMESTAMP,
  days_left INTEGER
) as $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.customer_id,
    c.email,
    p.full_name,
    ct.credits as credits,
    ct.expires_at,
    EXTRACT(DAY FROM ct.expires_at - NOW())::INTEGER as days_left
  FROM credits ct
  INNER JOIN customers c ON ct.customer_id = c.customer_id
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE ct.expires_at IS NOT NULL
    AND ct.expires_at BETWEEN NOW() AND NOW() + (p_days_threshold || ' days')::INTERVAL
    AND ct.is_expired = false
    AND ct.credits > 0
  ORDER BY ct.expires_at ASC;
END;
$$ LANGUAGE plpgsql;

-- running the above function
select
  get_expiring_credits (50)
  -- creating the total expiring credits function
create or replace function get_total_expiring_credits (p_days_threshold INTEGER default 30) RETURNS NUMERIC as $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(credits), 0)
  INTO total
  FROM credits
  WHERE expires_at IS NOT NULL
    AND expires_at BETWEEN NOW() AND NOW() + (p_days_threshold || ' days')::INTERVAL
    AND is_expired = false
    AND credits > 0;
    
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- calling the above function of the total expiring credits
select
  get_total_expiring_credits (30)
  -- creating gift code record table
create table if not exists gift_codes (
  id UUID primary key default gen_random_uuid (),
  code VARCHAR(50) unique not null,
  credits_amount NUMERIC not null check (credits_amount > 0),
  max_uses INTEGER not null default 1 check (max_uses > 0),
  current_uses INTEGER not null default 0 check (current_uses >= 0),
  expires_at TIMESTAMP not null,
  is_active BOOLEAN default true,
  created_by TEXT not null, -- admin user_id
  created_at TIMESTAMP default NOW(),
  updated_at TIMESTAMP default NOW(),
  notes TEXT,
  constraint check_uses check (current_uses <= max_uses)
);

-- Indexes for performance
create index idx_gift_codes_code on gift_codes (code);

create index idx_gift_codes_active on gift_codes (is_active, expires_at)
where
  is_active = true;

create index idx_gift_codes_created_by on gift_codes (created_by);

COMMENT on table gift_codes is 'Redeemable gift codes for free credits';

-- =====================================================
-- 3. CREATE gift_code_redemptions TABLE
-- =====================================================
create table if not exists gift_code_redemptions (
  id UUID primary key default gen_random_uuid (),
  code_id UUID not null references gift_codes (id) on delete CASCADE,
  customer_id TEXT not null references customers (customer_id),
  user_id TEXT,
  credits_received NUMERIC not null,
  transaction_id TEXT,
  redeemed_at TIMESTAMP default NOW(),
  ip_address TEXT,
  user_agent TEXT,
  -- Prevent same user from redeeming same code twice
  unique (code_id, customer_id)
);

-- Indexes
create index idx_gift_redemptions_code on gift_code_redemptions (code_id);

create index idx_gift_redemptions_customer on gift_code_redemptions (customer_id);

create index idx_gift_redemptions_date on gift_code_redemptions (redeemed_at);

COMMENT on table gift_code_redemptions is 'Tracks who redeemed which codes';

-- =====================================================
-- 4. FUNCTION: Create Gift Code
-- =====================================================
create or replace function create_gift_code (
  p_admin_user_id TEXT,
  p_code VARCHAR(50),
  p_credits_amount NUMERIC,
  p_max_uses INTEGER default 1,
  p_expires_at TIMESTAMP default null,
  p_notes TEXT default null
) RETURNS table (success BOOLEAN, message TEXT, code_id UUID) as $$
DECLARE
  v_code_id UUID;
  v_expires_at TIMESTAMP;
BEGIN
  -- Default expiration: 30 days from now
  v_expires_at := COALESCE(p_expires_at, NOW() + INTERVAL '30 days');

  -- Check if code already exists
  IF EXISTS (SELECT 1 FROM gift_codes WHERE code = UPPER(p_code)) THEN
    RETURN QUERY SELECT 
      false, 
      'Code "' || p_code || '" already exists. Please choose a different code.', 
      NULL::UUID;
    RETURN;
  END IF;

  -- Create the gift code
  INSERT INTO gift_codes (
    code,
    credits_amount,
    max_uses,
    expires_at,
    created_by,
    notes
  ) VALUES (
    UPPER(p_code), -- Always store uppercase
    p_credits_amount,
    p_max_uses,
    v_expires_at,
    p_admin_user_id,
    p_notes
  )
  RETURNING id INTO v_code_id;

  RETURN QUERY SELECT 
    true, 
    'Gift code created successfully!', 
    v_code_id;
END;
$$ LANGUAGE plpgsql;

COMMENT on FUNCTION create_gift_code is 'Admin function to create new gift codes';

-- =====================================================
-- 5. FUNCTION: Redeem Gift Code
-- =====================================================
create or replace function redeem_gift_code (
  p_customer_id TEXT,
  p_user_id TEXT,
  p_code VARCHAR(50),
  p_ip_address TEXT default null,
  p_user_agent TEXT default null
) RETURNS table (
  success BOOLEAN,
  message TEXT,
  credits_received NUMERIC,
  new_balance NUMERIC
) as $$
DECLARE
  v_code_record RECORD;
  v_transaction_id TEXT;
  v_credits_received NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get gift code (with row lock to prevent race conditions)
  SELECT * INTO v_code_record
  FROM gift_codes
  WHERE code = UPPER(p_code)
  FOR UPDATE;

  -- ============ VALIDATION CHECKS ============

  -- Check 1: Code exists
  IF v_code_record IS NULL THEN
    RETURN QUERY SELECT 
      false, 
      'Invalid gift code. Please check and try again.', 
      0::NUMERIC, 
      0::NUMERIC;
    RETURN;
  END IF;

  -- Check 2: Code is active
  IF NOT v_code_record.is_active THEN
    RETURN QUERY SELECT 
      false, 
      'This gift code has been deactivated.', 
      0::NUMERIC, 
      0::NUMERIC;
    RETURN;
  END IF;

  -- Check 3: Code not expired
  IF v_code_record.expires_at < NOW() THEN
    RETURN QUERY SELECT 
      false, 
      'This gift code expired on ' || TO_CHAR(v_code_record.expires_at, 'Mon DD, YYYY') || '.', 
      0::NUMERIC, 
      0::NUMERIC;
    RETURN;
  END IF;

  -- Check 4: Max uses not reached
  IF v_code_record.current_uses >= v_code_record.max_uses THEN
    RETURN QUERY SELECT 
      false, 
      'This gift code has reached its maximum number of uses.', 
      0::NUMERIC, 
      0::NUMERIC;
    RETURN;
  END IF;

  -- Check 5: User hasn't already redeemed this code
  IF EXISTS (
    SELECT 1 FROM gift_code_redemptions 
    WHERE code_id = v_code_record.id 
    AND customer_id = p_customer_id
  ) THEN
    RETURN QUERY SELECT 
      false, 
      'You have already redeemed this gift code.', 
      0::NUMERIC, 
      0::NUMERIC;
    RETURN;
  END IF;

  -- ============ REDEMPTION PROCESS ============

  v_credits_received := v_code_record.credits_amount;
  v_transaction_id := gen_random_uuid()::TEXT;

  -- Add credits via transaction
  INSERT INTO credit_transactions (
    id,
    customer_id,
    amount,
    description,
    package_type,
    expires_at
  ) VALUES (
    v_transaction_id,
    p_customer_id,
    v_credits_received,
    'Gift Code: ' || v_code_record.code || 
    CASE 
      WHEN v_code_record.notes IS NOT NULL THEN ' - ' || v_code_record.notes 
      ELSE '' 
    END,
    'gift_code',
    NOW() + INTERVAL '1 year'
  );

  -- Update customer balance
  INSERT INTO credits (customer_id, credits)
  VALUES (p_customer_id, v_credits_received)
  ON CONFLICT (customer_id) 
  DO UPDATE SET 
    credits = credits.credits + v_credits_received,
    updated_at = NOW()
  RETURNING credits INTO v_new_balance;

  -- Record redemption
  INSERT INTO gift_code_redemptions (
    code_id,
    customer_id,
    user_id,
    credits_received,
    transaction_id,
    ip_address,
    user_agent
  ) VALUES (
    v_code_record.id,
    p_customer_id,
    p_user_id,
    v_credits_received,
    v_transaction_id,
    p_ip_address,
    p_user_agent
  );

  -- Increment usage count
  UPDATE gift_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = v_code_record.id;

  -- Return success
  RETURN QUERY SELECT 
    true, 
    'Success! ' || v_credits_received || ' credits added to your account.', 
    v_credits_received,
    v_new_balance;
END;
$$ LANGUAGE plpgsql;

COMMENT on FUNCTION redeem_gift_code is 'User function to redeem gift codes for free credits';

-- =====================================================
-- 6. FUNCTION: Get All Gift Codes (Admin)
-- =====================================================
create or replace function get_all_gift_codes () RETURNS table (
  id UUID,
  code VARCHAR,
  credits_amount NUMERIC,
  max_uses INTEGER,
  current_uses INTEGER,
  remaining_uses INTEGER,
  expires_at TIMESTAMP,
  is_active BOOLEAN,
  status TEXT,
  created_at TIMESTAMP,
  notes TEXT
) as $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    gc.code,
    gc.credits_amount,
    gc.max_uses,
    gc.current_uses,
    (gc.max_uses - gc.current_uses) as remaining_uses,
    gc.expires_at,
    gc.is_active,
    CASE 
      WHEN NOT gc.is_active THEN 'inactive'
      WHEN gc.expires_at < NOW() THEN 'expired'
      WHEN gc.current_uses >= gc.max_uses THEN 'used_up'
      ELSE 'active'
    END as status,
    gc.created_at,
    gc.notes
  FROM gift_codes gc
  ORDER BY gc.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

select
  get_all_gift_codes ()
drop function IF exists get_all_gift_codes ();

-- =====================================================
-- 7. FUNCTION: Get Code Redemption History (Admin)
-- =====================================================
create or replace function get_gift_code_redemptions (p_code_id UUID default null) RETURNS table (
  redemption_id UUID,
  code VARCHAR,
  customer_email TEXT,
  credits_received NUMERIC,
  redeemed_at TIMESTAMP
) as $$
BEGIN
  RETURN QUERY
  SELECT 
    gcr.id as redemption_id,
    gc.code,
    c.email as customer_email,
    gcr.credits_received,
    gcr.redeemed_at
  FROM gift_code_redemptions gcr
  INNER JOIN gift_codes gc ON gcr.code_id = gc.id
  INNER JOIN customers c ON gcr.customer_id = c.customer_id
  WHERE p_code_id IS NULL OR gcr.code_id = p_code_id
  ORDER BY gcr.redeemed_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 8. FUNCTION: Deactivate Gift Code (Admin)
-- =====================================================
create or replace function deactivate_gift_code (p_code_id UUID) RETURNS table (success BOOLEAN, message TEXT) as $$
DECLARE
  v_code VARCHAR;
BEGIN
  -- Get code name
  SELECT code INTO v_code
  FROM gift_codes
  WHERE id = p_code_id;

  IF v_code IS NULL THEN
    RETURN QUERY SELECT false, 'Gift code not found';
    RETURN;
  END IF;

  -- Deactivate
  UPDATE gift_codes
  SET is_active = false,
      updated_at = NOW()
  WHERE id = p_code_id;

  RETURN QUERY SELECT 
    true, 
    'Gift code "' || v_code || '" has been deactivated';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNCTION: Edit Gift Code (Admin)
-- =====================================================
create or replace function edit_gift_code (
  p_code_id UUID,
  p_max_uses INTEGER default null,
  p_expires_at TIMESTAMP default null,
  p_notes TEXT default null
) RETURNS table (success BOOLEAN, message TEXT) as $$
DECLARE
  v_code VARCHAR;
  v_current_uses INTEGER;
BEGIN
  -- Get code details
  SELECT code, current_uses 
  INTO v_code, v_current_uses
  FROM gift_codes
  WHERE id = p_code_id;

  IF v_code IS NULL THEN
    RETURN QUERY SELECT false, 'Gift code not found';
    RETURN;
  END IF;

  -- Validate max_uses if provided
  IF p_max_uses IS NOT NULL AND p_max_uses < v_current_uses THEN
    RETURN QUERY SELECT 
      false, 
      'Cannot set max uses to ' || p_max_uses || 
      ' because ' || v_current_uses || ' redemptions have already occurred';
    RETURN;
  END IF;

  -- Update gift code
  UPDATE gift_codes
  SET 
    max_uses = COALESCE(p_max_uses, max_uses),
    expires_at = COALESCE(p_expires_at, expires_at),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_code_id;

  RETURN QUERY SELECT 
    true, 
    'Gift code "' || v_code || '" updated successfully';
END;
$$ LANGUAGE plpgsql;

-------------------------user route updation-------------------------------------
--adding column of banned and unbanned users
alter table customers
add column is_banned BOOLEAN default false;

-- Function: admin_get_customers(search_text text, limit_count int, offset_count int)
-- Drop function if it exists
drop function IF exists admin_get_customers (
  search_text text,
  limit_count integer,
  offset_count integer
);

-- Create function
create or replace function admin_get_customers (
  search_text text,
  limit_count integer,
  offset_count integer
) RETURNS table (
  customer_id text,
  email text,
  user_id uuid,
  name text,
  is_banned boolean,
  credits INTEGER,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER -- <-- this line ensures the function runs with owner's privileges
as $$
BEGIN
    RETURN QUERY
    SELECT
        c.customer_id,
        c.email,
        c.user_id,
        u.raw_user_meta_data->>'full_name' AS display_name,
        COALESCE(c.is_banned, false) AS is_banned,
        cr.credits AS credits,
        c.created_at
    FROM customers c
    LEFT JOIN auth.users u
        ON c.user_id = u.id
    LEFT JOIN LATERAL (
        SELECT cr_sub.credits
        FROM credits cr_sub
        WHERE cr_sub.customer_id = c.customer_id
        ORDER BY cr_sub.created_at DESC
        LIMIT 1
    ) cr ON true
    WHERE c.email ILIKE '%' || search_text || '%'
       OR u.raw_user_meta_data->>'full_name' ILIKE '%' || search_text || '%'
    ORDER BY c.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

drop function IF exists admin_get_customers (
  search_text text,
  limit_count integer,
  offset_count integer
);

select
  admin_get_customers ('', 10, 0)
select
  c.customer_id,
  c.email,
  c.user_id,
  u.raw_user_meta_data ->> 'full_name' as display_name,
  COALESCE(c.is_banned, false) as is_banned,
  cr.credits,
  c.created_at
from
  customers c
  left join auth.users u on c.user_id = u.id
  left join lateral (
    select
      credits
    from
      credits
    where
      customer_id = c.customer_id
    order by
      created_at desc
    limit
      1
  ) cr on true
order by
  c.created_at desc;

create or replace function admin_get_customers_count (search_text text) RETURNS integer LANGUAGE sql as $$
SELECT COUNT(*)
FROM customers 
$$;

select
  admin_get_customers_count ('')
create or replace function admin_bulk_gift_from_credits (p_amount INT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER as $$
BEGIN
    -- 1. Log a transaction for every customer
    INSERT INTO public.credit_transactions (customer_id, amount, description)
    SELECT c.customer_id, p_amount, 'Bulk Gift Credit'
    FROM public.credits c;

    -- 2. Update ALL customers' credits in bulk
    UPDATE public.credits
    SET credits = credits + p_amount,
        updated_at = NOW()
    WHERE TRUE;
END;
$$;

select
  admin_bulk_gift_from_credits (10)
  ---------------------finacias sales dashboard route--------------------------
create table billing_settings (
  id uuid primary key default gen_random_uuid (),
  credit_value numeric not null, -- e.g. 0.008
  input_rate numeric not null, -- e.g. 0.000003
  output_rate numeric not null, -- e.g. 0.000015
  margin_multiplier numeric not null, -- e.g. 1.5
  updated_at timestamp with time zone default now(),
  updated_by uuid null references auth.users (id)
);

insert into
  billing_settings (
    credit_value,
    input_rate,
    output_rate,
    margin_multiplier
  )
values
  (0.008, 0.000003, 0.000015, 1.5);

create table pricing_tiers (
  id text primary key, -- 'starter', 'transformation', etc.
  name text not null,
  description text not null,
  features text[] not null, -- array of feature strings
  featured boolean default false,
  amount integer not null, -- price in cents (2000, 20000, 50000)
  credits integer not null, -- credits given (2000, 22500, 62500)
  currency text not null default 'USD',
  savings text null, -- "Save 10%", etc.
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

insert into
  pricing_tiers (
    id,
    name,
    description,
    features,
    featured,
    amount,
    credits,
    currency,
    savings
  )
values
  (
    'starter',
    'Starter',
    'Perfect for trying NEO',
    '{"2,000 credits", "Try NEO risk-free"}',
    false,
    2000,
    2000,
    'USD',
    null
  ),
  (
    'transformation',
    'Transformation',
    'Serious users buy in bulk',
    '{"22,500 credits", "Save 10%", "Serious users buy in bulk"}',
    false,
    20000,
    22500,
    'USD',
    'Save 10%'
  ),
  (
    'professional',
    'Professional',
    'Never run out mid-flow',
    '{"62,500 credits", "Save 20%", "Never run out mid-flow"}',
    false,
    50000,
    62500,
    'USD',
    'Save 20%'
  );

create table package_transaction (
  transaction_id UUID primary key default gen_random_uuid (),
  customer_id TEXT not null,
  pricing_tier_id TEXT not null,
  currency VARCHAR(10) not null default 'USD',
  payment_id VARCHAR(255) not null,
  ammount numeric not null,
  created_at timestamp with time zone default NOW(),
  -- Foreign Keys
  constraint fk_customer foreign KEY (customer_id) references customers (customer_id) on delete CASCADE,
  constraint fk_pricing_tier foreign KEY (pricing_tier_id) references pricing_tiers (id) on delete set null
);

create table usage_transactions (
  id uuid primary key default gen_random_uuid (),
  customer_id TEXT not null references customers (customer_id),
  tokens_used bigint not null,
  credits_used numeric not null,
  api_cost numeric not null, -- tokens_used × provider rate
  profit numeric not null, -- (credits_used × credit_value) - api_cost
  model text not null,
  created_at timestamp with time zone default now()
);

alter table usage_transactions
add column last_updated_at timestamptz default now();

alter table usage_transactions
add constraint usage_unique_customer unique (customer_id);

create or replace function log_usage_transaction (
  p_customer_id TEXT,
  p_tokens_used BIGINT,
  p_credits_used NUMERIC,
  p_api_cost NUMERIC,
  p_model TEXT,
  p_credit_value NUMERIC
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER as $$
DECLARE
    v_existing RECORD;
    v_profit NUMERIC;
BEGIN
    -- Try to find existing usage record for this customer
    SELECT *
    INTO v_existing
    FROM usage_transactions
    WHERE customer_id = p_customer_id
    LIMIT 1;

    IF FOUND THEN
        -- Accumulate values
        UPDATE usage_transactions
        SET 
            tokens_used  = tokens_used  + p_tokens_used,
            credits_used = credits_used + p_credits_used,
            api_cost     = api_cost     + p_api_cost,

            -- Recalculate profit:
            -- profit = (total_credits * credit_value) - total_api_cost
            profit       = (credits_used * p_credit_value) 
                            - api_cost,

            model = p_model,
            last_updated_at = now()
        WHERE customer_id = p_customer_id;

    ELSE
        -- First record for this customer
        v_profit := (p_credits_used * p_credit_value) - p_api_cost;

        INSERT INTO usage_transactions (
            customer_id,
            tokens_used,
            credits_used,
            api_cost,
            profit,
            model,
            last_updated_at
        ) VALUES (
            p_customer_id,
            p_tokens_used,
            p_credits_used,
            p_api_cost,
            v_profit,
            p_model,
            now()
        );
    END IF;

END;
$$;

create or replace function log_usage_transaction (
  p_customer_id TEXT,
  p_tokens_used BIGINT,
  p_credits_used NUMERIC,
  p_api_cost NUMERIC,
  p_model TEXT,
  p_credit_value NUMERIC
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER as $$
DECLARE
    v_existing RECORD;
    v_profit NUMERIC;
    v_total_tokens BIGINT;
    v_threshold BIGINT := 100000; -- set your high token threshold here
BEGIN
    -- 1. Check for existing usage record
    SELECT *
    INTO v_existing
    FROM usage_transactions
    WHERE customer_id = p_customer_id
    LIMIT 1;

    IF FOUND THEN
        -- Accumulate values
        UPDATE usage_transactions
        SET 
            tokens_used  = tokens_used  + p_tokens_used,
            credits_used = credits_used + p_credits_used,
            api_cost     = api_cost     + p_api_cost,
            profit       = (credits_used + p_credits_used) * p_credit_value - (api_cost + p_api_cost),
            model        = p_model,
            last_updated_at = now()
        WHERE customer_id = p_customer_id;

        -- Calculate new total tokens
        v_total_tokens := v_existing.tokens_used + p_tokens_used;

    ELSE
        -- First record for this customer
        v_profit := (p_credits_used * p_credit_value) - p_api_cost;

        INSERT INTO usage_transactions (
            customer_id,
            tokens_used,
            credits_used,
            api_cost,
            profit,
            model,
            last_updated_at
        ) VALUES (
            p_customer_id,
            p_tokens_used,
            p_credits_used,
            p_api_cost,
            v_profit,
            p_model,
            now()
        );

        v_total_tokens := p_tokens_used;
    END IF;

    -- 2. Log a system event if token usage exceeds threshold
    IF p_tokens_used > v_threshold THEN
          PERFORM log_system_event(
          p_event_type  => 'warning',
          p_category    => 'usage',
          p_message     => format('Customer %s exceeded token threshold: %s tokens', p_customer_id, v_total_tokens),
          p_metadata    => jsonb_build_object(  -- Changed from json_build_object
                              'tokens_used', v_total_tokens,
                              'threshold', v_threshold,
                              'model', p_model
                          ),  -- Removed ::json cast
          p_user_id     => NULL,
          p_customer_id => p_customer_id
      );
    END IF;

END;
$$;

select
  log_usage_transaction (
    'hghauri30@gmail.com', -- p_customer_id
    100, -- p_tokens_used
    2, -- p_credits_used
    0.045, -- p_api_cost (example: $0.045)
    'claude-3.5-sonnet', -- p_model
    0.008 -- p_credit_value (same as CREDIT_VALUE)
  );

create or replace function admin_total_revenue () returns numeric language sql security definer as $$
    select coalesce(sum(pt.amount), 0)::numeric
    from package_transaction t
    join pricing_tiers pt on pt.id = t.pricing_tier_id;
$$;

select
  admin_total_revenue ()
create or replace function admin_active_packages () returns bigint language sql security definer as $$
    select count(*)::bigint
    from package_transaction
    where created_at >= now() - interval '12 months';
$$;

select
  admin_active_packages ()
create or replace function admin_growth_rate () returns numeric language plpgsql security definer as $$
declare
    current_month numeric;
    previous_month numeric;
begin
    select coalesce(sum(pt.amount),0)
    into current_month
    from package_transaction t
    join pricing_tiers pt on pt.id = t.pricing_tier_id
    where date_trunc('month', t.created_at) = date_trunc('month', now());

    select coalesce(sum(pt.amount),0)
    into previous_month
    from package_transaction t
    join pricing_tiers pt on pt.id = t.pricing_tier_id
    where date_trunc('month', t.created_at) = date_trunc('month', now() - interval '1 month');

    if previous_month = 0 then
        return 100; -- means 100% growth when no previous revenue
    end if;

    return ((current_month - previous_month) / previous_month) * 100;
end;
$$;

select
  admin_growth_rate ()
create or replace function admin_revenue_trend () returns table (month date, revenue numeric) language sql security definer as $$
    select
        date_trunc('month', t.created_at)::date as month,
        sum(pt.amount) as revenue
    from package_transaction t
    join pricing_tiers pt on pt.id = t.pricing_tier_id
    group by 1
    order by 1;
$$;

select
  admin_revenue_trend ()
create or replace function admin_package_distribution () returns table (
  pricing_tier_id text,
  package_count bigint,
  amount_per_package integer
) language sql security definer as $$
    select
        pt.id as pricing_tier_id,
        count(t.transaction_id)::bigint as package_count,
        pt.amount as amount_per_package
    from package_transaction t
    join pricing_tiers pt on pt.id = t.pricing_tier_id
    group by pt.id, pt.amount
    order by package_count desc;
$$;

create or replace function admin_recent_transactions () returns table (
  email text,
  pricing_tier text,
  amount integer,
  created_at timestamp with time zone
) language sql security definer as $$
    select
        c.email,
        pt.name as pricing_tier,
        pt.amount,
        t.created_at
    from package_transaction t
    join customers c on c.customer_id = t.customer_id
    join pricing_tiers pt on pt.id = t.pricing_tier_id
    order by t.created_at desc
    limit 5;
$$;

select
  admin_package_distribution ()
select
  admin_recent_transactions ()
insert into
  package_transaction (
    customer_id,
    pricing_tier_id,
    currency,
    payment_id,
    amount,
    created_at
  )
values
  (
    'code.with.hamza.dev@gmail.com',
    'professional',
    'USD',
    'pay_001',
    50000,
    '2024-07-12 10:15:00'
  ),
  (
    'hghauri30@gmail.com',
    'starter',
    'USD',
    'pay_002',
    2000,
    '2024-07-18 14:22:00'
  ),
  (
    'arundavidp@gmail.com',
    'starter',
    'USD',
    'pay_003',
    2000,
    '2024-08-02 09:11:00'
  ),
  (
    'code.with.hamza.dev@gmail.com',
    'transformation',
    'USD',
    'pay_004',
    20000,
    '2024-08-09 18:32:00'
  ),
  (
    'hghauri30@gmail.com',
    'professional',
    'USD',
    'pay_005',
    50000,
    '2024-09-01 11:29:00'
  ),
  (
    'arundavidp@gmail.com',
    'starter',
    'USD',
    'pay_006',
    2000,
    '2024-09-15 16:44:00'
  ),
  (
    'code.with.hamza.dev@gmail.com',
    'transformation',
    'USD',
    'pay_007',
    20000,
    '2024-10-03 07:51:00'
  ),
  (
    'hghauri30@gmail.com',
    'starter',
    'USD',
    'pay_008',
    2000,
    '2024-10-17 20:05:00'
  ),
  (
    'arundavidp@gmail.com',
    'professional',
    'USD',
    'pay_009',
    50000,
    '2024-11-05 13:14:00'
  ),
  (
    'code.with.hamza.dev@gmail.com',
    'starter',
    'USD',
    'pay_010',
    2000,
    '2024-11-22 09:30:00'
  ),
  (
    'hghauri30@gmail.com',
    'transformation',
    'USD',
    'pay_011',
    20000,
    '2024-12-02 15:18:00'
  ),
  (
    'arundavidp@gmail.com',
    'starter',
    'USD',
    'pay_012',
    2000,
    '2024-12-19 19:47:00'
  ),
  (
    'code.with.hamza.dev@gmail.com',
    'professional',
    'USD',
    'pay_013',
    50000,
    '2025-01-06 12:03:00'
  ),
  (
    'hghauri30@gmail.com',
    'starter',
    'USD',
    'pay_014',
    2000,
    '2025-01-21 08:55:00'
  ),
  (
    'arundavidp@gmail.com',
    'transformation',
    'USD',
    'pay_015',
    20000,
    '2025-02-02 11:12:00'
  ),
  (
    'code.with.hamza.dev@gmail.com',
    'starter',
    'USD',
    'pay_016',
    2000,
    '2025-02-17 17:26:00'
  ),
  (
    'hghauri30@gmail.com',
    'professional',
    'USD',
    'pay_017',
    50000,
    '2025-03-03 10:45:00'
  ),
  (
    'arundavidp@gmail.com',
    'transformation',
    'USD',
    'pay_018',
    20000,
    '2025-03-22 21:10:00'
  ),
  (
    'code.with.hamza.dev@gmail.com',
    'starter',
    'USD',
    'pay_019',
    2000,
    '2025-04-04 07:40:00'
  ),
  (
    'hghauri30@gmail.com',
    'professional',
    'USD',
    'pay_020',
    50000,
    '2025-04-18 12:27:00'
  );

create or replace function admin_dashboard_all () returns json language plpgsql security definer as $$
declare
    total_customers bigint;
    total_revenue numeric;
    active_packages bigint;
    growth_rate numeric;

    revenue_trend json;
    package_distribution json;
    recent_transactions json;
begin
    -- total customers
    select count(*) into total_customers from customers;

    -- total revenue
    select coalesce(sum(pt.amount), 0)
    into total_revenue
    from package_transaction t
    join pricing_tiers pt on pt.id = t.pricing_tier_id;

    -- active packages (12 months)
    select count(*) into active_packages
    from package_transaction
    where created_at >= now() - interval '12 months';

    -- growth rate
    declare
        current_month numeric := 0;
        previous_month numeric := 0;
    begin
        select coalesce(sum(pt.amount),0)
        into current_month
        from package_transaction t
        join pricing_tiers pt on pt.id = t.pricing_tier_id
        where date_trunc('month', t.created_at) = date_trunc('month', now());

        select coalesce(sum(pt.amount),0)
        into previous_month
        from package_transaction t
        join pricing_tiers pt on pt.id = t.pricing_tier_id
        where date_trunc('month', t.created_at) = date_trunc('month', now() - interval '1 month');

        if previous_month = 0 then
            growth_rate := 100;
        else
            growth_rate := ((current_month - previous_month) / previous_month) * 100;
        end if;
    end;

    -- revenue trend JSON
    select json_agg(row_to_json(x))
    into revenue_trend
    from (
        select
            date_trunc('month', t.created_at)::date as month,
            sum(pt.amount) as revenue
        from package_transaction t
        join pricing_tiers pt on pt.id = t.pricing_tier_id
        group by 1
        order by 1
    ) x;

    -- package distribution JSON
    select json_agg(row_to_json(y))
    into package_distribution
    from (
        select
            pt.id as pricing_tier_id,
            count(t.transaction_id)::bigint as package_count,
            pt.amount as amount_per_package
        from package_transaction t
        join pricing_tiers pt on pt.id = t.pricing_tier_id
        group by pt.id, pt.amount
        order by package_count desc
    ) y;

    -- recent transactions JSON
    select json_agg(row_to_json(z))
    into recent_transactions
    from (
        select
            c.email,
            pt.name as pricing_tier,
            pt.amount,
            t.created_at
        from package_transaction t
        join customers c on c.customer_id = t.customer_id
        join pricing_tiers pt on pt.id = t.pricing_tier_id
        order by t.created_at desc
        limit 5
    ) z;

    -- return final dashboard JSON
    return json_build_object(
        'total_customers', total_customers,
        'total_revenue', total_revenue,
        'active_packages', active_packages,
        'growth_rate', growth_rate,
        'revenue_trend', revenue_trend,
        'package_distribution', package_distribution,
        'recent_transactions', recent_transactions
    );
end;
$$;

select
  *
from
  admin_dashboard_all ();

create or replace function admin_sales_dashboard () RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER as $$
DECLARE
    v_result JSON;
    v_stats JSON;
    v_revenue_by_package JSON;
    v_monthly_revenue JSON;
    v_package_performance JSON;
    v_recent_transactions JSON;
BEGIN
    -- ============================================
    -- 1. STATS SECTION (Top cards)
    -- ============================================
    SELECT json_build_object(
        'total_sales', COALESCE(SUM(pt.amount), 0)::numeric,
        'active_packages', (
            SELECT COUNT(*)::bigint
            FROM package_transaction
            WHERE created_at >= now() - interval '12 months'
        ),
        'this_month_sales', COALESCE(
            (SELECT SUM(pt2.amount)
             FROM package_transaction t2
             JOIN pricing_tiers pt2 ON pt2.id = t2.pricing_tier_id
             WHERE date_trunc('month', t2.created_at) = date_trunc('month', now())
            ), 0
        )::numeric,
        'total_transactions', COUNT(t.transaction_id)::bigint
    )
    INTO v_stats
    FROM package_transaction t
    JOIN pricing_tiers pt ON pt.id = t.pricing_tier_id;

    -- ============================================
    -- 2. REVENUE BY PACKAGE TYPE (for bar chart)
    -- Grouped by month and package type
    -- ============================================
    SELECT json_agg(
        json_build_object(
            'month', month,
            'starter', COALESCE(starter, 0),
            'transformation', COALESCE(transformation, 0),
            'professional', COALESCE(professional, 0)
        )
        ORDER BY month
    )
    INTO v_revenue_by_package
    FROM (
        SELECT 
            date_trunc('month', t.created_at)::date as month,
            SUM(CASE WHEN t.pricing_tier_id = 'starter' THEN pt.amount ELSE 0 END) as starter,
            SUM(CASE WHEN t.pricing_tier_id = 'transformation' THEN pt.amount ELSE 0 END) as transformation,
            SUM(CASE WHEN t.pricing_tier_id = 'professional' THEN pt.amount ELSE 0 END) as professional
        FROM package_transaction t
        JOIN pricing_tiers pt ON pt.id = t.pricing_tier_id
        WHERE t.created_at >= now() - interval '12 months'
        GROUP BY date_trunc('month', t.created_at)
    ) revenue_data;

    -- ============================================
    -- 3. MONTHLY REVENUE TREND (alternative format)
    -- ============================================
    SELECT json_agg(
        json_build_object(
            'month', month,
            'revenue', revenue
        )
        ORDER BY month
    )
    INTO v_monthly_revenue
    FROM (
        SELECT
            date_trunc('month', t.created_at)::date as month,
            SUM(pt.amount) as revenue
        FROM package_transaction t
        JOIN pricing_tiers pt ON pt.id = t.pricing_tier_id
        WHERE t.created_at >= now() - interval '12 months'
        GROUP BY date_trunc('month', t.created_at)
    ) monthly_data;

    -- ============================================
    -- 4. PACKAGE PERFORMANCE
    -- Credits, Units Sold, Total Revenue, Avg/Day
    -- ============================================
    SELECT json_agg(
        json_build_object(
            'package_id', pricing_tier_id,
            'package_name', package_name,
            'credits', credits,
            'units_sold', units_sold,
            'total_revenue', total_revenue,
            'avg_per_day', ROUND(
                units_sold::numeric / GREATEST(
                    EXTRACT(DAY FROM (now() - first_sale))::numeric,
                    1
                ),
                1
            )
        )
        ORDER BY units_sold DESC
    )
    INTO v_package_performance
    FROM (
        SELECT
            pt.id as pricing_tier_id,
            pt.name as package_name,
            pt.credits,
            COUNT(t.transaction_id)::bigint as units_sold,
            SUM(pt.amount)::numeric as total_revenue,
            MIN(t.created_at) as first_sale
        FROM pricing_tiers pt
        LEFT JOIN package_transaction t ON t.pricing_tier_id = pt.id
        GROUP BY pt.id, pt.name, pt.credits
    ) perf_data;

    -- ============================================
    -- 5. RECENT TRANSACTIONS (Last 5)
    -- ============================================
    SELECT json_agg(
        json_build_object(
            'transaction_id', transaction_id,
            'user_email', email,
            'package_name', pricing_tier_name,
            'credits', credits,
            'amount', amount,
            'date', created_at
        )
        ORDER BY created_at DESC
    )
    INTO v_recent_transactions
    FROM (
        SELECT
            t.transaction_id,
            c.email,
            pt.name as pricing_tier_name,
            pt.credits,
            pt.amount,
            t.created_at
        FROM package_transaction t
        JOIN customers c ON c.customer_id = t.customer_id
        JOIN pricing_tiers pt ON pt.id = t.pricing_tier_id
        ORDER BY t.created_at DESC
        LIMIT 5
    ) recent_data;

    -- ============================================
    -- COMBINE ALL DATA INTO ONE JSON RESPONSE
    -- ============================================
    SELECT json_build_object(
        'stats', v_stats,
        'revenue_by_package', COALESCE(v_revenue_by_package, '[]'::json),
        'monthly_revenue', COALESCE(v_monthly_revenue, '[]'::json),
        'package_performance', COALESCE(v_package_performance, '[]'::json),
        'recent_transactions', COALESCE(v_recent_transactions, '[]'::json)
    )
    INTO v_result;

    RETURN v_result;
END;
$$;

select
  admin_sales_dashboard ()
select
  admin_dashboard_all ()
select
  admin_financial_analytics ()
create or replace function admin_financial_analytics () returns json language plpgsql security definer as $$
declare
    billing json;
    total_revenue numeric;
    total_api_cost numeric;
    total_profit numeric;
    revenue_cost_profit json;
    profit_per_user json;
    usage_data json;
begin
    -- 1. Billing Settings
    select row_to_json(b)
    into billing
    from billing_settings b
    order by updated_at desc
    limit 1;

    -- 2. Total Revenue
    select coalesce(sum(pt.amount), 0)::numeric
    into total_revenue
    from package_transaction t
    join pricing_tiers pt on pt.id = t.pricing_tier_id;

    -- 3. Total API Cost
    select coalesce(sum(api_cost), 0)::numeric
    into total_api_cost
    from usage_transactions;

    -- 4. Total Profit
    total_profit := total_revenue - total_api_cost;

    -- 5. Revenue vs Cost vs Profit (Using clean CTE joins)
    with
    rev AS (
        select
            date_trunc('month', t.created_at) AS month,
            sum(pt.amount)::numeric AS revenue
        from package_transaction t
        join pricing_tiers pt on pt.id = t.pricing_tier_id
        group by 1
    ),
    cost AS (
        select
            date_trunc('month', u.created_at) AS month,
            sum(u.api_cost)::numeric AS api_cost
        from usage_transactions u
        group by 1
    ),
    combined AS (
        select
            to_char(coalesce(rev.month, cost.month), 'YYYY-MM') AS month,
            coalesce(rev.revenue, 0) AS revenue,
            coalesce(cost.api_cost, 0) AS api_cost,
            (coalesce(rev.revenue, 0) - coalesce(cost.api_cost, 0)) AS profit
        from rev
        full outer join cost
        on rev.month = cost.month
        order by month
    )
    select json_agg(row_to_json(combined))
    into revenue_cost_profit
    from combined;

    -- 6. Profit per user
    -- Combined section: Profit per user & Detailed usage records
select json_agg(
    json_build_object(
        'customer_id', u.customer_id,
        'tokens_used', u.tokens_used,
        'credits_used', u.credits_used,
        'api_cost', u.api_cost,
        'profit', u.profit,
        'model', u.model,
        'created_at', u.created_at,
        'last_updated_at', u.last_updated_at
    ) order by u.created_at desc
)
into usage_data
from usage_transactions u;


    -- Final return object
    return json_build_object(
        'billing_settings', billing,
        'total_revenue', total_revenue,
        'total_api_cost', total_api_cost,
        'total_profit', total_profit,
        'revenue_cost_profit', revenue_cost_profit,
        'profit_per_user', profit_per_user,
        'usage_transactions', usage_data
    );
end;
$$;

create or replace function admin_update_billing_settings (
  p_credit_value numeric,
  p_input_rate numeric,
  p_output_rate numeric,
  p_margin_multiplier numeric
) returns json language plpgsql security definer as $$
declare
    updated_record json;
begin
    -- Update the most recent billing settings row
    update billing_settings
    set
        credit_value = p_credit_value,
        input_rate = p_input_rate,
        output_rate = p_output_rate,
        margin_multiplier = p_margin_multiplier,
        updated_at = now(),
        updated_by = auth.uid()
    where id = (
        select id
        from billing_settings
        order by updated_at desc
        limit 1
    )
    returning row_to_json(billing_settings.*)
    into updated_record;

    return updated_record;
end;
$$;

--logs route ----
create table system_logs (
  id uuid primary key default gen_random_uuid (),
  event_type text not null, -- 'info' | 'warning' | 'error'
  category text not null, -- 'usage' | 'api' | 'admin' | 'system'
  message text not null,
  metadata jsonb,
  user_id uuid references auth.users (id),
  customer_id TEXT,
  created_at timestamp with time zone default now()
);

create or replace function log_system_event (
  p_event_type text,
  p_category text,
  p_message text,
  p_metadata jsonb default '{}'::jsonb,
  p_user_id uuid default null,
  p_customer_id TEXT default null
) returns void language plpgsql security definer as $$
begin
  insert into system_logs (
    event_type,
    category,
    message,
    metadata,
    user_id,
    customer_id
  )
  values (
    p_event_type,
    p_category,
    p_message,
    p_metadata,
    p_user_id,
    p_customer_id
  );
end;
$$;

create or replace function admin_bulk_gift_from_credits (p_amount INT) returns void language plpgsql security definer as $$
begin
    -- 1. Log a transaction for every customer
    INSERT INTO public.credit_transactions (customer_id, amount, description)
    SELECT c.customer_id, p_amount, 'Bulk Gift Credit'
    FROM public.credits c;

    -- 2. Update ALL customers' credits in bulk
    UPDATE public.credits
    SET credits = credits + p_amount,
        updated_at = NOW()
    WHERE TRUE;

    -- 3. Log system event (no user_id)
    PERFORM log_system_event(
        'info',
        'admin',
        'Bulk gift credits executed',
        jsonb_build_object(
            'amount', p_amount,
            'updated_customers', (SELECT count(*) FROM public.credits),
            'executed_at', now()
        ),
        null,
        null
    );

end;
$$;