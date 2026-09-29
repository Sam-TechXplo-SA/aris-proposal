type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

interface BadgeProps {
  variant?: BadgeVariant; // Light or solid variant
  size?: BadgeSize; // Badge size
  color?: BadgeColor; // Badge color
  startIcon?: React.ReactNode; // Icon at the start
  endIcon?: React.ReactNode; // Icon at the end
  children: React.ReactNode; // Badge content
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-1 rounded-md font-medium whitespace-nowrap ring-1 ring-inset";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-theme-xs",
    md: "px-2.5 py-1 text-theme-xs",
  };

  // Soft tinted chips with a hairline ring — reads as a status, not a button.
  const variants = {
    light: {
      primary: "bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-400/20",
      success: "bg-success-50 text-success-700 ring-success-600/20 dark:bg-success-500/15 dark:text-success-400 dark:ring-success-400/20",
      error: "bg-error-50 text-error-700 ring-error-600/15 dark:bg-error-500/15 dark:text-error-400 dark:ring-error-400/20",
      warning: "bg-warning-50 text-warning-700 ring-warning-600/20 dark:bg-warning-500/15 dark:text-warning-300 dark:ring-warning-400/20",
      info: "bg-blue-light-50 text-blue-light-700 ring-blue-light-600/20 dark:bg-blue-light-500/15 dark:text-blue-light-300 dark:ring-blue-light-400/20",
      light: "bg-gray-50 text-gray-700 ring-gray-500/15 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
      dark: "bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10",
    },
    solid: {
      primary: "bg-brand-500 text-white ring-transparent",
      success: "bg-success-500 text-white ring-transparent",
      error: "bg-error-500 text-white ring-transparent",
      warning: "bg-warning-500 text-white ring-transparent",
      info: "bg-blue-light-500 text-white ring-transparent",
      light: "bg-gray-400 text-white ring-transparent dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-700 text-white ring-transparent",
    },
  };

  // Get styles based on size and color variant
  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="me-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ms-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
