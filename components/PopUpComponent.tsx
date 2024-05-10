import React from "react";
import {
  View,
  Text,
  Button,
  Modal,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";

interface ButtonConfig {
  title: string;
  onPress: () => void;
}

interface GenericPopupModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons: ButtonConfig[];
}

const GenericPopupModal: React.FC<GenericPopupModalProps> = ({
  visible,
  onClose,
  title,
  message,
  buttons,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <Button
                key={index}
                title={button.title}
                onPress={button.onPress}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface Styles {
  centeredView: ViewStyle;
  modalView: ViewStyle;
  modalTitle: TextStyle;
  modalMessage: TextStyle;
  buttonContainer: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalMessage: {
    marginBottom: 15,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
});

export default GenericPopupModal;
