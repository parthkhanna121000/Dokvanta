import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Logo className="mb-8" />
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
