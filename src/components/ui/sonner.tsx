import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  // Prosty fallback na dark theme dla naszej aplikacji
  const theme = "dark" as ToasterProps["theme"];

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        style: {
          background: "var(--color-neutral-900)",
          border: "1px solid var(--color-neutral-700)",
          color: "var(--color-neutral-200)",
        },
        classNames: {
          success: "success-toast",
          error: "error-toast",
          info: "info-toast",
          warning: "warning-toast",
        },
      }}
      style={
        {
          "--normal-bg": "var(--color-neutral-900)",
          "--normal-text": "var(--color-neutral-200)",
          "--normal-border": "var(--color-neutral-700)",
          "--success-bg": "var(--color-neutral-900)",
          "--success-text": "#2dd282",
          "--success-border": "#2dd282",
          "--error-bg": "var(--color-neutral-900)",
          "--error-text": "#d44a84",
          "--error-border": "#d44a84",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
