"use client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, AlertCircle } from "lucide-react";
import { BASE_URL } from '../apiConfig';

type PromoCode = {
  id: number;
  code: string;
  active: boolean;
  max_uses: number;
};

type PromoPayload = {
  prefix: string;
  max_uses: string;
  duration_days: string;
  number_of_codes: string;
};

const PromoManager = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [payload, setPayload] = useState<PromoPayload>({
    prefix: "",
    max_uses: "",
    duration_days: "",
    number_of_codes: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  const fetchData = async (endpoint: string) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  };

  const postData = async (endpoint: string, body?: Record<string, any>) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }
    const response = await axios.post(
      `${BASE_URL}${endpoint}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  };

  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        const data = await fetchData("/api/promo-codes");
        setPromoCodes(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching promo codes.");
      } finally {
        setFetching(false);
      }
    };
    fetchPromoCodes();
  }, []);
  
  const generatePromoCodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await postData("/api/promo-codes/generate", payload);
      // Handle both single promo code and array responses
      const newCodes = Array.isArray(response) ? response : response ? [response] : [];
      
      // Validate that each code has the required properties
      const validCodes = newCodes.filter((code): code is PromoCode => {
        return (
          typeof code === 'object' &&
          code !== null &&
          typeof code.id === 'number' &&
          typeof code.code === 'string' &&
          typeof code.active === 'boolean' &&
          typeof code.max_uses === 'number'
        );
      });

      setPromoCodes((prevCodes) => [...prevCodes, ...validCodes]);
      setPayload({
        prefix: "",
        max_uses: "",
        duration_days: "",
        number_of_codes: "",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "An error occurred while generating promo codes.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePromoCodeStatus = async (id: number) => {
    setError(null);
    try {
      await postData(`/api/promo-codes/${id}/toggle`);
      setPromoCodes((prevCodes) =>
        prevCodes.map((code) =>
          code.id === id ? { ...code, active: !code.active } : code
        )
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "An error occurred while toggling promo code status.";
      setError(errorMessage);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Promo Code Manager</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Generate Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Create Promo Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Prefix"
                value={payload.prefix}
                onChange={(e) => setPayload({ ...payload, prefix: e.target.value })}
              />
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                type="number"
                placeholder="Max Uses"
                value={payload.max_uses}
                onChange={(e) => setPayload({ ...payload, max_uses: e.target.value })}
              />
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                type="number"
                placeholder="Duration Days"
                value={payload.duration_days}
                onChange={(e) => setPayload({ ...payload, duration_days: e.target.value })}
              />
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                type="number"
                placeholder="Number of Codes"
                value={payload.number_of_codes}
                onChange={(e) => setPayload({ ...payload, number_of_codes: e.target.value })}
              />
            </div>
            <button
              onClick={generatePromoCodes}
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition ${loading ? 'cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Codes'
              )}
            </button>
            
            {error && (
              <div className="flex items-center p-4 rounded-md bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Promo Codes Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Existing Promo Codes</h3>
            {fetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : promoCodes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No promo codes available.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promoCodes.map((code) => (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{code.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{code.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            code.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {code.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => togglePromoCodeStatus(code.id)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoManager;