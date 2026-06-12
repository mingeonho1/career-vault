import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * 서버 컴포넌트·server action용 Supabase 클라이언트.
 * 쿠키 기반 세션 관리를 위해 @supabase/ssr의 createServerClient를 사용한다.
 * RLS가 적용되는 일반 사용자 권한 클라이언트다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // server component에서는 쿠키 쓰기가 불가 — middleware가 처리
        }
      },
    },
  });
}
