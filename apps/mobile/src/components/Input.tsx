import { forwardRef } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Input = forwardRef<TextInput, InputProps>(({ error, label, style, ...props }, ref) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#94a3b8"
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

Input.displayName = "Input";

export default Input;

const styles = StyleSheet.create({
  wrapper: {
    width: "100%"
  },
  label: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.2
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 2,
    color: "#0f172a",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2"
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    letterSpacing: 0.2
  }
});
