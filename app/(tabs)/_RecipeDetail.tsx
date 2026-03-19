import React from 'react';
import { SafeAreaView, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Meal } from '../_types';
import { getIngredientList, getInstructionSteps, abbreviateMeasure, getSafeImageUri } from './_utils';
import { styles } from '../../components/appStyles';

interface RecipeDetailProps {
  selectedMeal: Meal;
  onClose: () => void;
  onShare: () => void;
  currentStep: number;
  setCurrentStep: (value: number) => void;
}

export const RecipeDetail = ({ selectedMeal, onClose, onShare, currentStep, setCurrentStep }: RecipeDetailProps) => {
  const instructionSteps = getInstructionSteps(selectedMeal.strInstructions);
  const progress = Math.min(100, (instructionSteps.length ? ((currentStep + 1) / instructionSteps.length) * 100 : 0));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backArrow}>← </Text>
                      </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={3} ellipsizeMode="tail">{selectedMeal.strMeal}</Text>
        </View>

        <Image source={{ uri: getSafeImageUri(selectedMeal.strMealThumb) }} style={styles.detailImage} />
        <Text style={styles.subTitle}>{selectedMeal.strCategory} • {selectedMeal.strArea}</Text>

        <View style={styles.cardBlock}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {getIngredientList(selectedMeal).map((ing, i) => (
            <View key={`${ing.ingredient}-${i}`} style={styles.ingredientRow}>
              <Text style={styles.ingredientName} numberOfLines={2}>{ing.ingredient}</Text>
              <Text style={[styles.ingredientAmount, !ing.measure && styles.ingredientAmountEmpty]} numberOfLines={1}>{abbreviateMeasure(ing.measure) || 'to taste'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardBlock}>
          <Text style={styles.sectionTitle}>Step-by-step Instructions</Text>
          <View style={styles.progressBarContainer}><View style={[styles.progressBarFill, { width: `${progress}%` }]} /></View>
          <Text style={styles.progressText}>{instructionSteps.length ? `Step ${Math.min(currentStep + 1, instructionSteps.length)} of ${instructionSteps.length}` : 'No steps available'}</Text>

          {instructionSteps.map((step, idx) => (
            <View key={`step-${idx}`} style={[styles.stepRow, currentStep === idx && styles.stepRowActive]}>
              <Text style={[styles.stepNumber, currentStep === idx && styles.stepNumberActive]}>{idx + 1}</Text>
              <Text style={[styles.stepText, currentStep === idx && styles.stepTextActive]}>{step}</Text>
            </View>
          ))}

          <View style={styles.stepControlsRow}>
            <TouchableOpacity
              style={[styles.nextStepBtn, currentStep >= instructionSteps.length - 1 && styles.nextStepBtnDisabled]}
              onPress={() => { if (currentStep < instructionSteps.length - 1) setCurrentStep(currentStep + 1); }}
              disabled={currentStep >= instructionSteps.length - 1}
            >
              <Text style={styles.nextStepBtnText}>{currentStep >= instructionSteps.length - 1 ? 'Completed' : 'Next step'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetStepBtn} onPress={() => setCurrentStep(0)}>
              <Text style={styles.resetStepBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailActionsRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare}><Text style={styles.shareBtnText}>Share</Text></TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeBtnText}>Close</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecipeDetail;
