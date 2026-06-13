import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/ui/login-form";
import { createSupabaseServerClient } from "@/lib/db-server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/vault");
  }

  const params = await searchParams;
  const hasError = Boolean(params.error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            이력 금고
          </h1>
          <p className="mt-1 text-sm text-ink-weak">
            지원서에 필요한 정보, 한 번 올려두고 3초 안에 복사
          </p>
        </div>
        {hasError && (
          <p className="mb-4 text-sm text-danger">
            로그인 링크가 만료됐거나 잘못됐어요. 새 링크를 받아주세요.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
