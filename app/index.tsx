import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import {
  AppState,
  Linking,
  StyleSheet,
  View,
  Text,
  Button,
  Alert,
} from "react-native";
import { Overlay } from "./overlay";
import { useState, useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";

export default function Index() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const isFocused = useIsFocused();
  const [isF, setIsF] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
        setIsF(true);
      }
      appState.current = nextAppState;
    });

    console.log(isFocused);

    return () => {
      subscription.remove();
    };
  }, []);

  const AsyncAlert = (title: any, message: any) => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: "OK",
            onPress: () => resolve("OK"),
          },
        ],
        {
          cancelable: false,
        }
      );
    });
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Flash QR behöver åtkomst till kameran
        </Text>
        <Button onPress={requestPermission} title="Tillåt åtkomst" />
      </View>
    );
  }

  if (!isF) {
    return <View style={styles.container}></View>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => {
          if (data && !qrLock.current) {
            qrLock.current = true;
            setTimeout(async () => {
              try {
                const canOpen = await Linking.canOpenURL(data);
                if (canOpen) {
                  await Linking.openURL(data);
                  setIsF(false);
                } else {
                  await AsyncAlert(
                    "Ogiltig URL",
                    "Kan inte öppna URL: " + data
                  );
                  qrLock.current = false;
                }
              } catch (error) {
                setIsF(false);
                await AsyncAlert("Oväntat fel", "Felmeddelande: " + data);
                setIsF(true);

                console.log(error);
                return null;
              }
            }, 500);
          }
        }}
      ></CameraView>
      <Overlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "white",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});
