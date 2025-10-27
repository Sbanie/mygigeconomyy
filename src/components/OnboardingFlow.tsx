import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CREATOR_TYPES, GIG_TYPES, SA_PLATFORMS, FOLLOWER_RANGES } from '../lib/constants';
import { ChevronRight, ChevronLeft, Sparkles, Briefcase, Target } from 'lucide-react';

export const OnboardingFlow = () => {
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [followerRange, setFollowerRange] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState('');

  const toggleWorkType = (value: string) => {
    setSelectedWorkTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const togglePlatform = (value: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedWorkTypes.length === 0) {
      setError('Please select at least one work type');
      return;
    }
    if (step === 2 && selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      if (!profile) throw new Error('Profile not found');

      // Determine follower count from range
      const selectedRange = FOLLOWER_RANGES.find(r => r.value === followerRange);
      const followerCount = selectedRange ? selectedRange.min : 0;

      // Update profile with onboarding data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_types: selectedWorkTypes,
          platforms: selectedPlatforms,
          follower_count: followerCount,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          monthly_goal: monthlyGoal ? parseFloat(monthlyGoal) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Refresh profile to update the app state
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
      setLoading(false);
    }
  };

  const isCreator = selectedWorkTypes.some(wt =>
    CREATOR_TYPES.some(ct => ct.value === wt)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src="/WhatsApp_Image_2025-10-27_at_21.35.50_e46494b3-removebg-preview.png"
              alt="MyGig-Economy Logo"
              className="h-20 mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to MyGig-Economy</h1>
            <p className="text-gray-600">Let's set up your profile to get started</p>
            <div className="flex justify-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s === step ? 'w-8 bg-blue-600' : s < step ? 'w-2 bg-blue-400' : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Work Types */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">What type of work do you do?</h2>
                <p className="text-gray-600 mt-2">Select all that apply. You can choose multiple streams!</p>
              </div>

              {/* Creator Types */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Digital Creators / Influencers</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CREATOR_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => toggleWorkType(type.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedWorkTypes.includes(type.value)
                          ? 'border-purple-600 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:border-purple-300 text-gray-700'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gig Types */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Freelancers / Gig Workers</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {GIG_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => toggleWorkType(type.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedWorkTypes.includes(type.value)
                          ? 'border-green-600 bg-green-50 text-green-900'
                          : 'border-gray-200 hover:border-green-300 text-gray-700'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedWorkTypes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Selected:</span> {selectedWorkTypes.length} work type{selectedWorkTypes.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Platforms */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Where do you earn income?</h2>
                <p className="text-gray-600 mt-2">Select all platforms you work on</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {SA_PLATFORMS.map((platform) => (
                  <button
                    key={platform.value}
                    onClick={() => togglePlatform(platform.value)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      selectedPlatforms.includes(platform.value)
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{platform.label}</div>
                  </button>
                ))}
              </div>

              {selectedPlatforms.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Selected:</span> {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Additional Details */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Final details</h2>
                <p className="text-gray-600 mt-2">Help us personalize your experience</p>
              </div>

              <div className="space-y-4 max-w-xl mx-auto">
                {/* Follower Count - Only show if creator */}
                {isCreator && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Follower Count (Across All Platforms)
                    </label>
                    <select
                      value={followerRange}
                      onChange={(e) => setFollowerRange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select range...</option>
                      {FOLLOWER_RANGES.map((range) => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average Hourly Rate (ZAR) <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 500"
                    min="0"
                    step="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">This helps us provide better pricing guidance</p>
                </div>

                {/* Monthly Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Income Goal (ZAR) <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={monthlyGoal}
                    onChange={(e) => setMonthlyGoal(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 15000"
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">We'll help you track progress towards this goal</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-0 disabled:cursor-default text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>You can always update these settings later in your profile</p>
        </div>
      </div>
    </div>
  );
};
