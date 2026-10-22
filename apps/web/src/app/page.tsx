"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

export default function Web() {
  const [name, setName] = useState<string>("");
  const [response, setResponse] = useState<{ message: string } | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setResponse(null);
    setError(undefined);
  }, [name]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setName(e.target.value);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const result = await fetch(`/api/message/${encodeURIComponent(name)}`);
      if (!result.ok) {
        throw new Error("API request failed");
      }
      const response = await result.json();
      setResponse(response);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch response");
    }
  };

  const onReset = () => {
    setName("");
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Web</h1>
        <p className="text-muted-foreground">Enter a name to test the API.</p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/components" />}
        >
          Ver galería de componentes
        </Button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            name="name"
            id="name"
            value={name}
            onChange={onChange}
            required
          />
        </div>
        <Button type="submit">Submit</Button>
      </form>
      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-4">
          <h2 className="font-medium">Error</h2>
          <p>{error}</p>
        </div>
      )}
      {response && (
        <div className="bg-card space-y-4 rounded-lg border p-4">
          <div>
            <h2 className="font-medium">Greeting</h2>
            <p className="text-muted-foreground">{response.message}</p>
          </div>
          <Button variant="outline" onClick={onReset}>
            Reset
          </Button>
        </div>
      )}
    </main>
  );
}
