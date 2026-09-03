export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col gap-2 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Smart India Hackathon prototype for Problem Statement 26063 —
          not an official NCPOR or Ministry of Earth Sciences deployment.
        </p>
        <p>Research → Knowledge → Discovery → Education → Outreach</p>
      </div>
    </footer>
  );
}
