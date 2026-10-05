import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import {
  PictureAsPdfRounded as PdfIcon,
  TableChartRounded as ExcelIcon,
  AttachMoneyRounded as RevenueIcon,
  ShoppingBagRounded as OrdersIcon,
  TrendingUpRounded as TrendingIcon,
  CategoryRounded as CategoryIcon,
  ChairRounded as FurnitureIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { reportsService } from '../services/api';
import { LoadingState, ErrorState } from '../components/common/StateViews';

const PIE_COLORS = ['#4E3629', '#8D6E63', '#2E7D32', '#BE9C91', '#5F4339', '#7B5E4F'];

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsService.getSummary();
      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        setError(res.message || 'Failed to fetch executive business reports');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadPdf = () => {
    window.open(reportsService.getPdfExportUrl(), '_blank');
  };

  const handleDownloadExcel = () => {
    window.open(reportsService.getExcelExportUrl(), '_blank');
  };

  if (loading) {
    return <LoadingState message="Compiling executive intelligence and financial graphs..." skeletonType="card" count={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReports} />;
  }

  const { overview, revenue_chart, category_chart, top_products_chart, order_status_chart } = reportData || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header & Export Action Buttons */}
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
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629' }}>
            Executive Business Intelligence
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Showroom sales analysis, revenue streams, and automated export documents
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={handleDownloadExcel}
            sx={{
              borderColor: '#2E7D32',
              color: '#2E7D32',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: '#FFFFFF',
              '&:hover': { borderColor: '#1B5E20', backgroundColor: '#E8F5E9' },
            }}
          >
            Export Excel (.xlsx)
          </Button>

          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleDownloadPdf}
            sx={{
              backgroundColor: '#4E3629',
              color: '#FFFFFF',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(78, 54, 41, 0.2)',
              '&:hover': { backgroundColor: '#3E2723' },
            }}
          >
            Download PDF Report
          </Button>
        </Box>
      </Box>

      {/* KPI Overview Metrics */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Total Revenue</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  ₹{(overview?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 42, height: 42, borderRadius: '10px' }}>
                <RevenueIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Total Orders</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  {overview?.total_orders || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 42, height: 42, borderRadius: '10px' }}>
                <OrdersIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Average Order Value</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  ₹{(overview?.average_order_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 42, height: 42, borderRadius: '10px' }}>
                <TrendingIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Units Delivered</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  {overview?.total_items_sold || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 42, height: 42, borderRadius: '10px' }}>
                <FurnitureIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Leading Collection</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {overview?.top_category || 'Living Room'}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 42, height: 42, borderRadius: '10px' }}>
                <CategoryIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Visual Charts: Row 1 */}
      <Grid container spacing={3}>
        {/* Monthly Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ p: 3, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E3629', mb: 0.5 }}>
              Monthly Showroom Revenue
            </Typography>
            <Typography variant="body2" sx={{ color: '#757575', mb: 3 }}>
              Annual distribution of gross sales across months
            </Typography>

            <Box sx={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue_chart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEEB" />
                  <XAxis dataKey="name" stroke="#8E8E93" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#8E8E93"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <ChartTooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #ECEAE7',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Bar dataKey="value" fill="#4E3629" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Category Share Donut */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ p: 3, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E3629', mb: 0.5 }}>
              Category Revenue Share
            </Typography>
            <Typography variant="body2" sx={{ color: '#757575', mb: 2 }}>
              Breakdown across furniture types
            </Typography>

            <Box sx={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={category_chart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {(category_chart || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #ECEAE7',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Visual Charts: Row 2 */}
      <Grid container spacing={3}>
        {/* Top 5 Products Bar */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ p: 3, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E3629', mb: 0.5 }}>
              Top 5 Revenue Generating Collections
            </Typography>
            <Typography variant="body2" sx={{ color: '#757575', mb: 3 }}>
              Total sales revenue per signature furniture piece
            </Typography>

            <Box sx={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top_products_chart}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0EEEB" />
                  <XAxis type="number" stroke="#8E8E93" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <YAxis type="category" dataKey="name" stroke="#555" fontSize={11} width={130} />
                  <ChartTooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="#8D6E63" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Order Status Distribution */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ p: 3, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E3629', mb: 0.5 }}>
              Fulfillment Pipeline Volume
            </Typography>
            <Typography variant="body2" sx={{ color: '#757575', mb: 3 }}>
              Distribution of orders across status stages
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(order_status_chart || []).map((st) => (
                <Box
                  key={st.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: '10px',
                    backgroundColor: '#FAF9F7',
                    border: '1px solid #F0EEEB',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#333' }}>
                    {st.name}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4E3629' }}>
                    {st.value} orders
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
