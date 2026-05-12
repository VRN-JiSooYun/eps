import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: ButtonVariant;
};

export function Button({ children, className = "", iconLeft, iconRight, variant = "primary", ...props }: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-voronoi-orange text-white hover:bg-voronoi-orange/90 focus:ring-voronoi-orange shadow-sm"
      : "bg-transparent text-voronoi-gray-600 hover:text-voronoi-gray-900 focus:ring-voronoi-orange";

  return (
    <button
      className={`inline-flex items-center justify-center rounded px-8 py-3 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
      {...props}
    >
      {iconLeft ? <span className="mr-2 flex h-6 w-6 items-center justify-center">{iconLeft}</span> : null}
      <span>{children}</span>
      {iconRight ? <span className="ml-2 flex h-6 w-6 items-center justify-center">{iconRight}</span> : null}
    </button>
  );
}
