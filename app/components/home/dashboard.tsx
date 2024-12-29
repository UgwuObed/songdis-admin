"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BASE_URL } from '../apiConfig';
import axios from 'axios';
import { Music, Users, Play, DollarSign } from 'lucide-react';
import {
  ChartBarIcon,
  MusicalNoteIcon,
  UsersIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  EnvelopeIcon
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

interface PaginatedResponse {
  current_page: number;
  data: User[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

interface ApiResponse {
  status: string;
  message: string;
  count: number;
  data: PaginatedResponse;
}

const Dashboard = () => {
  const router = useRouter();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
    
        const response = await axios.get<ApiResponse>(`${BASE_URL}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        const count = response.data.count ?? 0; 
        setUserCount(count);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Error fetching user data');
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    

    fetchTotalUsers();
  }, [router]);

  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const renderTotalUsers = () => {
    if (isLoading) return 'Loading...';
    if (error) return 'Error loading data';
    if (userCount === null || userCount === undefined) return '0'; 
    return userCount.toLocaleString(); 
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-red-700 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8">Songdis Admin</h2>
          <nav className="space-y-2">
            <a className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20" href="#">
              <ChartBarIcon className="w-6 h-6" />
              <span>Dashboard</span>
            </a>
            <a className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10" href="/releases">
              <MusicalNoteIcon className="w-6 h-6" />
              <span>Releases</span>
            </a>
            <a className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10" href="#">
              <UsersIcon className="w-6 h-6" />
              <span>Artists</span>
            </a>
            <a className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10" href="#">
              <PlayIcon className="w-6 h-6" />
              <span>Streams</span>
            </a>
            <a className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10" href="#">
              <ArrowDownTrayIcon className="w-6 h-6" />
              <span>Downloads</span>
            </a>
            <a className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10" href="#">
              <CurrencyDollarIcon className="w-6 h-6" />
              <span>Earnings</span>
            </a>

            <a className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10" href="/email">
              <EnvelopeIcon className="w-6 h-6" />
              <span>Email Marketing</span>
            </a>

            <a className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10" href="/promo">
              <CurrencyDollarIcon className="w-6 h-6" />
              <span>Promo</span>
            </a>
          </nav>
        </div>
        <div className="p-6 mt-auto">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 cursor-pointer">
            <Cog6ToothIcon className="w-6 h-6" />
            <span>Settings</span>
          </div>
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 cursor-pointer" onClick={handleLogout}>
            <QuestionMarkCircleIcon className="w-6 h-6" />
            <span>Support</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <BellIcon className="w-6 h-6" />
              </button>
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-purple-100 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Artists</p>
                  <p className="text-2xl font-bold">{renderTotalUsers()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-green-600 mt-2">↑ 12% from last month</p>
            </div>

            <div className="bg-blue-100 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Releases</p>
                  <p className="text-2xl font-bold">856</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-green-600 mt-2">↑ 8% from last month</p>
            </div>

            <div className="bg-green-100 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Streams</p>
                  <p className="text-2xl font-bold">2.3M</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-green-600 mt-2">↑ 15% from last month</p>
            </div>

            <div className="bg-red-100 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenue</p>
                  <p className="text-2xl font-bold">$45.2K</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-green-600 mt-2">↑ 10% from last month</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue Overview</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Releases</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                      <Music className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Release Title #{item}</h3>
                      <p className="text-sm text-gray-500">Artist Name</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">1.2K streams</p>
                      <p className="text-sm text-gray-500">2h ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
