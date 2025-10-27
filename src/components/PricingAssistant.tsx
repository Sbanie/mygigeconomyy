import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatZAR } from '../lib/utils';
import { DollarSign, TrendingUp } from 'lucide-react';

export const PricingAssistant = () => {
  const { profile } = useAuth();
  const [platform, setPlatform] = useState('Instagram');
  const [followers, setFollowers] = useState(profile?.follower_count || 10000);
  const [contentType, setContentType] = useState('single-post');

  const calculatePrice = () => {
    let baseRate = 0;

    if (platform === 'Instagram' || platform === 'TikTok') {
      baseRate = (followers / 10000) * 300;
    } else if (platform === 'YouTube') {
      baseRate = (followers / 1000) * 500;
    } else if (platform === 'Freelance') {
      baseRate = profile?.hourly_rate || 300;
    }

    const multipliers: Record<string, number> = {
      'single-post': 1,
      'story-series': 0.6,
      'campaign': 5,
      'video': 1.5,
      'reel': 1.2
    };

    const price = baseRate * (multipliers[contentType] || 1);
    const min = price * 0.7;
    const max = price * 1.3;

    return { min: Math.round(min), recommended: Math.round(price), max: Math.round(max) };
  };

  const pricing = calculatePrice();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pricing Assistant</h1>
        <p className="text-gray-600 mt-1">Get market-based pricing recommendations for SA creators</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Calculate Your Rate</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Facebook">Facebook</option>
              <option value="Freelance">Freelance Work</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Followers / Subscribers: {followers.toLocaleString()}
            </label>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={followers}
              onChange={(e) => setFollowers(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['single-post', 'story-series', 'campaign', 'video', 'reel'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContentType(type)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    contentType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-sm border-2 border-blue-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-600 text-white rounded-lg">
            <DollarSign size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pricing Recommendation</h2>
            <p className="text-gray-600">Based on SA market rates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Minimum</p>
            <p className="text-3xl font-bold text-gray-900">{formatZAR(pricing.min)}</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium mb-2">
              <TrendingUp size={14} />
              Recommended
            </div>
            <p className="text-4xl font-bold text-green-600">{formatZAR(pricing.recommended)}</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Maximum</p>
            <p className="text-3xl font-bold text-gray-900">{formatZAR(pricing.max)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">SA Creator Market Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <p><strong>Instagram Posts:</strong> R100-R500 per 10k followers (single post)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <p><strong>TikTok Videos:</strong> R150-R600 per 10k followers</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <p><strong>YouTube Integration:</strong> R500-R2,000 per 1k subscribers</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <p><strong>Story Series:</strong> 60% of single post rate</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <p><strong>Full Campaign:</strong> 5x single post rate</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <p><strong>Freelance Hourly:</strong> R150-R1,500 depending on expertise</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Pricing Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Start with recommended rates and adjust based on engagement</li>
          <li>• Include usage rights in your pricing</li>
          <li>• Charge extra for exclusivity periods</li>
          <li>• Bundle services for better deals</li>
          <li>• Consider brand budget and campaign scope</li>
        </ul>
      </div>
    </div>
  );
};