"use client";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Field, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(login, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Adresse e-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.email} key={state?.email} />
      </Field>
      <Field label="Mot de passe" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} />
      </Field>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>}
      <SubmitButton variant="primary" className="w-full" size="lg" pendingText="Connexion…">Se connecter</SubmitButton>
    </form>
  );
}
