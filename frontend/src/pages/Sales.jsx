import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Pagination,
  Chip,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import {
  TrendingUpRounded as TrendingUpIcon,
  AttachMoneyRounded as RevenueIcon,
  ShoppingCartRounded as CartIcon,
  CalendarTodayRounded as CalendarIcon,
  ReceiptLongRounded as ReceiptIcon,
  CategoryRounded as CategoryIcon,
  StarRounded as StarIcon,
  RefreshRounded as RefreshIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { salesService } from '../services/api';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateViews';

// ─── Colour palette ──────────────────────────────────────────
const PIE_COLORS = ['#4E3629', '#8D6E63', '#2E7D32', '#BE9C91', '#5F4339', '#7B5E4F', '#A1887F'];

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(val) || 0);

const formatDate = (isoStr) => {
  if (!isoStr) return '-';
  return new Date(isoStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Summary KPI Card ─────────────────────────────────────────
const KPICard = ({ icon: Icon, iconBg, title, value, sub }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: '16px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #ECEAE7',
      p: 0,
      height: '100%',
    }}
  >
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: '12px',
            backgroundColor: iconBg || '#FAF5EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color: '#4E3629', fontSize: 22 }} />
        </Box>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', mb: 0.3 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: '#757575', fontWeight: 500 }}>
        {title}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: '#9E9E9E', display: 'block', mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ─── Custom chart tooltip ─────────────────────────────────────
const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper
      elevation={3}
      sx={{ p: 1.5, borderRadius: '10px', border: '1px solid #ECEAE7', minWidth: 150 }}
    >
      <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5 }}>{label}</Typography>
      <Typography variant="subtitle2" sx={{ color: '#4E3629', fontWeight: 700 }}>
        {formatCurrency(payload[0]?.value)}
      </Typography>
      {payload[1] && (
        <Typography variant="caption" sx={{ color: '#666' }}>
          {payload[1].value} orders
        </Typography>
      )}
    </Paper>
  );
};

// ─── Custom Pie tooltip ───────────────────────────────────────
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={3} sx={{ p: 1.5, borderRadius: '10px', border: '1px solid #ECEAE7' }}>
      <Typography variant="subtitle2" sx={{ color: '#4E3629', fontWeight: 700 }}>
        {payload[0]?.name}
      </Typography>
      <Typography variant="body2" sx={{ color: '#555' }}>
        {formatCurrency(payload[0]?.value)}
      </Typography>
      <Typography variant="caption" sx={{ color: '#888' }}>
        {payload[0]?.payload?.units_sold?.toLocaleString('en-IN')} units sold
      </Typography>
    </Paper>
  );
};

// ─── Main Component ───────────────────────────────────────────
const Sales = () => {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // ── Fetch all summary / chart data ────────────────────────
  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, trendRes, catRes] = await Promise.all([
        salesService.getSummary(),
        salesService.getMonthlyTrend(),
        salesService.getByCategory(),
      ]);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (trendRes.success) setTrend(trendRes.data || []);
      if (catRes.success) setCategoryData(catRes.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch paginated transactions ───────────────────────────
  const fetchTransactions = useCallback(async (pg = 1) => {
    setTxLoading(true);
    try {
      const res = await salesService.getSales({ page: pg, limit: 15 });
      if (res.success) {
        setTransactions(res.data || []);
        setTotalPages(res.pagination?.total_pages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch {
      // silent — summary error is already shown
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  useEffect(() => {
    fetchTransactions(page);
  }, [page, fetchTransactions]);

  // ── Top category from pie data ─────────────────────────────
  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  if (loading) return <LoadingState message="Loading sales analytics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchSalesData} />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Page Header ── */}
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
            Sales & Revenue
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Lifetime sales analytics across {totalCount.toLocaleString('en-IN')} recorded transactions
          </Typography>
        </Box>
        <Tooltip title={lastRefresh ? `Last refreshed: ${lastRefresh.toLocaleTimeString()}` : ''}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { fetchSalesData(); fetchTransactions(page); }}
            sx={{
              borderColor: '#D6CFC8',
              color: '#4E3629',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: '#4E3629', backgroundColor: '#FAF5EE' },
            }}
          >
            Refresh
          </Button>
        </Tooltip>
      </Box>

      {/* ── KPI Cards Row ── */}
      {summary && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              icon={RevenueIcon}
              iconBg="#FAF5EE"
              title="Total Revenue (Lifetime)"
              value={formatCurrency(summary.total_sales)}
              sub={`${summary.total_orders} total orders`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              icon={CalendarIcon}
              iconBg="#FFF8E1"
              title="This Month"
              value={formatCurrency(summary.this_month)}
              sub="MTD revenue"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              icon={TrendingUpIcon}
              iconBg="#E8F5E9"
              title="This Week"
              value={formatCurrency(summary.this_week)}
              sub="WTD revenue"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              icon={CartIcon}
              iconBg="#EDE7F6"
              title="Today"
              value={formatCurrency(summary.today)}
              sub="Today's revenue"
            />
          </Grid>
        </Grid>
      )}

      {/* ── Charts Row ── */}
      <Grid container spacing={2.5}>

        {/* 30-day Area Chart */}
        <Grid item xs={12} md={7}>
          <Card
            elevation={0}
            sx={{ borderRadius: '16px', border: '1px solid #ECEAE7', p: 0, height: '100%' }}
          >
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                    30-Day Revenue Trend
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>Daily revenue for the past month</Typography>
                </Box>
                <TrendingUpIcon sx={{ color: '#4E3629', fontSize: 28 }} />
              </Box>
              {trend.length === 0 ? (
                <EmptyState
                  icon={TrendingUpIcon}
                  title="No trend data"
                  description="Sales trend will appear once transactions are recorded."
                />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4E3629" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4E3629" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EEEB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#888' }}
                      tickLine={false}
                      axisLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#888' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip content={<CustomAreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4E3629"
                      strokeWidth={2.5}
                      fill="url(#revenueGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#4E3629' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Category Pie */}
        <Grid item xs={12} md={5}>
          <Card
            elevation={0}
            sx={{ borderRadius: '16px', border: '1px solid #ECEAE7', p: 0, height: '100%' }}
          >
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                    Revenue by Category
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>Furniture category breakdown</Typography>
                </Box>
                <CategoryIcon sx={{ color: '#4E3629', fontSize: 28 }} />
              </Box>
              {categoryData.length === 0 ? (
                <EmptyState
                  icon={CategoryIcon}
                  title="No category data"
                  description="Category breakdown will appear once sales are recorded."
                />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="total_revenue"
                        nameKey="category_name"
                        paddingAngle={3}
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<CustomPieTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span style={{ color: '#555', fontSize: 12 }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {topCategory && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: '10px',
                        backgroundColor: '#FAF5EE',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <StarIcon sx={{ color: '#4E3629', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                          Top Category
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4E3629' }}>
                          {topCategory.category_name} — {formatCurrency(topCategory.total_revenue)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Transactions Table ── */}
      <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #ECEAE7' }}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <ReceiptIcon sx={{ color: '#4E3629', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
              Sales Transactions
            </Typography>
            <Chip
              label={totalCount.toLocaleString('en-IN')}
              size="small"
              sx={{ backgroundColor: '#FAF5EE', color: '#4E3629', fontWeight: 700, borderRadius: '6px' }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#888' }}>
            All recorded sales, newest first
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {txLoading ? (
          <Box sx={{ p: 3 }}>
            <LoadingState message="Loading transactions..." skeletonType="table" count={6} />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <EmptyState
              icon={ReceiptIcon}
              title="No transactions yet"
              description="Sales transactions will appear here once orders are placed."
            />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((sale) => (
                  <TableRow key={sale.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>
                        #{sale.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={sale.product_image || undefined}
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            backgroundColor: '#FAF5EE',
                            border: '1px solid #ECEAE7',
                            fontSize: 18,
                            color: '#8D6E63',
                          }}
                        >
                          {!sale.product_image && '🪑'}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: '#1A1A1A', maxWidth: 200 }}
                            noWrap
                          >
                            {sale.product_name || 'Unknown Product'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            Product ID: {sale.product_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sale.category_name || 'General'}
                        size="small"
                        sx={{
                          backgroundColor: '#F5F2EE',
                          color: '#5F4339',
                          fontWeight: 600,
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                        {sale.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                        {formatCurrency(sale.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Order #${sale.order_id}`}
                        size="small"
                        sx={{
                          backgroundColor: '#EDE7F6',
                          color: '#4527A0',
                          fontWeight: 600,
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#555' }}>
                        {formatDate(sale.sale_date)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2.5 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => setPage(val)}
              sx={{ '& .Mui-selected': { backgroundColor: '#4E3629 !important', color: '#FFF' } }}
            />
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default Sales;
