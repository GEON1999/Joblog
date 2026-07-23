import { createClient } from "@/lib/supabase/server";

import { logout } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">JobLog</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{user?.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>
      <p className="mt-16 text-center text-gray-500">지원 파이프라인이 여기에 표시됩니다.</p>
    </main>
  );
}
