import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type ErrorType = "none" | "network" | "404" | "500" | "timeout" | "slow";

interface NetworkErrorTesterProps {
  onErrorTypeChange: (errorType: ErrorType) => void;
}

/**
 * NetworkErrorTester Component
 * 
 * A developer tool component to test different network error scenarios.
 * Add this component temporarily to your app during testing.
 * 
 * Usage:
 * ```tsx
 * import NetworkErrorTester from './src/components/NetworkErrorTester';
 * 
 * // In your component:
 * const [errorType, setErrorType] = useState<ErrorType>("none");
 * 
 * // In your network request:
 * if (errorType === "network") throw new Error("Network error");
 * if (errorType === "404") throw { response: { status: 404 } };
 * // etc.
 * 
 * // In your JSX:
 * <NetworkErrorTester onErrorTypeChange={setErrorType} />
 * ```
 */
export default function NetworkErrorTester({ onErrorTypeChange }: NetworkErrorTesterProps) {
  const [selectedError, setSelectedError] = useState<ErrorType>("none");

  const errorScenarios: { type: ErrorType; label: string; description: string; color: string }[] = [
    {
      type: "none",
      label: "Normal",
      description: "No errors",
      color: "#10b981"
    },
    {
      type: "network",
      label: "Network Error",
      description: "No internet connection",
      color: "#ef4444"
    },
    {
      type: "404",
      label: "404 Not Found",
      description: "Resource doesn't exist",
      color: "#f59e0b"
    },
    {
      type: "500",
      label: "500 Server Error",
      description: "Internal server error",
      color: "#dc2626"
    },
    {
      type: "timeout",
      label: "Timeout",
      description: "Request takes too long",
      color: "#8b5cf6"
    },
    {
      type: "slow",
      label: "Slow Network",
      description: "3 second delay",
      color: "#6366f1"
    }
  ];

  function handleSelectError(errorType: ErrorType) {
    setSelectedError(errorType);
    onErrorTypeChange(errorType);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Network Error Tester</Text>
      <Text style={styles.subtitle}>Select an error scenario to test</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.buttonContainer}>
          {errorScenarios.map((scenario) => (
            <Pressable
              key={scenario.type}
              accessibilityRole="button"
              style={[
                styles.button,
                { borderColor: scenario.color },
                selectedError === scenario.type && { backgroundColor: scenario.color }
              ]}
              onPress={() => handleSelectError(scenario.type)}
            >
              <Text
                style={[
                  styles.buttonLabel,
                  { color: selectedError === scenario.type ? "#ffffff" : scenario.color }
                ]}
              >
                {scenario.label}
              </Text>
              <Text
                style={[
                  styles.buttonDescription,
                  { color: selectedError === scenario.type ? "#ffffff" : "#64748b" }
                ]}
              >
                {scenario.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {selectedError !== "none" && (
        <Text style={styles.activeNote}>
          ⚠️ Error simulation active: <Text style={styles.activeType}>{selectedError}</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef3c7",
    borderColor: "#fbbf24",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#92400e",
    letterSpacing: 0.3
  },
  subtitle: {
    fontSize: 14,
    color: "#78350f",
    fontWeight: "600"
  },
  scrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10
  },
  button: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    minWidth: 140,
    gap: 4
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  buttonDescription: {
    fontSize: 11,
    fontWeight: "600"
  },
  activeNote: {
    fontSize: 13,
    color: "#92400e",
    fontWeight: "700",
    textAlign: "center"
  },
  activeType: {
    fontWeight: "900",
    textTransform: "uppercase"
  }
});
