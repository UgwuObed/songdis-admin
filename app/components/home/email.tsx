"use client";

import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { BASE_URL } from '../apiConfig';
import { 
  CheckIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ApiResponse {
    status: string;
    message: string;
    count: number;
    data: {
      current_page: number;
      data: User[];  
    };
  }
  
  interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    account_type: string;
  }

interface Result {
  success: boolean;
  message: string;
  details?: {
    successCount: number;
    failedEmails: string[];
  };
}


const BulkEmailManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      console.log('Full API Response:', response);
  
      if (!response.data || typeof response.data !== 'object') {
        setError('Invalid or empty data received');
        setUsers([]);
        return;
      }
  
      if (response.data.data?.data && Array.isArray(response.data.data.data)) {
        setUsers(response.data.data.data);
      } else {
        console.warn('Unexpected API response format:', response.data);
        setError('Unexpected data format received from server');
        setUsers([]);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;  
      console.error('Error details:', axiosError);
      setError(
        axiosError.response?.data?.message || axiosError.message || 'Error fetching users'
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && Array.isArray(users)) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSendEmails = async () => {
    if (selectedUsers.length === 0) {
      setResult({
        success: false,
        message: 'Please select at least one user'
      });
      return;
    }

    setSending(true);
    setResult(null);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        `${BASE_URL}/api/send-bulk`,
        { user_ids: selectedUsers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult({
        success: true,
        message: response.data.message,
        details: {
          successCount: response.data.success_count,
          failedEmails: response.data.failed_emails
        }
      });
      
      setSelectedUsers([]);
      
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setResult({
        success: false,
        message: axiosError.response?.data?.message || 'Failed to send emails'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bulk Email Manager</h2>
        <button 
          onClick={handleSendEmails}
          disabled={sending || selectedUsers.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {sending ? (
            <>
              <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            `Send Email${selectedUsers.length ? ` (${selectedUsers.length})` : ''}`
          )}
        </button>
      </div>

      {(result || error) && (
        <div className={`p-4 rounded-lg ${error ? 'bg-red-50 border border-red-200' : (result?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}`}>
          <div className="flex items-start">
            {error ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            ) : (
              result?.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              )
            )}
            <div>
              {error || result?.message}
              {result?.details && (
                <div className="mt-2 text-sm">
                  <div>Successfully sent: {result.details.successCount}</div>
                  {result.details.failedEmails?.length > 0 && (
                    <div>Failed: {result.details.failedEmails.length}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={Array.isArray(users) && users.length > 0 && selectedUsers.length === users.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Date Joined</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Failed to load users
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkEmailManager;
