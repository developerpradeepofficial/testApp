import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { CallAdapterOptions, useCallAdapter } from "./Call_Adapter";
import { RTCView } from "react-native-webrtc";
import Icon from "react-native-vector-icons/FontAwesome";

const Testing: React.FC = () => {
  const inmateId = "1234567890"; // Replace with actual inmate ID
  const calleeId = "1234567890"; // Replace with callee ID
  const callType = "video"; // Set the call type (e.g., "video" or "audio")
  const [localStream, setLocalStream] = useState<any | null>(null);
  const [peerStream, setPeerStream] = useState<any | null>(null);
  const [combinedMediaStream, setCombinedMediaStream] = useState<any>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handleMakeCall, handleEndCall, callAdapterRef } = useCallAdapter(
    {
      inmateId: inmateId,
      onLocalStreamAvailable: setLocalStream,
      onPeerStreamAvailable: setPeerStream,
      getCombinedMediaStream: setCombinedMediaStream,
      canvasRef: canvasRef,
      downloadVideo: false,
      recordVideo: true,
    },
    (state) => console.log("new state", state)
  );

  useEffect(() => {
    // Update local and peer streams
  }, [localStream, peerStream]);

  return (
    <View style={styles.container}>
      <View style={styles.opponentContainer}>
        {peerStream && (
          <RTCView
            streamURL={peerStream.toURL()}
            style={styles.opponentVideo}
          />
        )}
      </View>
      <View style={styles.currentContainer}>
        {localStream && (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.currentUser}
            objectFit="cover"
          />
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => {}}>
          <Icon name="microphone" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.acceptCallButton]}
          onPress={() => {
            console.log("Da");
            callAdapterRef.current?.accept();
          }}
        >
          <Icon name="phone" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.cameraSwapButton]}
          onPress={() => {
            // Handle camera swap logic here
          }}
        >
          <Icon name="camera" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={() => {
            handleEndCall();
          }}
        >
          <Icon name="phone" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
    alignItems: "stretch",
    justifyContent: "center",
    backgroundColor: "#fff",
    position: "relative",
  },
  opponentContainer: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
  },
  opponentVideo: {
    flex: 1,
  },
  currentContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUser: {
    width: 100,
    height: 150,
    backgroundColor: "#f00",
  },
  controlsContainer: {
    height: 80,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 30,
  },
  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 16, // Increase padding for roundness
    borderRadius: 40, // Make it round
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
  },
  endCallButton: {
    backgroundColor: "#FF4500",
  },
  acceptCallButton: {
    backgroundColor: "#00C250",
  },
  cameraSwapButton: {
    backgroundColor: "#007AFF", // You can change the color as per your design
  },
});

export default Testing;
