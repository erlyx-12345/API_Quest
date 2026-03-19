import { SafeAreaView } from 'react-native';
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Meal } from '../_types';
import { getSafeImageUri } from './_utils';
import { styles, colors } from '../../components/appStyles';

interface DashboardProps {
  meals: Meal[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  searchQuery: string;
  categoryFilter: string;
  favorites: string[];
  ratings: Record<string, number>;
  sortOption: 'name' | 'rating';
  showFavoritesOnly: boolean;
  onSearchQueryChange: (value: string) => void;
onHandleSearch: (query?: string) => void;
  onRefresh: () => void;
  onToggleFavorite: (idMeal: string) => void;
  onSetRating: (idMeal: string, rating: number) => void;
  onOpenMealDetail: (meal: Meal) => void;
  onSetCategoryFilter: (value: string) => void;
  onOpenFavorites: () => void;
  onChangeSortOption: () => void;
}

export default function Dashboard({
  meals,
  loading,
  refreshing,
  error,
  searchQuery,
  categoryFilter,
  favorites,
  ratings,
  sortOption,
  showFavoritesOnly,
  onSearchQueryChange,
  onHandleSearch,
  onRefresh,
  onToggleFavorite,
  onSetRating,
  onOpenMealDetail,
  onSetCategoryFilter,
  onOpenFavorites,
  onChangeSortOption,
}: DashboardProps) {

  const availableCategories = Array.from(
    new Set(meals.map((m) => m.strCategory))
  ).sort((a, b) => a.localeCompare(b));

  const categoryCounts: Record<string, number> = meals.reduce((acc, meal) => {
    const cat = meal.strCategory || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = ['All', ...availableCategories];

  const getCategoryCount = (category: string) => {
    if (showFavoritesOnly) {
      if (category === 'All') {
        return favorites.length;
      }
      return meals.filter(
        (meal) => meal.strCategory === category && favorites.includes(meal.idMeal)
      ).length;
    }

    if (category === 'All') return meals.length;
    return categoryCounts[category] || 0;
  };

  const getMealsByCategory = (category: string) => {
    if (showFavoritesOnly) {
      return meals.filter((meal) => favorites.includes(meal.idMeal));
    }

    if (category === 'All') return meals;
    return meals.filter((meal) => meal.strCategory === category);
  };

  const categorySelected = getMealsByCategory(categoryFilter);

  const favoritesFiltered = showFavoritesOnly
    ? categorySelected
    : categorySelected;

  const sortedMeals = [...favoritesFiltered].sort((a, b) => {
    if (sortOption === 'rating') {
      return (
        (ratings[b.idMeal] || 0) -
          (ratings[a.idMeal] || 0) ||
        a.strMeal.localeCompare(b.strMeal)
      );
    }
    return a.strMeal.localeCompare(b.strMeal);
  });

  const filteredMeals = sortedMeals;

  const noFavorites = showFavoritesOnly && favorites.length === 0;
  const noFood = !loading && !error && filteredMeals.length === 0;

  const justForYouMeals = filteredMeals.slice(0, 3);
  const allCategoryMeals = filteredMeals;

 if (loading) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={colors.orange} />
        <Text style={styles.centeredLoaderText}>
          Refreshing
        </Text>
      </View>
    </SafeAreaView>
  );
}

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.dashboardContainer,
        noFood && styles.noFoodContainer,
      ]}
      scrollEnabled={!noFood}
      refreshControl={
        !loading ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.orange}
          />
        ) : undefined
      }
    >
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Discover Best Recipes</Text>
        <Text style={styles.dashboardSubtitle}>
          The freshest inspiration for every meal
        </Text>
      </View>

      {refreshing && (
        <View style={styles.refreshingBanner}>
          <Text style={styles.refreshingBannerText}>Updating recipes...</Text>
        </View>
      )}

      <View style={styles.searchRow}>
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor="#88a1b0"
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            returnKeyType="search"
            onSubmitEditing={() => onHandleSearch()}            
            underlineColorAndroid="transparent"  
          />

          {searchQuery.length > 0 && (
  <TouchableOpacity
    style={styles.searchClearBtn}
    onPress={() => {
      onSearchQueryChange('');
      onSetCategoryFilter('All');
      onHandleSearch(''); // 🔥 THIS IS THE KEY FIX
    }}
  >
    <Text style={styles.searchClearText}>×</Text>
  </TouchableOpacity>
)}

        <TouchableOpacity
  style={styles.searchBtn}
  onPress={() => onHandleSearch()}
>
  <Text style={styles.searchBtnText}>Go</Text>
</TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.favoriteIconBtn,
            showFavoritesOnly && styles.favoriteIconBtnActive,
          ]}
          onPress={onOpenFavorites}
          accessibilityLabel="Go to favorites"
        >
          <Text
            style={[
              styles.favoriteIconText,
              showFavoritesOnly && styles.favoriteIconTextActive,
            ]}
          >
            ♥
          </Text>
        </TouchableOpacity>
      </View>

      {/* removed the old sort button as requested */}
      <View style={styles.dashboardControls} />

      {!showFavoritesOnly && (
        <>
          <Text style={styles.sectionTitle}>Choose a Category</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  categoryFilter === category && styles.categoryChipActive,
                ]}
                onPress={() => onSetCategoryFilter(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryFilter === category && styles.categoryChipTextActive,
                  ]}
                >
                  {category} ({getCategoryCount(category)})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {categoryFilter !== 'All' && (
            <View style={styles.filterSummaryContainer}>
              <Text style={styles.filterSummaryText}>
                Showing {filteredMeals.length} meals for {categoryFilter}
              </Text>
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => onSetCategoryFilter('All')}
              >
                <Text style={styles.clearFilterText}>Clear Filter</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {noFood ? (
        noFavorites ? (
          <View style={styles.noFavoritesContainer}>
            <Text style={[styles.sectionSubtitle, { marginBottom: 6, color: colors.orange }]}>Favorites is empty right now</Text>
            <View style={styles.noFavoritesMessage}>
              <Text style={styles.noFoodText}>
                No favorite recipes yet.
              </Text>
              <Text style={styles.noFoodSubText}>
                Tap the heart icon on a recipe to add it to favorites.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.noFoodContainer, styles.noFoodContainerCentered]}>
            <View style={styles.noFoodPlaceholder}>
              <Text style={styles.noFoodText}>
                No recipes found for {categoryFilter}.
              </Text>
              <Text style={styles.noFoodSubText}>
                Choose another category or search term to see meals.
              </Text>
            </View>
          </View>
        )
      ) : (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Just For You</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.justForYouScroll}
            contentContainerStyle={styles.justForYouScrollContent}
          >
            {justForYouMeals.map((item) => {
              const mealRating = ratings[item.idMeal] || 0;

              return (
                <TouchableOpacity
                  key={item.idMeal}
                  style={styles.smallCard}
                  onPress={() => onOpenMealDetail(item)}
                >
                  <Image
                    source={{
                      uri: getSafeImageUri(item.strMealThumb),
                    }}
                    style={styles.smallCardImage}
                  />

                  <View style={styles.smallCardTextArea}>
                    <Text
                      style={styles.smallCardText}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.strMeal}
                    </Text>

                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={`${item.idMeal}-star-${star}`}
                          onPress={() =>
                            onSetRating(item.idMeal, star)
                          }
                          style={styles.starButton}
                        >
                          <Text
                            style={[
                              styles.star,
                              mealRating >= star
                                ? styles.starActive
                                : styles.starInactive,
                            ]}
                          >
                            {mealRating >= star ? '★' : '☆'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.cardChevron}>›</Text>
                </TouchableOpacity>
              );
            })}

            {!justForYouMeals.length && (
              <Text style={styles.emptyLabel}>
                No recipe suggestions yet
              </Text>
            )}
          </ScrollView>

          <View style={styles.sectionHeaderRow}>
  <Text style={styles.sectionTitle}>
    {categoryFilter === 'All'
      ? 'All Recipes'
      : `${categoryFilter} Recipes`}
  </Text>
</View>

          {loading ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator
                size="large"
                color={colors.orange}
              />
              <Text style={styles.loadingText}>
                Loading meals...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.statusContainer}>
              <Text style={styles.errorMsg}>{error}</Text>

              <TouchableOpacity
                style={styles.retryBtn}
                onPress={onRefresh}
              >
                <Text style={styles.btnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={allCategoryMeals}
              keyExtractor={(item) => item.idMeal}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.trendCard}
                  onPress={() => onOpenMealDetail(item)}
                >
                  <Image
                    source={{
                      uri: getSafeImageUri(item.strMealThumb),
                    }}
                    style={styles.trendImage}
                  />

                  <TouchableOpacity
                    style={styles.favoriteBadge}
                    onPress={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.idMeal);
                    }}
                  >
                    <Text
                      style={[
                        styles.favoriteText,
                        favorites.includes(item.idMeal) &&
                          styles.favoriteTextActive,
                      ]}
                    >
                      {favorites.includes(item.idMeal)
                        ? '♥'
                        : '♡'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.trendOverlay} />

                  <View style={styles.trendLabelContainer}>
                    <Text
                      style={styles.trendTitle}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {item.strMeal}
                    </Text>

                    <View style={styles.trendRatingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={`${item.idMeal}-trend-star-${star}`}
                          onPress={(e) => {
                            e.stopPropagation();
                            onSetRating(item.idMeal, star);
                          }}
                          style={styles.trendStarButton}
                        >
                          <Text
                            style={[
                              styles.trendStar,
                              (ratings[item.idMeal] || 0) >=
                              star
                                ? styles.starActive
                                : styles.starInactive,
                            ]}
                          >
                            {(ratings[item.idMeal] || 0) >=
                            star
                              ? '★'
                              : '☆'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.cardChevron}>›</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyLabel}>
                  No trending recipes found
                </Text>
              }
            />
          )}

          <Text style={styles.noFoodBottomText}>
            No food items currently displayed on the dashboard.
          </Text>
        </>
      )}
    </ScrollView>
  );
}
