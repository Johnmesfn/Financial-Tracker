import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import styled from "styled-components";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, 
  FiPlus, FiArrowRight
} from "react-icons/fi";
import AddEntryModal from "../components/AddEntryModal";

// ===== Styled Components ===== //
const DashboardContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 1.5rem;
  max-width: 1800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1.5rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.2rem;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 32px rgba(31, 38, 135, 0.2);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.$gradient};
    border-radius: 16px 16px 0 0;
  }

  @media (max-width: 768px) {
    padding: 1.2rem;
  }
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  background: ${props => props.$bgColor};
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: ${props => props.$iconColor};

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.7rem;
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 0.3rem;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const StatLabel = styled.div`
  color: #718096;
  font-size: 0.9rem;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.8rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ChartSection = styled.div`
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  padding: 1.8rem;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    padding: 1.2rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  color: #2d3748;
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const ViewAllButton = styled.button`
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    color: #4f46e5;
    transform: translateX(3px);
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const TransactionTable = styled.div`
  width: 100%;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 600px;

  thead {
    background: rgba(237, 242, 247, 0.6);
  }
  
  th {
    text-align: left;
    padding: 1rem 1.2rem;
    color: #4a5568;
    font-weight: 700;
    font-size: 0.85rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  td {
    padding: 1rem 1.2rem;
    border-bottom: 1px solid #edf2f7;
    font-size: 0.95rem;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  tr {
    transition: background 0.2s ease;
    &:hover {
      background: rgba(237, 242, 247, 0.4);
    }
  }

  @media (max-width: 768px) {
    min-width: 400px;
    
    th, td {
      padding: 0.8rem;
      font-size: 0.85rem;
    }
  }
`;

const AmountCell = styled.td`
  font-weight: 700;
  color: ${({ $type }) => $type === 'income' ? '#10b981' : '#ef4444'};
`;

const CategoryTag = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 12px;
  color: #4f46e5;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
`;

const ActionButton = styled.button`
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.9rem 1.5rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);
  
  &:hover {
    background: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(99, 102, 241, 0.3);
  }

  @media (max-width: 768px) {
    padding: 0.7rem 1.2rem;
    font-size: 0.85rem;
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
  
  @media (max-width: 768px) {
    height: 250px;
  }
`;

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

// ===== Component ===== //
const Dashboard = () => {
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch dashboard data from multiple endpoints
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, trendsRes, breakdownRes, entriesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/entries/summary"),
        axios.get("http://localhost:5000/api/entries/trends"),
        axios.get("http://localhost:5000/api/entries/category-breakdown"),
        axios.get("http://localhost:5000/api/entries?limit=5"),
      ]);

      setSummary(summaryRes.data);
      
      // Format trends data for the chart
      const formattedTrends = trendsRes.data.map(item => {
        const monthDate = new Date(item._id + "-01");
        const monthLabel = monthDate.toLocaleString(undefined, { 
          month: "short", 
          year: "2-digit" 
        });
        
        const trendData = {
          period: monthLabel,
          income: 0,
          expense: 0
        };
        
        item.data.forEach(dataItem => {
          if (dataItem.type === 'income') trendData.income = dataItem.total;
          if (dataItem.type === 'expense') trendData.expense = dataItem.total;
        });
        
        return trendData;
      });
      
      setTrends(formattedTrends);
      setCategories(breakdownRes.data);
      setTransactions(entriesRes.data.entries || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format currency display
  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);

  if (loading) {
    return (
      <DashboardContainer>
        <div className="text-center py-16 text-gray-500 text-lg">
          Loading financial dashboard...
        </div>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <div className="text-center py-16 text-red-500 text-lg">
          {error}
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Stats Summary */}
      <StatsGrid>
        <StatCard $gradient="linear-gradient(90deg, #10b981, #059669)">
          <StatIcon $bgColor="rgba(16, 185, 129, 0.15)" $iconColor="#10b981">
            <FiTrendingUp size={24} />
          </StatIcon>
          <StatInfo>
            <StatLabel>TOTAL INCOME</StatLabel>
            <StatValue>
              {formatCurrency(summary.income)}
            </StatValue>
          </StatInfo>
        </StatCard>
        
        <StatCard $gradient="linear-gradient(90deg, #ef4444, #dc2626)">
          <StatIcon $bgColor="rgba(239, 68, 68, 0.15)" $iconColor="#ef4444">
            <FiTrendingDown size={24} />
          </StatIcon>
          <StatInfo>
            <StatLabel>TOTAL EXPENSES</StatLabel>
            <StatValue>
              {formatCurrency(summary.expense)}
            </StatValue>
          </StatInfo>
        </StatCard>
        
        <StatCard $gradient="linear-gradient(90deg, #6366f1, #4f46e5)">
          <StatIcon $bgColor="rgba(99, 102, 241, 0.15)" $iconColor="#6366f1">
            <FiDollarSign size={24} />
          </StatIcon>
          <StatInfo>
            <StatLabel>CURRENT BALANCE</StatLabel>
            <StatValue>
              {formatCurrency(summary.balance)}
            </StatValue>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      {/* Action Button */}
      <div className="flex justify-end">
        <ActionButton onClick={() => setShowAddModal(true)}>
          <FiPlus size={18} /> Add New Transaction
        </ActionButton>
      </div>

      {/* Main Content */}
      <ContentGrid>
        {/* Left Column - Monthly Trends */}
        <ChartSection>
          <SectionHeader>
            <SectionTitle>Monthly Income vs Expenses</SectionTitle>
          </SectionHeader>
          
          <ChartContainer>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={trends} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <XAxis 
                    dataKey="period" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#718096', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#718096', fontSize: 11 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '10px',
                      border: '1px solid rgba(200, 200, 255, 0.3)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      padding: '12px',
                      fontSize: '13px'
                    }}
                  />
                  <Bar 
                    dataKey="income" 
                    name="Income" 
                    fill="#10b981" 
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                  <Bar 
                    dataKey="expense" 
                    name="Expense" 
                    fill="#ef4444" 
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No trend data available
              </div>
            )}
          </ChartContainer>
        </ChartSection>

        {/* Middle Column - Recent Transactions */}
        <ChartSection>
          <SectionHeader>
            <SectionTitle>Recent Transactions</SectionTitle>
            <ViewAllButton>
              View All
              <FiArrowRight />
            </ViewAllButton>
          </SectionHeader>
          
          {transactions.length > 0 ? (
            <TransactionTable>
              <Table>
                <thead>
                  <tr>
                    <th>DESCRIPTION</th>
                    <th>CATEGORY</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction._id}>
                      <td className="font-semibold" title={transaction.title}>
                        {transaction.title}
                      </td>
                      <td>
                        <CategoryTag>
                          {transaction.category}
                        </CategoryTag>
                      </td>
                      <td className="text-gray-600">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <AmountCell $type={transaction.type}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </AmountCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TransactionTable>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No transactions found
            </div>
          )}
        </ChartSection>
      </ContentGrid>

      {/* Bottom Section - Spending by Category */}
      <ChartSection>
        <SectionHeader>
          <SectionTitle>Spending by Category</SectionTitle>
        </SectionHeader>
        
        <ChartContainer>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={3}
                  label={({ _id, percent }) => 
                    `${_id} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {categories.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '10px',
                    border: '1px solid rgba(200, 200, 255, 0.3)',
                    padding: '12px',
                    fontSize: '13px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No category data available
            </div>
          )}
        </ChartContainer>
      </ChartSection>

      {/* Add Transaction Modal */}
      <AddEntryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchDashboardData}
      />
    </DashboardContainer>
  );
};

export default Dashboard;