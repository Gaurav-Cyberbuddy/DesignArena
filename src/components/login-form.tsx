"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestMagicLink } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  next: z.string(),
});

type Values = z.infer<typeof schema>;

export function LoginForm({ next }: { next: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", next },
  });

  return (
    <form
      className="space-y-4 rounded-2xl border bg-card p-6"
      onSubmit={form.handleSubmit((values) => {
        const formData = new FormData();
        formData.set("email", values.email);
        formData.set("next", values.next);
        start(async () => {
          setError(null);
          const result = await requestMagicLink(formData);
          if (result.ok) {
            setMessage("Check your email for a sign-in link or one-time code.");
          } else {
            setError(result.error);
          }
        });
      })}
    >
      <input type="hidden" {...form.register("next")} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>
      {message ? <p className="text-sm text-teal">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
