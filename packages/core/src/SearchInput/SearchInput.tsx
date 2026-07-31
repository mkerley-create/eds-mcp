import {forwardRef} from 'react';
import {TextField, type TextFieldProps} from '../TextField/TextField';

export interface SearchInputProps
  extends Omit<TextFieldProps, 'type' | 'startContent'> {
  onSearch?: (query: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({onSearch, onKeyDown, ...props}, ref) {
    return (
      <TextField
        {...props}
        ref={ref}
        type="search"
        startContent={<span aria-hidden="true">⌕</span>}
        onKeyDown={event => {
          onKeyDown?.(event);
          if (event.key === 'Enter') onSearch?.(event.currentTarget.value);
        }}
      />
    );
  },
);
