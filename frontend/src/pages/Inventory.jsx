import React, { useState, useEffect } from 'react';
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
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  IconButton,
  Tooltip,
  Pagination,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Inventory2Rounded as InventoryIcon,
  WarningAmberRounded as WarningIcon,
  RemoveCircleOutlineRounded as OutOfStockIcon,
  CheckCircleOutlineRounded as InStockIcon,
  AccountBalanceWalletRounded as ValuationIcon,
  TuneRounded as AdjustIcon,
  HistoryRounded as HistoryIcon,
} from '@mui/icons-material';
import { inventoryService, productsService } from '../services/api';
import { LoadingState, EmptyState, ErrorState, StatusChip } from '../components/common/StateViews';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'MANAGER';

  const [activeTab, setActiveTab] = useState(0); // 0 = Stock Overview, 1 = Audit Transaction History
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stock table state
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, available, low_stock, out_of_stock
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);

  // Transactions log state
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    operation: 'add',
    quantity: '5',
    reason: 'Warehouse restock delivery',
  });
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const res = await inventoryService.getSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch {
      // quiet fallback
    }
  };

  // Fetch products inventory
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: stockPage,
        limit: 10,
        search: stockSearch.trim() || undefined,
        status_filter: stockFilter !== 'all' ? stockFilter : undefined,
      };
      const res = await inventoryService.getProducts(params);
      if (res.success) {
        setProducts(res.data || []);
        if (res.pagination) {
          setStockTotalPages(res.pagination.total_pages);
        }
      } else {
        setError(res.message || 'Failed to load stock data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getTransactions({ page: txPage, limit: 15 });
      if (res.success) {
        setTransactions(res.data || []);
        if (res.pagination) {
          setTxTotalPages(res.pagination.total_pages);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading transaction log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchProducts();
    } else {
      fetchTransactions();
    }
  }, [activeTab, stockPage, stockFilter, txPage]);

  const handleOpenAdjust = (prod) => {
    setSelectedProduct(prod);
    setAdjustForm({
      operation: 'add',
      quantity: '5',
      reason: 'Warehouse restock delivery',
    });
    setAdjustModalOpen(true);
  };

  const handleSaveAdjust = async () => {
    if (!selectedProduct) return;
    setSubmittingAdjust(true);
    try {
      await inventoryService.adjustStock(selectedProduct.id, {
        operation: adjustForm.operation,
        quantity: parseInt(adjustForm.quantity, 10),
        reason: adjustForm.reason,
      });
      setSnackbar({ open: true, message: 'Stock adjusted and transaction logged!', severity: 'success' });
      setAdjustModalOpen(false);
      fetchSummary();
      fetchProducts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Adjustment failed',
        severity: 'error',
      });
    } finally {
      setSubmittingAdjust(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629' }}>
          Warehouse & Stock Inventory
        </Typography>
        <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
          Real-time stock thresholds, valuation intelligence, and audit transaction records
        </Typography>
      </Box>

      {/* KPI Valuation & Stock Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.2, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Total Valuation</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  ₹{(summary?.total_inventory_valuation || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 40, height: 40, borderRadius: '10px' }}>
                <ValuationIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.2, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Catalog Items</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  {summary?.total_products || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 40, height: 40, borderRadius: '10px' }}>
                <InventoryIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.2, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>In Good Stock</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#2E7D32', mt: 0.5 }}>
                  {summary?.available_stock_count || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', width: 40, height: 40, borderRadius: '10px' }}>
                <InStockIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.2, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Low Stock Alert</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#ED6C02', mt: 0.5 }}>
                  {summary?.low_stock_count || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FFF3E0', color: '#ED6C02', width: 40, height: 40, borderRadius: '10px' }}>
                <WarningIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={2.4}>
          <Card elevation={0} sx={{ p: 2.2, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Out of Stock</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#D32F2F', mt: 0.5 }}>
                  {summary?.out_of_stock_count || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#FFEBEE', color: '#D32F2F', width: 40, height: 40, borderRadius: '10px' }}>
                <OutOfStockIcon />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs Container */}
      <Card elevation={0} sx={{ borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7', p: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            borderBottom: '1px solid #ECEAE7',
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#757575',
              '&.Mui-selected': { color: '#4E3629' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#4E3629', height: 3 },
          }}
        >
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Stock Levels & Health" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Audit Transaction Log" />
        </Tabs>

        {activeTab === 0 ? (
          /* Tab 1: Current Stock Levels */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Filter toolbar */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between' }}>
              <TextField
                size="small"
                placeholder="Search stock by item name or SKU..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8D6E63' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 340 } }}
              />

              <FormControl size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
                <InputLabel>Stock Status Filter</InputLabel>
                <Select
                  value={stockFilter}
                  label="Stock Status Filter"
                  onChange={(e) => {
                    setStockFilter(e.target.value);
                    setStockPage(1);
                  }}
                >
                  <MenuItem value="all">All Products</MenuItem>
                  <MenuItem value="available">Healthy Stock</MenuItem>
                  <MenuItem value="low_stock">Low Stock Alerts</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {loading ? (
              <LoadingState message="Fetching stock levels..." skeletonType="table" count={5} />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchProducts} />
            ) : products.length === 0 ? (
              <EmptyState title="No stock items match your criteria" />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ECEAE7', borderRadius: '12px' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Furniture Piece</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>SKU</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Stock Units</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Stock Gauge</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Total Valuation</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Status</TableCell>
                      {canManage && <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Adjust</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((p) => {
                      const gauge = Math.min(100, Math.round((p.stock_quantity / Math.max(p.minimum_stock_level * 2, 1)) * 100));
                      const valuation = p.price * p.stock_quantity;
                      const isLow = p.stock_quantity <= p.minimum_stock_level && p.stock_quantity > 0;
                      const isOut = p.stock_quantity <= 0;

                      return (
                        <TableRow key={p.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                variant="rounded"
                                src={p.image_url}
                                sx={{ width: 44, height: 44, borderRadius: '8px' }}
                              />
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                                  {p.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#888' }}>
                                  {p.category?.name || 'Furniture'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', color: '#666' }}>{p.sku}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>₹{Number(p.price).toLocaleString('en-IN')}</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {p.stock_quantity}
                            <Typography component="span" variant="caption" sx={{ color: '#888', ml: 0.5 }}>
                              / min {p.minimum_stock_level}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <LinearProgress
                              variant="determinate"
                              value={gauge}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#F0EEEB',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: isOut ? '#D32F2F' : isLow ? '#ED6C02' : '#2E7D32',
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>
                            ₹{Number(valuation).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={p.status} type="stock" />
                          </TableCell>
                          {canManage && (
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AdjustIcon />}
                                onClick={() => handleOpenAdjust(p)}
                                sx={{
                                  borderColor: '#DDD8D3',
                                  color: '#4E3629',
                                  textTransform: 'none',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  '&:hover': { borderColor: '#4E3629', backgroundColor: '#FAF9F7' },
                                }}
                              >
                                Adjust
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {stockTotalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={stockTotalPages}
                  page={stockPage}
                  onChange={(e, val) => setStockPage(val)}
                  sx={{ '& .Mui-selected': { backgroundColor: '#4E3629 !important', color: '#FFF' } }}
                />
              </Box>
            )}
          </Box>
        ) : (
          /* Tab 2: Audit Transaction History */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {loading ? (
              <LoadingState message="Loading inventory audit logs..." skeletonType="table" count={6} />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchTransactions} />
            ) : transactions.length === 0 ? (
              <EmptyState title="No transactions logged yet" />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ECEAE7', borderRadius: '12px' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Quantity Change</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Before → After</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Reason / Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => {
                      const isPositive = tx.quantity > 0;
                      return (
                        <TableRow key={tx.id} hover>
                          <TableCell sx={{ color: '#777', fontSize: '0.85rem' }}>
                            {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {tx.product_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              SKU: {tx.product_sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={tx.transaction_type}
                              sx={{
                                fontWeight: 700,
                                backgroundColor:
                                  tx.transaction_type === 'Purchase'
                                    ? '#E8F5E9'
                                    : tx.transaction_type === 'Sale'
                                    ? '#E3F2FD'
                                    : '#FFF3E0',
                                color:
                                  tx.transaction_type === 'Purchase'
                                    ? '#2E7D32'
                                    : tx.transaction_type === 'Sale'
                                    ? '#1565C0'
                                    : '#E65100',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: isPositive ? '#2E7D32' : '#D32F2F' }}>
                            {isPositive ? `+${tx.quantity}` : tx.quantity} units
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {tx.previous_quantity} → {tx.new_quantity}
                          </TableCell>
                          <TableCell sx={{ color: '#555', fontStyle: 'italic' }}>
                            {tx.reason || 'General inventory adjustment'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {txTotalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={txTotalPages}
                  page={txPage}
                  onChange={(e, val) => setTxPage(val)}
                  sx={{ '& .Mui-selected': { backgroundColor: '#4E3629 !important', color: '#FFF' } }}
                />
              </Box>
            )}
          </Box>
        )}
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#4E3629' }}>
          Adjust Stock for {selectedProduct?.name}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '10px !important' }}>
          <Typography variant="body2" sx={{ color: '#777' }}>
            Current stock: <strong>{selectedProduct?.stock_quantity} units</strong> (SKU: {selectedProduct?.sku})
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Operation Type</InputLabel>
            <Select
              value={adjustForm.operation}
              label="Operation Type"
              onChange={(e) => setAdjustForm({ ...adjustForm, operation: e.target.value })}
            >
              <MenuItem value="add">Add Units (New purchase / arrival)</MenuItem>
              <MenuItem value="subtract">Subtract Units (Damaged / Return)</MenuItem>
              <MenuItem value="set">Set Exact Count (Physical audit)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Quantity Units"
            type="number"
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
          />

          <TextField
            fullWidth
            size="small"
            label="Adjustment Reason"
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            placeholder="e.g. Verified during quarterly warehouse count"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAdjustModalOpen(false)} sx={{ color: '#777', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAdjust}
            disabled={submittingAdjust}
            sx={{
              backgroundColor: '#4E3629',
              color: '#FFFFFF',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#3E2723' },
            }}
          >
            {submittingAdjust ? <CircularProgress size={20} color="inherit" /> : 'Save & Log Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory;
