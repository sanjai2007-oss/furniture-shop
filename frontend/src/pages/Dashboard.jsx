import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUpRounded as TrendingUpIcon,
  AttachMoneyRounded as RevenueIcon,
  ShoppingBagRounded as OrdersIcon,
  WeekendRounded as ProductsIcon,
  PeopleAltRounded as CustomersIcon,
  AddRounded as AddIcon,
  ArrowForwardRounded as ArrowRightIcon,
  WarningAmberRounded as WarningIcon,
  ReceiptLongRounded as ReceiptIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from 'recharts';
import { dashboardService } from '../services/api';
import { LoadingState, ErrorState, StatusChip } from '../components/common/StateViews';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [salesPeriod, setSalesPeriod] = useState('this_week');
  const [salesChart, setSalesChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getSummary();
      if (res.success && res.data) {
        setData(res.data);
        setSalesChart(res.data.sales_overview || []);
      } else {
        setError(res.message || 'Failed to fetch dashboard metrics');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePeriodChange = async (period) => {
    setSalesPeriod(period);
    setChartLoading(true);
    try {
      const res = await dashboardService.getSalesChart(period);
      if (res.success && res.data) {
        setSalesChart(res.data);
      }
    } catch {
      // quiet fallback
    } finally {
      setChartLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading store analytics & real-time KPIs..." skeletonType="card" count={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const { kpi, recent_orders, top_products, low_stock_alerts } = data || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Welcome & Quick Actions Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629', letterSpacing: '-0.02em' }}>
            Good day, {user?.name?.split(' ')[0] || 'Store Manager'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Here is your showroom's performance and inventory health summary.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products')}
            sx={{
              borderColor: '#DDD8D3',
              color: '#4E3629',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              '&:hover': { borderColor: '#4E3629', backgroundColor: '#FAF9F7' },
            }}
          >
            Manage Catalog
          </Button>
          <Button
            variant="contained"
            startIcon={<ReceiptIcon />}
            onClick={() => navigate('/orders')}
            sx={{
              backgroundColor: '#4E3629',
              color: '#FFFFFF',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(78, 54, 41, 0.2)',
              '&:hover': { backgroundColor: '#3E2723' },
            }}
          >
            Create Order
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={2.5}>
        {/* Total Revenue */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECEAE7',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Sales Revenue
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  ₹{(kpi?.total_sales || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 44, height: 44, borderRadius: '12px' }}>
                <RevenueIcon />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 18, color: '#2E7D32' }} />
              <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 700 }}>
                +{kpi?.total_sales_change_pct}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                vs last month
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Total Orders */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECEAE7',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, textTransform: 'uppercase' }}>
                  Orders Processed
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  {kpi?.total_orders || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 44, height: 44, borderRadius: '12px' }}>
                <OrdersIcon />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 18, color: '#2E7D32' }} />
              <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 700 }}>
                +{kpi?.total_orders_change_pct}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                growth rate
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Furniture Products */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECEAE7',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, textTransform: 'uppercase' }}>
                  Furniture Catalog
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  {kpi?.total_products || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 44, height: 44, borderRadius: '12px' }}>
                <ProductsIcon />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>
                Available in 6 categories
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Active Customers */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECEAE7',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, textTransform: 'uppercase' }}>
                  Registered Clients
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  {kpi?.total_customers || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 44, height: 44, borderRadius: '12px' }}>
                <CustomersIcon />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 18, color: '#2E7D32' }} />
              <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 700 }}>
                +{kpi?.total_customers_change_pct}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                new this month
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Interactive Sales Chart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #ECEAE7',
          p: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E3629' }}>
              Sales Revenue Trend
            </Typography>
            <Typography variant="body2" sx={{ color: '#757575' }}>
              Dynamic revenue and order volume visualization
            </Typography>
          </Box>

          <ButtonGroup size="small" sx={{ borderRadius: '8px' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: '7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'this_year', label: 'This Year' },
            ].map((p) => (
              <Button
                key={p.id}
                variant={salesPeriod === p.id ? 'contained' : 'outlined'}
                onClick={() => handlePeriodChange(p.id)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderColor: '#ECEAE7',
                  backgroundColor: salesPeriod === p.id ? '#4E3629' : 'transparent',
                  color: salesPeriod === p.id ? '#FFFFFF' : '#616161',
                  '&:hover': {
                    backgroundColor: salesPeriod === p.id ? '#3E2723' : '#F5F5F3',
                    borderColor: '#DDD8D3',
                  },
                }}
              >
                {p.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        <Box sx={{ height: 320, width: '100%' }}>
          {chartLoading ? (
            <LoadingState message="Updating chart..." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8D6E63" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8D6E63" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEEB" />
                <XAxis dataKey="label" stroke="#8E8E93" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#8E8E93"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <ChartTooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #ECEAE7',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#4E3629"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Card>

      {/* Middle Row: Top Products & Low Stock Alerts */}
      <Grid container spacing={3}>
        {/* Top Selling Products */}
        <Grid item xs={12} lg={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECEAE7',
              p: 3,
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E3629' }}>
                Top Selling Collections
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/products')}
                endIcon={<ArrowRightIcon />}
                sx={{ textTransform: 'none', color: '#8D6E63', fontWeight: 600 }}
              >
                View all
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(top_products || []).map((prod) => (
                <Box
                  key={prod.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: '12px',
                    backgroundColor: '#FAF9F7',
                    border: '1px solid #F0EEEB',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                    <Avatar
                      variant="rounded"
                      src={prod.image_url}
                      sx={{ width: 48, height: 48, borderRadius: '10px' }}
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                        {prod.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {prod.category} • {prod.units_sold} units sold
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4E3629' }}>
                    ₹{Number(prod.revenue).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Low Stock Alerts */}
        <Grid item xs={12} lg={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECEAE7',
              p: 3,
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ color: '#ED6C02' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E3629' }}>
                  Low Stock Inventory
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => navigate('/inventory')}
                endIcon={<ArrowRightIcon />}
                sx={{ textTransform: 'none', color: '#8D6E63', fontWeight: 600 }}
              >
                Restock now
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(low_stock_alerts || []).map((item) => {
                const pct = Math.min(100, Math.round((item.stock_quantity / (item.minimum_stock_level || 1)) * 100));
                return (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.8,
                      borderRadius: '12px',
                      backgroundColor: item.stock_quantity === 0 ? '#FFF5F5' : '#FFFBF5',
                      border: `1px solid ${item.stock_quantity === 0 ? '#FFCDD2' : '#FFE0B2'}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#777' }}>
                          SKU: {item.sku} • Min Level: {item.minimum_stock_level}
                        </Typography>
                      </Box>
                      <StatusChip status={item.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'} type="stock" />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          flexGrow: 1,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#E0E0E0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: item.stock_quantity === 0 ? '#D32F2F' : '#ED6C02',
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 60, textAlign: 'right' }}>
                        {item.stock_quantity} remaining
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders Section */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #ECEAE7',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E3629' }}>
            Recent Customer Orders
          </Typography>
          <Button
            size="small"
            onClick={() => navigate('/orders')}
            endIcon={<ArrowRightIcon />}
            sx={{ textTransform: 'none', color: '#8D6E63', fontWeight: 600 }}
          >
            All orders
          </Button>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #F0EEEB', borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Payment</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(recent_orders || []).map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  onClick={() => navigate('/orders')}
                  sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell sx={{ fontWeight: 600, color: '#4E3629' }}>#{order.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {order.customer_name || 'Walk-in Client'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>
                      {order.customer_phone || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.items_count} items</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={order.payment_status} type="payment" />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={order.order_status} type="order" />
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#777', fontSize: '0.85rem' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Dashboard;
