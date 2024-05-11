import React, { useState } from "react";
import Axios from "axios";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

const LoginPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const url = process.env.EXPO_PUBLIC_DB_URL ?? "http://192.168.1.101:5001";
  const handleRegister = async () => {
    try {
      // Make the HTTP request using Axios
      const response = await Axios.put(`${url}/admin/inmate/relative`, {
        phoneNumber: phoneNumber,
        fcmToken: "",
      });

      // Check the status code of the response
      if (response.status === 200) {
        // Registration successful
        console.log("Registration successful:", response.data);
        Alert.alert("Registration successful");
      } else {
        // Registration failed
        console.log("Registration failed:", response.data);
        Alert.alert("Registration failed");
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error("Error registering:", error);
      Alert.alert("Error registering. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Your Logo</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Phone Number"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: "blue",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  registerButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default LoginPage;
function axios(url: string, arg1: { method: string; body: string }) {
  throw new Error("Function not implemented.");
}
