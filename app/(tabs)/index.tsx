import React, { useState, useEffect } from 'react';
import { BackHandler, Platform, Share, View, Text, Image, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';

import Dashboard from './_Dashboard';
import RecipeDetailComponent from './_RecipeDetail';
import SplashScreenComponent from './_SplashScreen';
import { RecipeService } from './_api';
import {
  getSafeImageUri,
  getIngredientList,
} from './_utils';
import { Meal } from '../_types';
import { styles, colors } from '../../components/appStyles';

export default function App() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [allMealsCache, setAllMealsCache] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [sortOption, setSortOption] = useState<'name' | 'rating'>('name');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [view, setView] = useState<'intro' | 'dashboard' | 'detail' | 'favorites'>('intro');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const loadMeals = async (query = '') => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const fetched = await RecipeService.fetchMeals(query);
      setMeals(fetched);
      setAllMealsCache((prev) => {
        const merged = [...prev];
        fetched.forEach((meal) => {
          if (!merged.some((item) => item.idMeal === meal.idMeal)) {
            merged.push(meal);
          }
        });
        return merged;
      });
    } catch (fetchError) {
      setError('Unable to fetch recipes. Please check your internet connection.');
      console.error(fetchError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        console.warn('SplashScreen lock failed', e);
      }

      await loadMeals('');

      setTimeout(async () => {
        setIsAppReady(true);
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('SplashScreen hide failed', e);
        }
      }, 800);
    };

    prepare();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (view === 'detail') {
        Haptics.selectionAsync();
        setView('dashboard');
        setSelectedMeal(null);
        setCurrentStep(0);
        return true;
      }

      if (view === 'dashboard') {
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [view]);

  // ✅ FIXED SEARCH HANDLER
  const handleSearch = () => {
    if (loading) return;

    const query = searchQuery.trim();

    if (!query) {
      loadMeals('');
      return;
    }

    loadMeals(query);
  };

  const openMealDetail = async (meal: Meal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMeal(meal);
    setCurrentStep(0);
    setView('detail');

    if (!meal.strInstructions || meal.strInstructions.trim().length === 0) {
      const detail = await RecipeService.fetchMealDetail(meal.idMeal);
      if (detail) {
        setSelectedMeal({ ...detail, strCategory: detail.strCategory || meal.strCategory });
      }
    }
  };

  const closeMealDetail = () => {
    Haptics.selectionAsync();
    setView('dashboard');
    setSelectedMeal(null);
    setCurrentStep(0);
  };

  const handleShare = async () => {
    if (!selectedMeal) return;

    const ingredientText = getIngredientList(selectedMeal)
      .map((p) => (p.measure ? `${p.measure} ${p.ingredient}` : p.ingredient))
      .join('\n');

    try {
      await Share.share({
        message: `${selectedMeal.strMeal}\n\nIngredients:\n${ingredientText}\n\nInstructions:\n${selectedMeal.strInstructions}`,
        title: selectedMeal.strMeal,
      });
    } catch (shareError) {
      console.warn('Share failed', shareError);
    }
  };

  const onRefresh = async () => {
    if (loading || refreshing) return;
    setRefreshing(true);
    await loadMeals(searchQuery);
  };

  const mealsIncludingFavoriteCache = showFavoritesOnly
    ? [...meals, ...allMealsCache.filter((meal) => favorites.includes(meal.idMeal) && !meals.some((m) => m.idMeal === meal.idMeal))]
    : meals;

  const sortedMeals = mealsIncludingFavoriteCache;

  if (!isAppReady || view === 'intro') {
    return <SplashScreenComponent isAppReady={isAppReady} view={view} onContinue={() => setView('dashboard')} />;
  }

  if (view === 'favorites') {
    return (
      <FavoritesScreen
        meals={meals}
        favorites={favorites}
        ratings={ratings}
        onToggleFavorite={(idMeal) => setFavorites((prev) => (prev.includes(idMeal) ? prev.filter((id) => id !== idMeal) : [...prev, idMeal]))}
        onSetRating={(idMeal, rating) => setRatings((prev) => ({ ...prev, [idMeal]: rating }))}
        onOpenMealDetail={openMealDetail}
        onBack={() => {
          setView('dashboard');
          setShowFavoritesOnly(false);
        }}
      />
    );
  }

  if (view === 'detail' && selectedMeal) {
    return (
      <RecipeDetailComponent
        selectedMeal={selectedMeal}
        onClose={closeMealDetail}
        onShare={handleShare}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
    );
  }

  return (
    <Dashboard
      meals={sortedMeals}
      loading={loading}
      refreshing={refreshing}
      error={error}
      searchQuery={searchQuery}
      categoryFilter={categoryFilter}
      favorites={favorites}
      ratings={ratings}
      sortOption={sortOption}
      showFavoritesOnly={showFavoritesOnly}
      onSearchQueryChange={setSearchQuery}
      onHandleSearch={handleSearch} // ✅ FIXED
      onRefresh={onRefresh}
      onToggleFavorite={(idMeal) => setFavorites((prev) => (prev.includes(idMeal) ? prev.filter((id) => id !== idMeal) : [...prev, idMeal]))}
      onSetRating={(idMeal, rating) => setRatings((prev) => ({ ...prev, [idMeal]: rating }))}
      onOpenMealDetail={openMealDetail}
      onSetCategoryFilter={setCategoryFilter}
      onOpenFavorites={() => {
        setView('favorites');
        setShowFavoritesOnly(true);
      }}
      onChangeSortOption={() => setSortOption((prev) => (prev === 'name' ? 'rating' : 'name'))}
    />
  );
}
interface FavoritesScreenProps {
  meals: Meal[];
  favorites: string[];
  ratings: Record<string, number>;
  onToggleFavorite: (idMeal: string) => void;
  onSetRating: (idMeal: string, rating: number) => void;
  onOpenMealDetail: (meal: Meal) => void;
  onBack: () => void;
}

function FavoritesScreen({
  meals,
  favorites,
  ratings,
  onToggleFavorite,
  onSetRating,
  onOpenMealDetail,
  onBack,
}: FavoritesScreenProps) {
  const favoriteMeals = meals.filter((meal) => favorites.includes(meal.idMeal));
  const filteredMeals = favoriteMeals; // Always show all favorites (no category filtering)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.dashboardContainer}
    >
      <View style={styles.dashboardHeader}>
  <TouchableOpacity onPress={onBack} style={styles.backButtonFull}>
    <Text style={styles.backButtonText}>← Back</Text>
  </TouchableOpacity>

  <Text style={styles.dashboardTitleCentered}>
    My Favorites
  </Text>
</View>

      {favoriteMeals.length === 0 ? (
        <View style={styles.noFavoritesContainer}>
          <View style={styles.noFavoritesMessage}>
            <Text style={styles.noFoodText}>No favorite recipes yet.</Text>
            <Text style={styles.noFoodSubText}>Add favorites from recipe cards.</Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.favoritesOverview}>
  <Text style={styles.favoritesTitle}>Your Favorites</Text>
  <Text style={styles.favoriteCountText}>
    {favoriteMeals.length} saved recipes
  </Text>
</View>

          <FlatList
            data={filteredMeals}
            keyExtractor={(item) => item.idMeal}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyLabel}>No favorites under that category.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.trendCard}
                onPress={() => onOpenMealDetail(item)}
              >
                <Image
                  source={{ uri: getSafeImageUri(item.strMealThumb) }}
                  style={styles.trendImage}
                />
                <TouchableOpacity
                  style={styles.favoriteBadge}
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.idMeal);
                  }}
                >
                  <Text style={[styles.favoriteText, styles.favoriteTextActive]}>♥</Text>
                </TouchableOpacity>
                <View style={styles.trendOverlay} />
                <View style={styles.trendLabelContainer}>
                  <Text style={styles.trendTitle} numberOfLines={2} ellipsizeMode="tail">
                    {item.strMeal}
                  </Text>
                  <View style={styles.trendRatingRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={`${item.idMeal}-fav-star-${star}`}
                        onPress={(e) => {
                          e.stopPropagation();
                          onSetRating(item.idMeal, star);
                        }}
                        style={styles.trendStarButton}
                      >
                        <Text
                          style={[(ratings[item.idMeal] || 0) >= star ? styles.starActive : styles.starInactive, styles.trendStar]}
                        >
                          {(ratings[item.idMeal] || 0) >= star ? '★' : '☆'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </ScrollView>
  );
}

