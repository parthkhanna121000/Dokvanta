import { getPasswordStrength } from "@/lib/validations/auth";
import { cn } from "@/lib/utils/cn";

/** Four bars plus a text label, so strength is never conveyed by color alone. */
export function PasswordStrength({ password }: { password: string }) {
  const { score, label } = getPasswordStrength(password);
  const color = score <= 1 ? "bg-danger" : score === 2 ? "bg-warning" : "bg-success";
  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full bg-muted", i <= score && color)} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
        Password strength: {label}
      </p>
    </div>
  );
}
