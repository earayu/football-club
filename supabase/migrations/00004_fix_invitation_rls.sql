-- Allow anyone (including unauthenticated) to read invitations by code
-- so the join page can display club info before prompting login/signup
drop policy if exists "invitations_select_by_code" on public.invitations;

create policy "invitations_select_by_code" on public.invitations
  for select using (true);
