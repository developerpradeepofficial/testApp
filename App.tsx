import React, { useEffect, useState } from "react";
import { View, Text, Button, PermissionsAndroid } from "react-native";
import CallScreen from "./components/CallScreen";
import {
  getFcmToken,
  notificationListener,
  requestUserPermission,
} from "./components/getToken";
import CallHistory from "./components/CallHistory";
import LoginPage from "./components/Login";

const App: React.FC = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string>();
  useEffect(() => {
    console.log("Newly Generated FCM Token", generatedToken);
  }, [generatedToken]);
  useEffect(() => {
    const fetchToken = async () => {
      const token = await getFcmToken();
      if (token) {
        setGeneratedToken(token);
      }
    };

    void fetchToken();

    void requestUserPermission();
    void notificationListener(() => {
      console.log("Data is Comming");
    });
  }, []);
  const requestPermissions = async () => {
    try {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );

      const micGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
      );
      if (
        cameraGranted === PermissionsAndroid.RESULTS.GRANTED &&
        micGranted === PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log("Camera and microphone permissions granted");
        setPermissionsGranted(true);
      } else {
        console.log("Camera and/or microphone permissions denied");
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  return (
    <View>
      {permissionsGranted ? (
        <>
          {/* <Button title="Send Message" onPress={sendMessage} />
          <Button title="Connect Socket" onPress={connectSocket} /> */}
          <LoginPage />
        </>
      ) : (
        <Text>Requesting permissions...</Text>
      )}
    </View>
  );
};

export default App;
