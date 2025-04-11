import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}