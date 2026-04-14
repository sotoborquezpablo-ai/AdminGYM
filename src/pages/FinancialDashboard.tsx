/**
 * src/pages/FinancialDashboard.tsx
 * Dashboard combining financial, scheduling, and profile views for a holistic overview.
 */

import React from 'react';
import { DollarSign, FaChartLine, Users, CalendarCheck } from 'lucide-react';

// --- Helper Components ---

/**
 * Header component for section titles.
 * @param {object} props - Props containing title and icon.
 */
const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center mb-6 border-b pb-2">
        <Icon className="w-8 h-8 text-indigo-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2 >
    </div>
);

/**
 * StatCard component to display key metrics.
 * @param {object} props - Props containing title, value, and icon.
 */
const StatCard = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition duration-300 hover:shadow-lg">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
            <Icon className="w-6 h-6 text-indigo-500" />
        </div >
        <div className="mt-1 flex justify-between items-baseline">
            <p className="text-3xl font-extrabold text-gray-900">{value}</p>
        </div >
    </div >
);

/**
 * Displays a container component that centralizes the structure for the dashboard.
 */
const Dashboard = () => {
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard Overview</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Sales Metrics Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Sales</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">$1.2M</p>
                    <p className="text-sm text-green-600 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8m8-8l-8 8"></path></svg>
                        +12% vs last month
                    </p>
                </div>

                {/* Leads Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">New Leads</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">2,450</p>
                    <p className="text-sm text-red-600 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7l7-7"></path></svg>
                        -3% vs last month
                    </p>
                </div>

                {/* Conversion Rate Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">4.8%</p>
                    <p className="text-sm text-green-600 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8m8-8l-8 8"></path></svg>
                        +0.5% vs last month
                    </p>
                </div >
            </div >

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Graph Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales Performance (Last 6 Months)</h2>
                    {/* Placeholder for chart visualization */}
                    <div className="h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                        <p className="text-gray-500">Placeholder for Chart Area</p>
                    </div >
                </div>

                {/* Leads Distribution Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Lead Source Distribution</h2>
                    {/* Placeholder for donut chart visualization */}
                    <div className="h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                        <p className="text-gray-500">Placeholder for Donut Chart Area</p>
                    </div >
                </div>
            </div>
        </div>
    );
}

export default Dashboard;