# Reset Password Email Templates

Use these templates in Supabase:
- `Authentication -> Email Templates -> Reset Password`

## Bulgarian template
- Subject: `VOTAMIN • Смяна на парола`
- Body HTML: copy from `reset-password.bg.html`

## English template
- Subject: `VOTAMIN • Reset your password`
- Body HTML: copy from `reset-password.en.html`

## Notes
- Logo URL is public and stable:
  - `https://rpyoaovyjcityanyhygn.supabase.co/storage/v1/object/public/logo/logo.svg`
- Keep `{{ .ConfirmationURL }}` unchanged (Supabase injects the secure reset link).
- Supabase supports one active Reset Password template at a time. If you want automatic BG/EN per user language, use a custom mailer flow.
