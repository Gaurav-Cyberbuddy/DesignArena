import { LoginForm } from "@/components/login-form";
import { safeRedirectPath } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl">Sign in with email</h1>
        <p className="mt-3 text-muted-foreground">
          We send a one-time code or magic link. Google is not required. Use the same address for
          submitting and voting.
        </p>
      </div>
      <LoginForm next={safeRedirectPath(next, "/")} />
    </div>
  );
}
