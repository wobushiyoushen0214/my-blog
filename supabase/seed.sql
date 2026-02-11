-- 创建管理员用户（在 Supabase SQL Editor 中执行）
-- 账号: leempty@admin  密码: 123456

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'leempty@admin',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'leempty@admin'),
  (SELECT id FROM auth.users WHERE email = 'leempty@admin')::text,
  jsonb_build_object(
    'sub', (SELECT id FROM auth.users WHERE email = 'leempty@admin')::text,
    'email', 'leempty@admin',
    'email_verified', true
  ),
  'email',
  now(),
  now(),
  now()
);
