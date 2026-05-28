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
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#0f172a",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10
  },
  header: {
    gap: 4,
    padding: 18
  },
  title: {
    color: "#0f172a",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 27
  },
  content: {
    padding: 18,
    paddingTop: 0
  }
});
