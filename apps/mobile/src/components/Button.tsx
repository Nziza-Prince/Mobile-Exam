import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text } from "react-native";

interface ButtonProps extends PressableProps {
  children: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export default function Button({
  children,
  disabled,
  isLoading,
  size = "md",
  style,
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const labelStyles = {
    primary: styles.primaryLabel,
    secondary: styles.secondaryLabel,
    danger: styles.dangerLabel,
    ghost: styles.ghostLabel
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === "function" ? style({ pressed }) : style
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? "#1f2937" : "#ffffff"} />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center"
  },
  primary: {
    backgroundColor: "#2563eb"
  },
  secondary: {
    backgroundColor: "#e5e7eb"
  },
  danger: {
    backgroundColor: "#dc2626"
  },
  ghost: {
    backgroundColor: "transparent"
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: 12
  },
  md: {
    minHeight: 44,
    paddingHorizontal: 16
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: 20
  },
  pressed: {
    opacity: 0.86
  },
  disabled: {
    opacity: 0.5
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0
  },
  primaryLabel: {
    color: "#ffffff"
  },
  secondaryLabel: {
    color: "#111827"
  },
  dangerLabel: {
    color: "#ffffff"
  },
  ghostLabel: {
    color: "#374151"
  }
});
