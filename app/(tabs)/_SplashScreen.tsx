import React from 'react';
import { ImageBackground, View, Text, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { styles } from '../../components/appStyles';

interface SplashScreenProps {
  isAppReady: boolean;
  view: 'intro' | 'dashboard' | 'detail' | 'favorites';
  onContinue: () => void;
}

export const SplashScreen = ({ isAppReady, view, onContinue }: SplashScreenProps) => {
  if (!isAppReady) {
    return (
      <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1400&q=80' }} style={styles.fullScreen}>
        <View style={styles.introOverlay} />
        <View style={styles.splashScreenContainer}>
          <Text style={styles.splashTitle}>Cook Like a Chef</Text>
          <Text style={styles.splashSubtitle}>Delicious meals are waiting for you</Text>
          <ActivityIndicator size="large" color="#F58C00" style={{ marginTop: 30 }} />
        </View>
      </ImageBackground>
    );
  }

  if (view === 'intro') {
    return (
      <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80' }} style={styles.fullScreen}>
        <View style={styles.introOverlay} />
        <SafeAreaView style={styles.introContent}>
          <Text style={styles.introBigTitle}>Cook Like a Chef</Text>
          <Text style={styles.introText}>Get personalized recipes, tips, and step-by-step cooking guidance</Text>
          <TouchableOpacity style={styles.getStartedBtn} onPress={onContinue}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return null;
};

export default SplashScreen;
