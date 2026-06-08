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
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  primary: {
    backgroundColor: "#6366f1"
  },
  secondary: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  danger: {
    backgroundColor: "#ef4444"
  },
  ghost: {
    backgroundColor: "transparent"
  },
  sm: {
    minHeight: 38,
    paddingHorizontal: 14
  },
  md: {
    minHeight: 48,
    paddingHorizontal: 20
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: 24
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    opacity: 0.5
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  primaryLabel: {
    color: "#ffffff"
  },
  secondaryLabel: {
    color: "#334155"
  },
  dangerLabel: {
    color: "#ffffff"
  },
  ghostLabel: {
    color: "#475569"
  }
});
