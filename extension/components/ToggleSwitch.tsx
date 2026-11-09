import React from 'react';

interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
}) => {
  const switchWidth = size === 'sm' ? 'w-8 h-4.5' : 'w-10 h-5.5';
  const knobSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const translateClass = size === 'sm' 
    ? (checked ? 'translate-x-3.5' : 'translate-x-0.5')
    : (checked ? 'translate-x-4.5' : 'translate-x-0.5');

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 py-1">
      {label && (
        <div className="flex flex-col flex-1 cursor-pointer" onClick={handleClick}>
          <span className={`text-[13px] font-medium leading-tight ${disabled ? 'text-content-muted' : 'text-content-main'}`}>
            {label}
          </span>
          {description && (
            <span className="text-[11px] text-content-secondary mt-0.5 leading-snug">
              {description}
            </span>
          )}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-brand-500' : 'bg-surface-border-strong'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${switchWidth}`}
        style={{
          width: size === 'sm' ? '32px' : '40px',
          height: size === 'sm' ? '18px' : '22px',
        }}
      >
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out`}
          style={{
            width: size === 'sm' ? '14px' : '18px',
            height: size === 'sm' ? '14px' : '18px',
            transform: checked
              ? (size === 'sm' ? 'translateX(15px)' : 'translateX(19px)')
              : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );
};
