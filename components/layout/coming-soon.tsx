export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="container py-16">
      <div className="max-w-xl">
        <p className="text-sm text-muted-foreground mb-3">{phase}</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="mt-4 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
