import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "./src/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./src/components/Card";
import Input from "./src/components/Input";
import { DataList, DataListItem } from "./src/components/DataList";

const links = [
  { icon: "phone-portrait-outline" as const, label: "Expo app", value: "localhost:8081" },
  { icon: "server-outline" as const, label: "Backend health", value: "localhost:4000/api/health" }
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.eyebrow}>Starter project</Text>
            <Text style={styles.title}>Expo + NestJS</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#166534" />
            <Text style={styles.badgeText}>Ready</Text>
          </View>
        </View>

        <Card>
          <CardHeader>
            <Text style={styles.eyebrow}>Ready structure</Text>
            <CardTitle>A clean mobile and backend workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.bodyText}>
              Start from this repo, install dependencies, and build the practical exam features
              inside the two apps.
            </Text>
          </CardContent>
        </Card>

        <DataList style={styles.linkGrid}>
          {links.map((item) => (
            <DataListItem key={item.label}>
              <Ionicons name={item.icon} size={24} color="#2563eb" />
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>{item.label}</Text>
                <Text style={styles.linkValue}>{item.value}</Text>
              </View>
            </DataListItem>
          ))}
        </DataList>

        <Card>
          <CardHeader>
            <CardTitle>Form controls</CardTitle>
          </CardHeader>
          <CardContent style={styles.form}>
            <Input label="Email" placeholder="student@example.com" keyboardType="email-address" />
            <Button>Continue</Button>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  shell: {
    gap: 18,
    padding: 20
  },
  topbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16
  },
  eyebrow: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  title: {
    color: "#0f172a",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  badgeText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "700"
  },
  bodyText: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 23
  },
  linkGrid: {
    gap: 12
  },
  linkText: {
    flex: 1,
    gap: 2
  },
  linkLabel: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700"
  },
  linkValue: {
    color: "#64748b",
    fontSize: 13
  },
  form: {
    gap: 14
  }
});
