export interface LikertCriterion {
  id: 'effectiveness' | 'efficiency' | 'usability' | 'reliability';
  title: string;
  description: string;
  ratings: number[]; // Array of 10 ratings (1 to 5) from the N=10 respondents
}

export interface RespondentProfile {
  id: string;
  name: string;
  role: 'BHW' | 'Rural Health Midwife';
  barangay: 'Palaquio' | 'Tabiog' | 'Babangcag';
  yearsInService: number;
}

export const UAT_RESPONDENTS: RespondentProfile[] = [
  { id: 'resp-01', name: 'Elena Bagani', role: 'BHW', barangay: 'Palaquio', yearsInService: 8 },
  { id: 'resp-02', name: 'Corazon Valdez', role: 'Rural Health Midwife', barangay: 'Palaquio', yearsInService: 12 },
  { id: 'resp-03', name: 'Mercy Dizon', role: 'BHW', barangay: 'Palaquio', yearsInService: 5 },
  { id: 'resp-04', name: 'Teresa Balbin', role: 'BHW', barangay: 'Tabiog', yearsInService: 10 },
  { id: 'resp-05', name: 'Aida Flores', role: 'BHW', barangay: 'Tabiog', yearsInService: 7 },
  { id: 'resp-06', name: 'Leticia Ramos', role: 'Rural Health Midwife', barangay: 'Tabiog', yearsInService: 15 },
  { id: 'resp-07', name: 'Rosalinda Cruz', role: 'BHW', barangay: 'Babangcag', yearsInService: 6 },
  { id: 'resp-08', name: 'Fe Tolentino', role: 'BHW', barangay: 'Babangcag', yearsInService: 9 },
  { id: 'resp-09', name: 'Vilma Garcia', role: 'BHW', barangay: 'Babangcag', yearsInService: 4 },
  { id: 'resp-10', name: 'Glenda Soriano', role: 'Rural Health Midwife', barangay: 'Babangcag', yearsInService: 11 },
];

export interface CriterionResult {
  id: string;
  title: string;
  weightedMean: number;
  descriptiveRating: 'Very Good' | 'Good' | 'Moderate' | 'Poor' | 'Very Poor';
  actionDirective: string;
  ratingCounts: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

export interface UATEvaluationReport {
  sampleSize: number;
  criteriaResults: CriterionResult[];
  overallCompositeMean: number;
  overallRating: 'Very Good' | 'Good' | 'Moderate' | 'Poor' | 'Very Poor';
  operationalReadiness: boolean;
}

export class EvaluationService {
  // Baseline survey responses from N=10 frontline respondents in Abra
  private static DEFAULT_CRITERIA_DATA: LikertCriterion[] = [
    {
      id: 'effectiveness',
      title: 'Effectiveness & Functionality',
      description: 'Reliability of core modules (intake, hemodynamics, EPI defaulter tracking, and maternal EDD calculations) without errors.',
      ratings: [5, 5, 5, 4, 5, 5, 4, 5, 5, 5], // Mean: 4.80
    },
    {
      id: 'efficiency',
      title: 'Efficiency & Time Savings',
      description: 'Measurable time reduction in resident encoding and report generation compared to manual physical paper logbooks.',
      ratings: [5, 4, 5, 5, 5, 5, 4, 5, 4, 5], // Mean: 4.70
    },
    {
      id: 'usability',
      title: 'User-Friendliness & Accessibility',
      description: 'Clarity of navigation, readable high-contrast typography, and ease of use for health workers with varied digital literacy.',
      ratings: [5, 4, 4, 5, 4, 5, 5, 4, 5, 5], // Mean: 4.60
    },
    {
      id: 'reliability',
      title: 'Reliability & Clinical Safety',
      description: 'Correctness of automated clinical indicator flags (hypertensive crisis alerts, fever detection, and WHO BMI stratification).',
      ratings: [5, 5, 5, 5, 5, 5, 5, 4, 5, 5], // Mean: 4.90
    },
  ];

  /**
   * Standard PRD Likert Interpretation Thresholds:
   * 4.20 - 5.00: Very Good (Clear for full facility deployment)
   * 3.40 - 4.19: Good (Acceptable baseline, prioritize minor UI/UX adjustments)
   * 2.60 - 3.39: Moderate
   * 1.80 - 2.59: Poor
   * 1.00 - 1.79: Very Poor
   */
  public static classifyScore(mean: number): {
    rating: 'Very Good' | 'Good' | 'Moderate' | 'Poor' | 'Very Poor';
    action: string;
  } {
    if (mean >= 4.20) {
      return {
        rating: 'Very Good',
        action: 'System meets operational standard; clear for full facility deployment.',
      };
    }
    if (mean >= 3.40) {
      return {
        rating: 'Good',
        action: 'Acceptable baseline; prioritize minor UI/UX adjustments during sprint cycles.',
      };
    }
    if (mean >= 2.60) {
      return {
        rating: 'Moderate',
        action: 'Requires focused workflow refinements before signing off on deployment.',
      };
    }
    if (mean >= 1.80) {
      return {
        rating: 'Poor',
        action: 'Module fails acceptance gate; requires structural redesign and re-testing.',
      };
    }
    return {
      rating: 'Very Poor',
      action: 'Immediate critical escalation; core software architecture requires overhaul.',
    };
  }

  /**
   * Computes the weighted mean for an array of rating scores:
   * Weighted Mean = sum(score * count) / total respondents
   */
  public static calculateWeightedMean(ratings: number[]): {
    weightedMean: number;
    counts: { 5: number; 4: number; 3: number; 2: number; 1: number };
  } {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const score of ratings) {
      if (score >= 1 && score <= 5) {
        counts[score as keyof typeof counts]++;
        sum += score;
      }
    }

    const mean = ratings.length > 0 ? Math.round((sum / ratings.length) * 100) / 100 : 0;
    return { weightedMean: mean, counts };
  }

  /**
   * Generates complete User Acceptance Testing report across N=10 respondents
   */
  public static generateUATReport(customCriteria?: LikertCriterion[]): UATEvaluationReport {
    const data = customCriteria || this.DEFAULT_CRITERIA_DATA;
    const results: CriterionResult[] = [];
    let cumulativeSum = 0;

    for (const criterion of data) {
      const { weightedMean, counts } = this.calculateWeightedMean(criterion.ratings);
      const { rating, action } = this.classifyScore(weightedMean);

      results.push({
        id: criterion.id,
        title: criterion.title,
        weightedMean,
        descriptiveRating: rating,
        actionDirective: action,
        ratingCounts: counts,
      });

      cumulativeSum += weightedMean;
    }

    const overallMean = Math.round((cumulativeSum / results.length) * 100) / 100;
    const { rating: overallRating } = this.classifyScore(overallMean);

    return {
      sampleSize: UAT_RESPONDENTS.length,
      criteriaResults: results,
      overallCompositeMean: overallMean,
      overallRating,
      operationalReadiness: overallMean >= 4.20,
    };
  }
}
