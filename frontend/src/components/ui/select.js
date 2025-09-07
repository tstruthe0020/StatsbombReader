import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ value, onValueChange, children, disabled = false, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={selectRef} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            selectValue: value,
            onSelectValueChange: onValueChange,
            isOpen,
            setIsOpen,
            disabled
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger = ({ children, className = '', selectValue, isOpen, setIsOpen, disabled, ...props }) => {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => !disabled && setIsOpen(!isOpen)}
      disabled={disabled}
      {...props}
    >
      {children}
      <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

const SelectValue = ({ placeholder = 'Select...', selectValue }) => {
  return (
    <span className={selectValue ? 'text-foreground' : 'text-muted-foreground'}>
      {selectValue || placeholder}
    </span>
  );
};

const SelectContent = ({ children, className = '', isOpen, maxHeight = '200px' }) => {
  if (!isOpen) return null;
  
  return (
    <div className={`absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onSelectValueChange: child.props.onSelectValueChange
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectItem = ({ value, children, onSelectValueChange, selectValue, setIsOpen, className = '' }) => {
  const isSelected = selectValue === value;
  
  return (
    <div
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer ${
        isSelected ? 'bg-accent text-accent-foreground' : ''
      } ${className}`}
      onClick={() => {
        onSelectValueChange?.(value);
        setIsOpen?.(false);
      }}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
      {children}
    </div>
  );
};

// Wrap the SelectContent and SelectItem to pass down the props properly
const WrappedSelectContent = ({ children, className = '', isOpen, onSelectValueChange, selectValue, setIsOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className={`absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-white p-1 shadow-md ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onSelectValueChange,
            selectValue,
            setIsOpen
          });
        }
        return child;
      })}
    </div>
  );
};

// Update SelectContent to use the wrapped version
const FinalSelectContent = ({ children, className = '', isOpen, setIsOpen, onSelectValueChange, selectValue }) => {
  return (
    <WrappedSelectContent 
      isOpen={isOpen} 
      setIsOpen={setIsOpen}
      onSelectValueChange={onSelectValueChange}
      selectValue={selectValue}
      className={className}
    >
      {children}
    </WrappedSelectContent>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent: FinalSelectContent as SelectContent, SelectItem };