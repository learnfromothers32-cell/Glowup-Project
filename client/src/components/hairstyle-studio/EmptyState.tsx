import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      {icon && <div className="mb-3 text-gray-200">{icon}</div>}
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      {description && <p className="text-xs text-gray-400 text-center max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
