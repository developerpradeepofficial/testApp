import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons"; // Import MaterialIcons from Expo icons

type Call = {
  id: number;
  caller: string;
  type: "missed" | "received" | "dialed";
  time: string;
};

interface CallHistoryProps {
  calls: Call[];
}

const CallHistory: React.FC<CallHistoryProps> = ({ calls }) => {
  const [activeTab, setActiveTab] = useState<"missed" | "all">("missed");

  const filteredCalls =
    activeTab === "missed"
      ? calls.filter((call) => call.type === "missed")
      : calls;

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "missed" && styles.activeTab]}
          onPress={() => setActiveTab("missed")}
        >
          <MaterialIcons name="call-missed" size={24} color="red" />
          <Text style={styles.tabText}>Missed Calls</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <MaterialIcons name="call-received" size={24} color="black" />
          <Text style={styles.tabText}>All Calls</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.callList}>
        {filteredCalls.map((call) => (
          <View key={call.id} style={styles.callItem}>
            <MaterialIcons name="account-circle" size={50} color="black" />
            <View style={styles.callItemContent}>
              <Text style={styles.callerName}>{call.caller}</Text>
              <Text style={styles.callTime}>{call.time}</Text>
            </View>
            <MaterialIcons
              name={call.type === "missed" ? "call-missed" : "call-received"}
              size={24}
              color={call.type === "missed" ? "red" : "green"}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "blue",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  callList: {
    height: "100%",
    padding: 10,
  },
  callItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    gap: 10,
  },
  callItemContent: {
    flex: 1,
  },
  callerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  callTime: {
    fontSize: 14,
    color: "#666",
  },
});

export default CallHistory;
