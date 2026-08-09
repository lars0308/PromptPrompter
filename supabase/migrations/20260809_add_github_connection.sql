alter table public.sitebrief_ai_connections drop constraint if exists sitebrief_ai_connections_provider_check;
alter table public.sitebrief_ai_connections add constraint sitebrief_ai_connections_provider_check check (provider in ('gateway','openai','gemini','cloudflare','github'));

create or replace function public.sitebrief_set_ai_connection(p_provider text,p_secret text) returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public','vault' as $function$
declare v_user uuid := (select auth.uid());v_existing uuid;v_secret_id uuid;v_name text;v_last4 text;
begin
 if v_user is null then raise exception 'Nicht angemeldet';end if;if p_provider not in ('gateway','openai','gemini','cloudflare','github') then raise exception 'Unbekannter Anbieter';end if;if p_secret is null or length(trim(p_secret))<8 then raise exception 'Zugangsschlüssel ist zu kurz';end if;
 select vault_secret_id into v_existing from public.sitebrief_ai_connections where user_id=v_user and provider=p_provider;v_name:='sitebrief-connection:'||v_user::text||':'||p_provider;v_last4:=right(trim(p_secret),4);
 if v_existing is null then v_secret_id:=vault.create_secret(trim(p_secret),v_name,'SiteBrief '||p_provider||' connection',null);else perform vault.update_secret(v_existing,trim(p_secret),v_name,'SiteBrief '||p_provider||' connection',null);v_secret_id:=v_existing;end if;
 insert into public.sitebrief_ai_connections(user_id,provider,vault_secret_id,last4,updated_at) values(v_user,p_provider,v_secret_id,v_last4,now()) on conflict(user_id,provider) do update set vault_secret_id=excluded.vault_secret_id,last4=excluded.last4,updated_at=now();return jsonb_build_object('provider',p_provider,'last4',v_last4,'connected',true);
end;$function$;

create or replace function public.sitebrief_get_ai_connection_secret(p_provider text) returns text language plpgsql security definer set search_path to 'pg_catalog','public','vault' as $function$
declare v_user uuid := (select auth.uid());v_secret_id uuid;v_secret text;
begin if v_user is null then raise exception 'Nicht angemeldet';end if;if p_provider not in ('gateway','openai','gemini','cloudflare','github') then raise exception 'Unbekannter Anbieter';end if;select vault_secret_id into v_secret_id from public.sitebrief_ai_connections where user_id=v_user and provider=p_provider;if v_secret_id is null then return null;end if;select decrypted_secret into v_secret from vault.decrypted_secrets where id=v_secret_id;return v_secret;end;$function$;

create or replace function public.sitebrief_delete_ai_connection(p_provider text) returns boolean language plpgsql security definer set search_path to 'pg_catalog','public','vault' as $function$
declare v_user uuid := (select auth.uid());v_secret_id uuid;
begin if v_user is null then raise exception 'Nicht angemeldet';end if;if p_provider not in ('gateway','openai','gemini','cloudflare','github') then raise exception 'Unbekannter Anbieter';end if;select vault_secret_id into v_secret_id from public.sitebrief_ai_connections where user_id=v_user and provider=p_provider;delete from public.sitebrief_ai_connections where user_id=v_user and provider=p_provider;if v_secret_id is not null then delete from vault.secrets where id=v_secret_id;end if;return true;end;$function$;
