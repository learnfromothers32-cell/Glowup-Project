import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' };

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const bgColors = [
  'bg-brand-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-amber-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500',
];

function getColor(name?: string) {
  if (!name) return bgColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold',
        getColor(name),
        sizes[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
