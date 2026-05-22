import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSearch?: (term: string) => void;
  placeholder?: string;
  buttonText?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search...',
  buttonText = 'Search',
  className,
  ...props
}: SearchBarProps) {
  const [term, setTerm] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(term);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        'relative flex w-full max-w-sm items-center space-x-2',
        className
      )}
      {...props}
    >
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <Input
          type="text"
          className="pl-10 h-12 rounded-full border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary shadow-sm"
          placeholder={placeholder}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="h-12 rounded-full px-6 transition-transform active:scale-95"
      >
        {buttonText}
      </Button>
    </form>
  );
}
