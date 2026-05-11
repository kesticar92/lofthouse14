-- 011_pending_signup_notifications.sql
-- Al registrarse un usuario (Auth), handle_new_user crea el perfil en pending.
-- Añadimos avisos en public.notifications para cada admin/super_admin activo,
-- para que aparezcan en la campana del panel y no dependan de revisar SQL.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status, allowed_modules)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'staff',
    'pending',
    '{}'
  )
  on conflict (id) do nothing;

  -- Avisar a supervisores (no bloquea el alta si falla la notificación)
  begin
    insert into public.notifications (user_id, title, message)
    select
      p.id,
      'Nueva solicitud de acceso al panel',
      format(
        E'%s · %s\n\nAbre «Usuarios» y filtra por «Pendientes» para aprobar.',
        coalesce(new.email, '(sin correo)'),
        coalesce(
          nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
          '(sin nombre)'
        )
      )
    from public.profiles p
    where p.role in ('super_admin'::public.app_role, 'admin'::public.app_role)
      and p.status = 'active'
      and p.id is distinct from new.id;
  exception
    when others then
      raise warning 'handle_new_user: no se pudieron crear notificaciones: %', sqlerrm;
  end;

  return new;
end;
$$;
