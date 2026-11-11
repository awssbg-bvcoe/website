import { Suspense } from "react";
import { Lockup } from "@/components/brand/Lockup";

const ERRORS: Record<string, string> = {
  denied: "That GitHub account is not on the admin list. Ask the Group Leader to add your username.",
  state: "The sign-in took too long or was opened in another tab. Try again.",
  github: "GitHub did not complete the sign-in. Try again.",
  config: "GitHub sign-in is not configured on this deployment yet.",
};

async function ErrorNote({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { error } = await searchParams;
  const text = typeof error === "string" ? ERRORS[error] : undefined;
  if (!text) return null;
  return (
    <p role="alert" className="mt-6 border-l-4 border-magenta bg-grey-800 px-4 py-3 text-sm text-paper">
      {text}
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main id="main" className="grid min-h-[100dvh] place-items-center px-4">
      <div className="w-full max-w-md bg-grey-850 p-8 shadow-[10px_10px_0_0_var(--mint)] outline outline-1 outline-grey-700 sm:p-10">
        <Lockup compact />
        <h1 className="mt-10 font-mono text-3xl leading-tight font-bold tracking-tight">Links admin</h1>
        <p className="mt-3 text-grey-300">Sign in with a core team GitHub account to manage short links.</p>
        <Suspense fallback={null}>
          <ErrorNote searchParams={searchParams} />
        </Suspense>
        <a
          href="/api/auth/github"
          className="pressable mt-8 flex h-12 items-center justify-center bg-mint px-6 font-bold text-mint-ink uppercase hover:bg-paper"
        >
          Sign in with GitHub
        </a>
      </div>
    </main>
  );
}
