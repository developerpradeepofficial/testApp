import React, { useEffect, useState } from "react";
import { View, Text, Button, PermissionsAndroid } from "react-native";
import CallScreen from "./components/CallScreen";
import {
  getFcmToken,
  notificationListener,
  requestUserPermission,
} from "./components/getToken";
import { firebase } from "@react-native-firebase/messaging";
const firebaseConfig = {
  apiKey: "AIzaSyCUPrza1_mR2PbEZunjgtvx_WGu6PDeVPE",
  authDomain: "prisonnotifyservice.firebaseapp.com",
  projectId: "prisonnotifyservice",
  storageBucket: "prisonnotifyservice.appspot.com",
  messagingSenderId: "103967861584",
  appId: "1:103967861584:web:0494e3f82f4f3677c39a55",
  measurementId: "G-66CNXWRJ63",
};
const App: React.FC = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string>();
  firebase.initializeApp(firebaseConfig);
  useEffect(() => {
    console.log("newly generated", generatedToken);
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
    void notificationListener();
  }, []);
  const requestPermissions = async () => {
    try {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      const micGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
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
          <CallScreen />
        </>
      ) : (
        <Text>Requesting permissions...</Text>
      )}
    </View>
  );
};

export default App;
