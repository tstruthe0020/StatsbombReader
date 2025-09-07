import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Simple HTML select-based component for better reliability
const Select = ({ value, onValueChange, children, disabled = false, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
};

const SelectTrigger = ({ children, className = '' }) => {
  // This is now handled by the native select, but keeping for API compatibility
  return <div className={className}>{children}</div>;
};

const SelectValue = ({ placeholder = 'Select...' }) => {
  // This is now handled by the native select, but keeping for API compatibility
  return <option value="" disabled>{placeholder}</option>;
};

const SelectContent = ({ children, className = '' }) => {
  // This is now handled by the native select, but keeping for API compatibility
  return <div className={className}>{children}</div>;
};

const SelectItem = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };