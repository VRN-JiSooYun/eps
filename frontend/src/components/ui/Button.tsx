import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "ghost";

type ButtonProps = Omit<AntButtonProps, "htmlType" | "icon" | "type" | "variant"> & {
  children: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
};

export function Button({ children, className = "", iconLeft, iconRight, type = "button", variant = "primary", ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "eps-ant-primary-button" : "eps-ant-ghost-button";

  return (
    <AntButton
      className={`inline-flex min-h-11 items-center justify-center rounded px-8 py-3 font-medium ${variantClass} ${className}`}
      htmlType={type}
      type={variant === "primary" ? "primary" : "text"}
      {...props}
    >
      {iconLeft ? <span className="mr-2 flex h-6 w-6 items-center justify-center">{iconLeft}</span> : null}
      <span>{children}</span>
      {iconRight ? <span className="ml-2 flex h-6 w-6 items-center justify-center">{iconRight}</span> : null}
    </AntButton>
  );
}
