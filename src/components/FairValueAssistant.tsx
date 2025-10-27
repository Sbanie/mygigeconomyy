import { useState } from 'react';
import { Search, ExternalLink, Check, AlertCircle, Upload, X, Plus, Trash2, TrendingUp, DollarSign, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FairMarketValue } from '../types';
import { formatZAR } from '../lib/utils';

interface FairValueAssistantProps {
  incomeId: string;
  itemDescription: string;
  onComplete: (fmv: FairMarketValue) => void;
  onCancel: () => void;
}

interface PriceSource {
  retailer: string;
  price: number;
  url: string;
  date: string;
  isManual?: boolean;
}

export const FairValueAssistant = ({ incomeId, itemDescription, onComplete, onCancel }: FairValueAssistantProps) => {
  const [step, setStep] = useState<'search' | 'review' | 'proof' | 'complete'>('search');
  const [searchQuery, setSearchQuery] = useState(itemDescription || '');
  const [priceSources, setPriceSources] = useState<PriceSource[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<'market_research' | 'retailer_price' | 'comparable_sales'>('retailer_price');
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [newProofUrl, setNewProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualPrice, setManualPrice] = useState('');
  const [manualRetailer, setManualRetailer] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  const SA_RETAILERS = [
    { name: 'Takealot', searchUrl: 'https://www.takealot.com/search?qsearch=', domain: 'takealot.com' },
    { name: 'Makro', searchUrl: 'https://www.makro.co.za/search?q=', domain: 'makro.co.za' },
    { name: 'Game', searchUrl: 'https://www.game.co.za/search?q=', domain: 'game.co.za' },
    { name: 'Incredible Connection', searchUrl: 'https://www.incredible.co.za/search?q=', domain: 'incredible.co.za' },
    { name: 'Hirsch\'s', searchUrl: 'https://www.hirschs.co.za/search/?q=', domain: 'hirschs.co.za' },
    { name: 'PriceCheck', searchUrl: 'https://www.pricecheck.co.za/search?search=', domain: 'pricecheck.co.za' },
  ];

  const openRetailerLinks = () => {
    SA_RETAILERS.forEach(retailer => {
      window.open(`${retailer.searchUrl}${encodeURIComponent(searchQuery)}`, '_blank');
    });
  };

  const addManualPrice = () => {
    if (!manualPrice || !manualRetailer) return;

    const newSource: PriceSource = {
      retailer: manualRetailer,
      price: parseFloat(manualPrice),
      url: manualUrl || `Manual entry: ${manualRetailer}`,
      date: new Date().toISOString().split('T')[0],
      isManual: true
    };

    setPriceSources([...priceSources, newSource]);
    setManualPrice('');
    setManualRetailer('');
    setManualUrl('');
    setShowManualEntry(false);
  };

  const removePrice = (index: number) => {
    setPriceSources(priceSources.filter((_, i) => i !== index));
  };

  const handlePriceSelect = (price: number) => {
    setSelectedPrice(price);
  };

  const calculateAverageFMV = () => {
    if (priceSources.length === 0) return 0;
    const total = priceSources.reduce((sum, source) => sum + source.price, 0);
    return Math.round(total / priceSources.length);
  };

  const calculateMedianFMV = () => {
    if (priceSources.length === 0) return 0;
    const sorted = [...priceSources].sort((a, b) => a.price - b.price);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return Math.round((sorted[mid - 1].price + sorted[mid].price) / 2);
    }
    return sorted[mid].price;
  };

  const getMinMaxPrices = () => {
    if (priceSources.length === 0) return { min: 0, max: 0 };
    const prices = priceSources.map(s => s.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  const getPriceVariance = () => {
    if (priceSources.length < 2) return 0;
    const avg = calculateAverageFMV();
    const { min, max } = getMinMaxPrices();
    return ((max - min) / avg * 100).toFixed(1);
  };

  const addProofUrl = () => {
    if (!newProofUrl.trim()) return;
    setProofUrls([...proofUrls, newProofUrl.trim()]);
    setNewProofUrl('');
  };

  const removeProofUrl = (index: number) => {
    setProofUrls(proofUrls.filter((_, i) => i !== index));
  };

  const validateFMV = () => {
    const warnings = [];

    if (priceSources.length < 3) {
      warnings.push('Recommended: Add at least 3 price sources for better accuracy');
    }

    const variance = parseFloat(getPriceVariance());
    if (variance > 30) {
      warnings.push(`High price variance (${variance}%) - verify sources for accuracy`);
    }

    if (!selectedPrice) {
      warnings.push('Please select a price to continue');
    }

    if (proofUrls.length === 0 && priceSources.some(s => !s.isManual)) {
      warnings.push('Consider adding screenshot URLs as proof for SARS compliance');
    }

    return warnings;
  };

  const handleSubmitFMV = async () => {
    if (!selectedPrice) return;

    const warnings = validateFMV();
    if (warnings.length > 0 && warnings.some(w => w.includes('Please select'))) {
      alert(warnings.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentYear = new Date().getFullYear();
      const month = new Date().getMonth();
      const taxYear = month >= 2 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;

      const allProofs = [
        ...proofUrls,
        ...priceSources.map(s => s.url)
      ].filter((url, index, self) => url && self.indexOf(url) === index);

      const selectedSource = priceSources.find(s => s.price === selectedPrice);

      const fmvData = {
        user_id: user.id,
        income_id: incomeId,
        item_description: searchQuery,
        calculation_method: calculationMethod,
        fmv_amount: selectedPrice,
        valuation_date: new Date().toISOString().split('T')[0],
        proof_source_type: 'website' as const,
        proof_source_url: allProofs[0] || null,
        retailer_name: selectedSource?.retailer || null,
        product_link: selectedSource?.url || null,
        verification_status: (priceSources.length >= 3 && parseFloat(getPriceVariance()) < 30) ? 'verified' as const : 'requires_review' as const,
        notes: notes || `FMV calculated from ${priceSources.length} source(s). Average: ${formatZAR(calculateAverageFMV())}, Median: ${formatZAR(calculateMedianFMV())}, Variance: ${getPriceVariance()}%`,
        added_to_taxable_income: true,
        tax_year: taxYear,
      };

      const { data, error } = await supabase
        .from('fair_market_values')
        .insert(fmvData)
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('income')
        .update({ amount: selectedPrice })
        .eq('id', incomeId);

      onComplete(data);
      setStep('complete');
    } catch (error) {
      console.error('Error saving FMV:', error);
      alert('Failed to save Fair Market Value. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fair Market Value Assistant</h2>
            <p className="text-sm text-gray-600 mt-1">SARS-compliant FMV calculation for barter items</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {step === 'search' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Description *
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., iPhone 15 Pro 256GB Black"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Be specific: include brand, model, size, color</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculation Method
                </label>
                <select
                  value={calculationMethod}
                  onChange={(e) => setCalculationMethod(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="retailer_price">Retailer Price (Most Common)</option>
                  <option value="market_research">Market Research (Multiple Sources)</option>
                  <option value="comparable_sales">Comparable Sales (Used/Second-hand)</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-gray-900 mb-1">SARS FMV Requirements</p>
                    <ul className="space-y-1">
                      <li>• Fair Market Value must reflect what you would pay in an open market</li>
                      <li>• Use current retail prices from reputable SA retailers</li>
                      <li>• Document your sources with screenshots or links</li>
                      <li>• If prices vary significantly, use average or median value</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={openRetailerLinks}
                disabled={!searchQuery.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search size={20} />
                Open Search in All SA Retailers
              </button>

              <div className="border-t pt-4">
                <button
                  onClick={() => setStep('review')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  Continue to Enter Prices
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Price Sources ({priceSources.length})</h3>
                  <button
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add Price
                  </button>
                </div>

                {showManualEntry && (
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Add Price Source</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Retailer *</label>
                        <input
                          type="text"
                          value={manualRetailer}
                          onChange={(e) => setManualRetailer(e.target.value)}
                          placeholder="e.g., Takealot, Makro, PriceCheck"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (R) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={manualPrice}
                          onChange={(e) => setManualPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product URL (Optional)</label>
                        <input
                          type="url"
                          value={manualUrl}
                          onChange={(e) => setManualUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addManualPrice}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                        >
                          Add Price
                        </button>
                        <button
                          onClick={() => {
                            setShowManualEntry(false);
                            setManualPrice('');
                            setManualRetailer('');
                            setManualUrl('');
                          }}
                          className="px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {priceSources.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <DollarSign size={48} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">No prices added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Search retailers and add prices to calculate FMV</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {priceSources.map((source, idx) => (
                      <div
                        key={idx}
                        onClick={() => handlePriceSelect(source.price)}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPrice === source.price
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selectedPrice === source.price
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedPrice === source.price && <Check size={16} className="text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{source.retailer}</p>
                              <p className="text-2xl font-bold text-green-600">{formatZAR(source.price)}</p>
                              <p className="text-xs text-gray-500">{source.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {source.url && !source.isManual && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removePrice(idx);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {priceSources.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Average FMV</p>
                      <p className="text-2xl font-bold text-gray-900">{formatZAR(calculateAverageFMV())}</p>
                      <button
                        onClick={() => handlePriceSelect(calculateAverageFMV())}
                        className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Use Average
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Median FMV</p>
                      <p className="text-2xl font-bold text-gray-900">{formatZAR(calculateMedianFMV())}</p>
                      <button
                        onClick={() => handlePriceSelect(calculateMedianFMV())}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Use Median
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Price Range</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatZAR(getMinMaxPrices().min)} - {formatZAR(getMinMaxPrices().max)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Variance: {getPriceVariance()}%</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <TrendingUp size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">FMV Recommendation</p>
                        <p className="text-sm text-gray-700">
                          {priceSources.length < 3
                            ? 'For better accuracy, add at least 3 price sources from different retailers.'
                            : parseFloat(getPriceVariance()) > 30
                            ? 'High price variance detected. Consider using the median value for a more conservative estimate.'
                            : 'Good price consistency! The average or median value would be appropriate for SARS.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof Documentation (Screenshots/Links)
                </label>
                <div className="space-y-2">
                  {proofUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <LinkIcon size={16} className="text-gray-400" />
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-600 hover:underline truncate">
                        {url}
                      </a>
                      <button onClick={() => removeProofUrl(idx)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newProofUrl}
                      onChange={(e) => setNewProofUrl(e.target.value)}
                      placeholder="https://example.com/screenshot.png"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={addProofUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional context, condition notes, or special circumstances..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {validateFMV().length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-2">⚠️ Validation Warnings</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {validateFMV().map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('search')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitFMV}
                  disabled={!selectedPrice || loading || priceSources.length === 0}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : `Confirm FMV: ${selectedPrice ? formatZAR(selectedPrice) : 'Select Price'}`}
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">FMV Calculated Successfully!</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                <p className="text-sm text-gray-600 mb-1">Fair Market Value</p>
                <p className="text-3xl font-bold text-green-600">{formatZAR(selectedPrice || 0)}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Calculated from {priceSources.length} source{priceSources.length !== 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                This amount has been recorded and added to your taxable income for SARS compliance.
              </p>
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
