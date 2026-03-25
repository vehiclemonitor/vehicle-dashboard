import React, { useState } from 'react';
import { X, DollarSign, TrendingDown, AlertCircle, Loader } from 'lucide-react';

export default function NegotiationModal({ vehicle, onClose }) {
  const [step, setStep] = useState('input'); // input, analyzing, results
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');

  const [formData, setFormData] = useState({
    serviceHistory: '',
    accidents: false,
    accidentDetails: '',
    warranty: '',
    myBudget: '',
    urgency: '',
  });

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setStep('analyzing');

    try {
      const listingData = {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        trim: vehicle.trim,
        mileage: vehicle.mileage,
        price: vehicle.price,
        condition: vehicle.condition || 'good',
        region: vehicle.region || vehicle.dealerZip || 'Unknown',
        vin: vehicle.vin,
        serviceHistory: formData.serviceHistory || 'Unknown',
        accidents: formData.accidents,
        accidentDetails: formData.accidentDetails,
        warranty: formData.warranty,
      };

      const context = {
        myBudget: formData.myBudget ? parseInt(formData.myBudget) : undefined,
        urgency: formData.urgency,
      };

      const response = await fetch(
        `https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/agents/negotiation/analyze-listing`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing: listingData, context }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data);
      setStep('results');
    } catch (err) {
      setError(err.message || 'Failed to analyze listing');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com/api/agents/negotiation/follow-up`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationHistory: analysis.conversationHistory,
            followUpQuestion,
            listing: {
              year: vehicle.year,
              make: vehicle.make,
              model: vehicle.model,
              price: vehicle.price,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Follow-up failed');
      }

      setAnalysis(data);
      setFollowUpQuestion('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    navigator.clipboard.writeText(analysis.analysis);
    alert('Analysis copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            Deal Quality Analysis
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Vehicle Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Vehicle Summary</h3>
                <p className="text-gray-700">
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                </p>
                <p className="text-gray-700">
                  ${vehicle.price.toLocaleString()} • {vehicle.mileage.toLocaleString()} miles
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Service History
                  </label>
                  <input
                    type="text"
                    value={formData.serviceHistory}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceHistory: e.target.value })
                    }
                    placeholder="Full records, sporadic, unknown..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="accidents"
                    checked={formData.accidents}
                    onChange={(e) =>
                      setFormData({ ...formData, accidents: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="accidents" className="text-sm font-semibold text-gray-900">
                    Vehicle has accident history
                  </label>
                </div>

                {formData.accidents && (
                  <input
                    type="text"
                    value={formData.accidentDetails}
                    onChange={(e) =>
                      setFormData({ ...formData, accidentDetails: e.target.value })
                    }
                    placeholder="Describe the accident..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 ml-6"
                  />
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Warranty Offered
                  </label>
                  <input
                    type="text"
                    value={formData.warranty}
                    onChange={(e) =>
                      setFormData({ ...formData, warranty: e.target.value })
                    }
                    placeholder="None, 3mo/3k, extended..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Your Budget (optional)
                    </label>
                    <input
                      type="number"
                      value={formData.myBudget}
                      onChange={(e) =>
                        setFormData({ ...formData, myBudget: e.target.value })
                      }
                      placeholder="30000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Urgency
                    </label>
                    <input
                      type="text"
                      value={formData.urgency}
                      onChange={(e) =>
                        setFormData({ ...formData, urgency: e.target.value })
                      }
                      placeholder="ASAP, next month..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
              >
                <DollarSign size={20} />
                {loading ? 'Analyzing...' : 'Analyze Deal Quality'}
              </button>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="text-center py-12">
              <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
              <p className="text-gray-600 text-lg">
                Analyzing deal quality and market comparables...
              </p>
              <p className="text-gray-500 text-sm mt-2">This may take 5-10 seconds</p>
            </div>
          )}

          {step === 'results' && analysis && (
            <div className="space-y-6">
              {/* Analysis Text */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 prose prose-sm max-w-none">
                <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                  {analysis.analysis}
                </div>
              </div>

              {/* Follow-up Question */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Ask a follow-up question
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    placeholder="Should I negotiate on warranty or price?"
                    disabled={loading}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleFollowUp();
                    }}
                  />
                  <button
                    onClick={handleFollowUp}
                    disabled={!followUpQuestion.trim() || loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-semibold"
                  >
                    {loading ? '...' : 'Ask'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyAnalysis}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition font-semibold"
                >
                  📋 Copy Analysis
                </button>
                <button
                  onClick={() => {
                    setStep('input');
                    setAnalysis(null);
                    setFollowUpQuestion('');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                >
                  ← New Analysis
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
