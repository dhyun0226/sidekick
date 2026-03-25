-- 본인이 이미 나간(left_at) 또는 종료된(deleted_at) 그룹의 자기 멤버십 삭제 허용
-- 프로필 > 지난 그룹 > "목록에서 제거" 기능에 필요

create policy "Users can remove own membership from archived groups"
  on public.group_members for delete
  using (
    auth.uid() = user_id
    and (
      left_at is not null
      or exists (
        select 1 from public.groups
        where id = group_id
        and deleted_at is not null
      )
    )
  );
