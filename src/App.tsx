import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Alert, TouchableOpacity, 
  StatusBar, Platform, ScrollView, Dimensions, AppState
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeModules } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, 
  withSequence, Easing, withSpring, FadeInDown, FadeIn, ZoomIn
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { 
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold 
} from '@expo-google-fonts/plus-jakarta-sans';

const { NotificationListenerModule } = NativeModules;
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Premium Abyssal Theme
const COLORS = {
  background: '#030305', 
  surface: 'rgba(255, 255, 255, 0.03)',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  primary: '#7c3aed', 
  primaryLight: '#a78bfa',
  accent: '#10b981', 
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  danger: '#f43f5e',
  warning: '#fbbf24',
};

const FONTS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

// Global active state manager so accelerometer and analytics can easily access it
let globalIsShieldActive = false;

// --- Shield Screen ---
const ShieldScreen = () => {
  const [isActive, setIsActive] = useState(false);
  const [warningActive, setWarningActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  
  const pulseAnim = useSharedValue(1);
  const ringRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.8);
  
  const sessionStartRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // Keep screen awake while shield is active
  useKeepAwake(isActive ? 'aura-shield' : undefined);

  useEffect(() => {
    globalIsShieldActive = isActive;
    
    if (isActive) {
      // Start Session
      sessionStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);

      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ), -1, true
      );
      ringRotate.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);

      // Accelerometer logic (Zen Motion Guardian)
      Accelerometer.setUpdateInterval(500);
      const subscription = Accelerometer.addListener(data => {
        // Calculate magnitude of acceleration vector
        const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
        // Standard gravity is ~1g. If it spikes above 1.3 or below 0.7, phone is moving significantly
        if (globalIsShieldActive && (magnitude > 1.4 || magnitude < 0.6)) {
          triggerWarning();
        }
      });
      return () => {
        subscription.remove();
        clearInterval(timerRef.current);
        pulseAnim.value = withSpring(1);
        ringRotate.value = withSpring(0);
      };
    } else {
      // End Session
      clearInterval(timerRef.current);
      setSessionTime(0);
      if (sessionStartRef.current > 0) {
        saveSession(sessionStartRef.current, Date.now());
        sessionStartRef.current = 0;
      }
      pulseAnim.value = withSpring(1);
      ringRotate.value = withSpring(0);
    }
  }, [isActive]);

  const saveSession = async (start: number, end: number) => {
    try {
      const durationSeconds = Math.floor((end - start) / 1000);
      if (durationSeconds < 10) return; // Ignore very short test sessions
      
      const existing = await AsyncStorage.getItem('@aura_sessions');
      const sessions = existing ? JSON.parse(existing) : [];
      sessions.push({ start, end, durationSeconds });
      await AsyncStorage.setItem('@aura_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  const triggerWarning = () => {
    if (warningActive) return;
    setWarningActive(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    glowOpacity.value = withSequence(
      withTiming(0.2, { duration: 100 }),
      withTiming(1, { duration: 100 }),
      withTiming(0.2, { duration: 100 }),
      withTiming(0.8, { duration: 1000 })
    );
    setTimeout(() => setWarningActive(false), 3000);
  };

  const promptPermissionAgain = () => {
    Alert.alert(
      "Unlock Your Full Potential",
      "We need this permission to understand your patterns and habits to make a better plan for you. Without it, Aura cannot block distractions effectively.",
      [
        { text: "Not Now", style: "cancel" },
        { text: "Grant Access", onPress: () => NotificationListenerModule.requestPermission() }
      ]
    );
  };

  const toggleShield = async () => {
    if (!isActive) {
      try {
        if (NotificationListenerModule) {
          const granted = await NotificationListenerModule.getPermissionStatus();
          if (!granted) {
            Alert.alert(
              "Notification Access Agreement & Privacy Notice",
              "By tapping “Allow” you enter into this Notification Access Agreement (“Agreement”) with Aura Focus Technologies (“Aura”, “we”, “us”).\n\nPURPOSE OF ACCESS\nAura requires limited notification monitoring solely to detect and temporarily silence notifications from apps you have designated as distracting during Focus Sessions. This access enables real-time filtering so that only priority or allowed notifications reach you while you work.\n\nPRIVACY & DATA PROCESSING\n• All notification content, metadata, sender information, and app identifiers are processed exclusively on-device using on-device machine learning and rule engines.\n• No notification data, personal identifiers, usage patterns, or derived insights are transmitted, uploaded, stored in the cloud, shared with third parties, or used for advertising, analytics, or profiling.\n• Aura does not retain notification content after the Focus Session ends. Temporary buffers are cleared immediately upon session completion or app termination.\n• You may revoke this permission at any time in your device Settings → Notifications → Aura. Revocation immediately disables Focus blocking features that rely on notification monitoring.\n\nLEGAL BASIS & COMPLIANCE\nThis processing is performed under your explicit consent and is consistent with applicable privacy frameworks, including the principles of data minimisation, purpose limitation, and storage limitation under GDPR, CCPA/CPRA, and similar regulations. Aura acts as a data controller solely for the on-device processing described herein.\n\nLIMITATION OF LIABILITY\nAura shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the notification filtering feature, provided the service is used in accordance with this Agreement and applicable law.\n\nBy continuing, you acknowledge that you have read, understood, and agree to the terms of this Notification Access Agreement and Privacy Notice.\n\nEffective Date: July 25, 2026\nVersion: 2.4.1-LocalOnly",
              [
                { text: "Not Now", onPress: promptPermissionAgain },
                { text: "Allow", onPress: () => NotificationListenerModule.requestPermission() }
              ]
            );
            return; // Don't start shield if no permission
          }
        }
      } catch (e) {}
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsActive(!isActive);
  };

  const animatedPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseAnim.value }] }));
  const animatedRingStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${ringRotate.value}deg` }] }));
  const animatedGlowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={warningActive ? ['#4c0519', COLORS.background] : ['#1c103f', COLORS.background]} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInDown.duration(800).delay(100)} style={styles.header}>
          <Text style={styles.headerTitle}>Aura</Text>
          <BlurView intensity={20} tint="dark" style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? (warningActive ? COLORS.danger : COLORS.accent) : COLORS.textSecondary }]} />
            <Text style={styles.statusText}>
              {isActive ? (warningActive ? 'Movement Detected' : 'Shield Active') : 'Standby'}
            </Text>
          </BlurView>
        </Animated.View>

        <View style={styles.centerContent}>
          <Animated.View style={[styles.glowRing, animatedPulseStyle, animatedGlowStyle]}>
            <Animated.View style={[StyleSheet.absoluteFillObject, animatedRingStyle]}>
               <LinearGradient 
                 colors={warningActive ? [COLORS.danger, '#ef4444', '#991b1b', COLORS.danger] : [COLORS.primary, '#3b82f6', COLORS.accent, COLORS.primary]} 
                 start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                 style={styles.gradientRing} 
               />
            </Animated.View>
            <View style={styles.timerInner}>
              <Animated.Text entering={ZoomIn.duration(800)} style={styles.timerText}>
                {isActive ? formatTime(sessionTime) : '00:00'}
              </Animated.Text>
              <Text style={styles.timerLabel}>
                {isActive ? "Deep Focus Tracking" : "Ready to Focus"}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(300)}>
            <TouchableOpacity onPress={toggleShield} activeOpacity={0.8} style={styles.actionButtonContainer}>
              <LinearGradient 
                colors={isActive ? [COLORS.danger, '#9f1239'] : [COLORS.primary, '#4c1d95']} 
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>
                  {isActive ? "Deactivate Shield" : "Activate Aura Shield"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

// --- Analytics Screen (100% Genuine Data) ---
const AnalyticsScreen = () => {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const existing = await AsyncStorage.getItem('@aura_sessions');
      if (existing) {
        const sessions = JSON.parse(existing);
        setSessionCount(sessions.length);
        const total = sessions.reduce((acc: number, curr: any) => acc + curr.durationSeconds, 0);
        setTotalSeconds(total);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Clear History", "Are you sure you want to delete your real focus history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await AsyncStorage.removeItem('@aura_sessions');
        setTotalSeconds(0);
        setSessionCount(0);
      }}
    ]);
  };

  const formatHours = (secs: number) => (secs / 3600).toFixed(1);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', COLORS.background]} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
        </Animated.View>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(600).delay(100)}>
            <BlurView intensity={40} tint="dark" style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Genuine Focus Time</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.hugeScore}>{formatHours(totalSeconds)}<Text style={styles.scoreMax}>h</Text></Text>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>Real Data</Text>
                </View>
              </View>
              <Text style={styles.infoText}>This data is 100% authentic and stored securely on your device.</Text>
            </BlurView>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
             <BlurView intensity={40} tint="dark" style={[styles.glassCard, { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
               <View>
                 <Text style={styles.statLabel}>Completed Sessions</Text>
                 <Text style={styles.statNumberSmall}>{sessionCount}</Text>
               </View>
               <View style={styles.iconCircle}>
                  <Feather name="check-circle" size={24} color={COLORS.primaryLight} />
               </View>
             </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(300)}>
            <TouchableOpacity activeOpacity={0.7} onPress={clearData} style={{marginTop: 32, alignItems: 'center'}}>
              <Text style={{color: COLORS.textSecondary, fontFamily: FONTS.medium}}>Clear History</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// --- Custom Navigation ---
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 20 }]}>
      <BlurView intensity={60} tint="dark" style={styles.tabBarBlur}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.selectionAsync();
              navigation.navigate(route.name);
            }
          };

          let iconName: any = route.name === 'Shield' ? 'shield' : 'pie-chart';

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <Animated.View style={styles.tabIconContainer}>
                <Feather name={iconName} size={24} color={isFocused ? COLORS.textPrimary : COLORS.textSecondary} />
                {isFocused && <Animated.View entering={ZoomIn} style={styles.tabDot} />}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

// --- App Entry ---
const App = () => {
  let [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    // We only prompt permission when the user actually tries to activate the shield now.
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Shield" component={ShieldScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10
  },
  headerTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    letterSpacing: -0.5
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden'
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontFamily: FONTS.semiBold, color: COLORS.textPrimary, fontSize: 12 },
  
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80
  },
  glowRing: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  gradientRing: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    opacity: 0.8
  },
  timerInner: {
    position: 'absolute',
    width: width * 0.76,
    height: width * 0.76,
    borderRadius: width * 0.38,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  timerText: {
    fontFamily: FONTS.regular,
    fontSize: 76,
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -2
  },
  timerLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 3
  },
  
  actionButtonContainer: {
    borderRadius: 99,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  actionButtonGradient: {
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  actionButtonText: {
    fontFamily: FONTS.bold,
    color: '#fff',
    fontSize: 17,
    letterSpacing: 0.5,
    textAlign: 'center'
  },

  scrollContent: { padding: 24, paddingBottom: 140 },
  glassCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  hugeScore: { fontFamily: FONTS.regular, fontSize: 64, color: COLORS.textPrimary, letterSpacing: -2 },
  scoreMax: { fontFamily: FONTS.medium, fontSize: 24, color: COLORS.textSecondary },
  scoreBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  scoreBadgeText: { fontFamily: FONTS.bold, color: COLORS.accent, fontSize: 13, letterSpacing: 0.5 },
  infoText: { fontFamily: FONTS.regular, color: COLORS.textSecondary, fontSize: 15, lineHeight: 24 },
  
  statNumberSmall: { fontFamily: FONTS.medium, fontSize: 32, color: COLORS.textPrimary, marginBottom: 4 },
  statLabel: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary },

  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tabBarBlur: {
    flexDirection: 'row',
    height: 70,
    width: '60%',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 15, 0.4)',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textPrimary,
    marginTop: 6,
    position: 'absolute',
    bottom: -10
  }
});

export default App;