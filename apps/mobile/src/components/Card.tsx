import { PropsWithChildren } from "react";
import { StyleSheet, Text, TextProps, View, ViewProps } from "react-native";

export function Card({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ children, style, ...props }: PropsWithChildren<TextProps>) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#1e293b",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  header: {
    gap: 6,
    padding: 20,
    paddingBottom: 16
  },
  title: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 28
  },
  content: {
    padding: 20,
    paddingTop: 0
  }
});
