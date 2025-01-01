"use client";
import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { BASE_URL } from '../apiConfig';
import { 
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

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

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
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
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);  
  const [totalPages, setTotalPages] = useState(1);  

  useEffect(() => {
    fetchUsers(currentPage);
    fetchTemplates();
  }, [currentPage]);

  const fetchTemplates = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/email`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data?.templates) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || 'Error fetching email templates');
    }
  };

  const fetchUsers = async (page: number) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.data || typeof response.data !== 'object') {
        setError('Invalid or empty data received');
        setUsers([]);
        return;
      }
  
      if (response.data.data?.data && Array.isArray(response.data.data.data)) {
        setUsers(response.data.data.data);
        setCurrentPage(response.data.data.current_page); 
        setTotalPages(response.data.data.last_page); 
      } else {
        setError('Unexpected data format received from server');
        setUsers([]);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;  
      setError(axiosError.response?.data?.message || axiosError.message || 'Error fetching users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
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

    if (!selectedTemplate) {
      setResult({
        success: false,
        message: 'Please select an email template'
      });
      return;
    }

    setSending(true);
    setResult(null);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        `${BASE_URL}/api/send-bulk`,
        { 
          user_ids: selectedUsers,
          template_id: selectedTemplate 
        },
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

  const isAllSelected = users.length > 0 && selectedUsers.length === users.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bulk Email Manager</h2>
        <button 
          onClick={handleSendEmails}
          disabled={sending || selectedUsers.length === 0 || !selectedTemplate}
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

      {/* Template Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Email Template
        </label>
        <select
          value={selectedTemplate || ''}
          onChange={(e) => setSelectedTemplate(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">Select a template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} - {template.subject}
            </option>
          ))}
        </select>
      </div>

      <div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="mr-2"
              />
              <span>Select All</span>
            </div>

            <div className="space-y-4 mt-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.id)} 
                    onChange={() => handleSelectUser(user.id)} 
                    className="mr-2"
                  />
                  {user.first_name} {user.last_name} - {user.email}
                </div>
              ))}
            </div>

            {result && (
              <div className={`p-4 mt-4 ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p>{result.message}</p>
                {result.details && (
                  <>
                    <p>Success Count: {result.details.successCount}</p>
                    <p>Failed Emails: {result.details.failedEmails.join(', ')}</p>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 mt-4 bg-red-100 text-red-700">
                <p>{error}</p>
              </div>
            )}

            {/* Pagination controls */}
            <div className="flex justify-between mt-4">
              <button 
                onClick={() => setCurrentPage(currentPage - 1)} 
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>{currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkEmailManager;