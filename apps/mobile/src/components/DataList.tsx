import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

export function DataList({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View style={[styles.list, style]} {...props}>
      {children}
    </View>
  );
}

export function DataListItem({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View style={[styles.item, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%"
  },
  item: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 72,
    padding: 16
  }
});
