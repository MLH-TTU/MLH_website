import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 border border-transparent',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 focus:ring-indigo-500 border border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-indigo-500 border border-transparent'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${widthClass}
    ${className}
  `.trim();

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          <span>{loadingText || 'Loading...'}</span>
        </>
      );
    }

    const iconElement = icon && (
      <span className={iconPosition === 'left' ? 'mr-2' : 'ml-2'} aria-hidden="true">
        {icon}
      </span>
    );

    return (
      <>
        {iconPosition === 'left' && iconElement}
        <span>{children}</span>
        {iconPosition === 'right' && iconElement}
      </>
    );
  };

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;