-- =====================================================================
-- Fase 8 — Security Advisor: funciones que solo deben dispararse como
-- triggers no deben ser invocables directamente por RPC/SQL.
--
-- El motor de triggers de Postgres NO pasa por el chequeo de privilegio
-- EXECUTE al disparar un trigger (invoca la función directamente), así
-- que revocar EXECUTE aquí no afecta a on_auth_user_created,
-- on_auth_user_rol_actualizado, trg_auditoria ni trg_cita_atendida.
--
-- fn_set_updated_at() y fn_proteger_atencion() ya quedaron sin EXECUTE
-- para public/anon/authenticated desde la migración inicial (el
-- "revoke execute on all functions ... from public, anon" de ese
-- momento las cubrió porque ya existían; nunca se les otorgó a
-- authenticated). handle_user_rol_actualizado() se creó después de ese
-- revoke global y quedó con el EXECUTE por defecto de Postgres a
-- PUBLIC (de ahí que hoy la ejecute incluso anon); fn_auditoria(),
-- fn_cita_atendida() y handle_new_user() ya deberían estar cubiertas,
-- pero se repite el revoke aquí de forma explícita e idempotente.
-- =====================================================================

revoke execute on function public.handle_user_rol_actualizado() from public, anon, authenticated;
revoke execute on function public.fn_auditoria()                from public, anon, authenticated;
revoke execute on function public.fn_cita_atendida()             from public, anon, authenticated;
revoke execute on function public.handle_new_user()              from public, anon, authenticated;
