-- Solar Replacement: espaço privado para as fotos dos chamados (autorizado pelo usuário em 20/11/2026).
-- Rodar uma vez no Supabase: painel do projeto "IG Base" > SQL Editor > New query > colar > Run.
-- Pode rodar de novo sem problema (não duplica nada). Não mexe nas tabelas nem nos outros sistemas.
-- Regras: pasta privada; cada conta só lê, envia e apaga arquivos dentro da própria pasta (o nome da pasta é o id do usuário);
-- só imagens (JPEG, PNG, WebP) de até 2 MB (o site reduz cada foto para ~100-300 KB antes de enviar).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('solar-replacement', 'solar-replacement', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "solar_replacement_ler_proprio" on storage.objects;
drop policy if exists "solar_replacement_enviar_proprio" on storage.objects;
drop policy if exists "solar_replacement_alterar_proprio" on storage.objects;
drop policy if exists "solar_replacement_apagar_proprio" on storage.objects;

create policy "solar_replacement_ler_proprio" on storage.objects
  for select to authenticated
  using (bucket_id = 'solar-replacement' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "solar_replacement_enviar_proprio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'solar-replacement' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "solar_replacement_alterar_proprio" on storage.objects
  for update to authenticated
  using (bucket_id = 'solar-replacement' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'solar-replacement' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "solar_replacement_apagar_proprio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'solar-replacement' and (storage.foldername(name))[1] = (select auth.uid())::text);
