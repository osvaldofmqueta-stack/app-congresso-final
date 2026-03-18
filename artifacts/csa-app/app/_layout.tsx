import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { CongressProvider } from "@/contexts/CongressContext";
import { EventProvider } from "@/contexts/EventContext";
import { ProgramProvider } from "@/contexts/ProgramContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  (Constants as any).appOwnership === "expo";

function AppProviders({ children }: { children: React.ReactNode }) {
  if (isExpoGo) {
    return <>{children}</>;
  }
  const { KeyboardProvider } = require("react-native-keyboard-controller");
  return <KeyboardProvider>{children}</KeyboardProvider>;
}

function BrandedSplash({ onFinish }: { onFinish: () => void }) {
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 40, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(lineWidth, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.delay(2200),
      Animated.timing(bgOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[splashStyles.container, { opacity: bgOpacity }]}>
      <View style={splashStyles.inner}>
        <Animated.View style={[splashStyles.logosRow, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Image
            source={require("@/assets/images/csa-logo.png")}
            style={splashStyles.csaLogo}
            resizeMode="contain"
          />
          <View style={splashStyles.logoDivider} />
          <Image
            source={require("@/assets/images/urnm-logo.png")}
            style={splashStyles.urnmLogo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[splashStyles.textBlock, { opacity: textOpacity }]}>
          <Animated.View style={[splashStyles.line, { transform: [{ scaleX: lineWidth }] }]} />
          <Text style={splashStyles.congressTitle}>Congresso de Alimento 2026</Text>
          <Text style={splashStyles.orgName}>Universidade Rainha Njinga a Mbande</Text>
          <Animated.View style={[splashStyles.line, { transform: [{ scaleX: lineWidth }] }]} />
        </Animated.View>

        <Animated.Text style={[splashStyles.systemLabel, { opacity: textOpacity }]}>
          Sistema de Gestão de Eventos
        </Animated.Text>
      </View>

      <Animated.Text style={[splashStyles.version, { opacity: textOpacity }]}>
        CSA · URNM · 2026
      </Animated.Text>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [splashVisible, setSplashVisible] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      setAppReady(true);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProviders>
              <CongressProvider>
                <EventProvider>
                  <ProgramProvider>
                    <AuthProvider>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="register" />
                        <Stack.Screen name="forgot-password" />
                        <Stack.Screen name="home" />
                        <Stack.Screen name="admin/index" />
                        <Stack.Screen name="admin/participant" />
                        <Stack.Screen name="conselho/index" />
                        <Stack.Screen name="profile" />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                    </AuthProvider>
                  </ProgramProvider>
                </EventProvider>
              </CongressProvider>
            </AppProviders>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
      {appReady && splashVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BrandedSplash onFinish={() => setSplashVisible(false)} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A3A6E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  inner: {
    alignItems: "center",
    gap: 28,
    flex: 1,
    justifyContent: "center",
  },
  logosRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  csaLogo: {
    width: 110,
    height: 66,
  },
  urnmLogo: {
    width: 72,
    height: 72,
  },
  logoDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  textBlock: {
    alignItems: "center",
    gap: 10,
  },
  line: {
    width: 180,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  congressTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  orgName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  systemLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  version: {
    position: "absolute",
    bottom: 40,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1,
  },
});
