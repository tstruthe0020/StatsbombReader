import React from 'react';

const Tabs = ({ value, onValueChange, children, className = '' }) => {
  return (
    <div className={`w-full ${className}`} data-value={value}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { tabsValue: value, onTabsValueChange: onValueChange }) : child
      )}
    </div>
  );
};

const TabsList = ({ children, className = '', tabsValue, onTabsValueChange }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 ${className}`}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { tabsValue, onTabsValueChange }) : child
      )}
    </div>
  );
};

const TabsTrigger = ({ value, children, className = '', tabsValue, onTabsValueChange, ...props }) => {
  const isActive = tabsValue === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white text-blue-600 shadow-sm border border-gray-200' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      } ${className}`}
      onClick={() => onTabsValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, className = '', tabsValue, ...props }) => {
  const isActive = tabsValue === value;
  
  if (!isActive) return null;
  
  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };