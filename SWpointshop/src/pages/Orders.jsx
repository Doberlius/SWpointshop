import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
  TablePagination,
  useTheme,
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

function Orders() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [qrDialog, setQrDialog] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();

  const { data: orders, isLoading, error, refetch } = useQuery(
    ['orders', user?.id],
    async () => {
      if (!user) return null;
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      enabled: !!user,
      refetchInterval: 10000, // Refetch every 10 seconds to check for order status updates
      refetchOnWindowFocus: true,
    }
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'paid':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewQR = async (orderId) => {
    setQrLoading(true);
    setQrError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(response.data);
      setQrDialog(true);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      setQrError('Failed to load QR code. Please try again.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate the slice of data to show based on pagination
  const getDisplayedOrders = () => {
    if (!orders) return [];
    const startIndex = page * rowsPerPage;
    return orders.slice(startIndex, startIndex + rowsPerPage);
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Please log in to view your orders
        </Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load orders. Please try again later.
        </Alert>
        <Button variant="contained" onClick={() => refetch()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        ออเดอร์ของฉัน
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>เลขที่ออเดอร์</TableCell>
                <TableCell>วันที่</TableCell>
                <TableCell>ยอดรวม</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>การชำระเงิน</TableCell>
                <TableCell>ดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getDisplayedOrders()?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    ไม่พบรายการออเดอร์
                  </TableCell>
                </TableRow>
              ) : (
                getDisplayedOrders()?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>฿{Number(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status === 'pending' ? 'รอดำเนินการ' : 
                               order.status === 'paid' ? 'ชำระเงินแล้ว' :
                               order.status === 'shipped' ? 'จัดส่งแล้ว' :
                               order.status === 'delivered' ? 'ได้รับสินค้าแล้ว' :
                               order.status === 'cancelled' ? 'ยกเลิก' : order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 2,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.payment_status === 'completed' ? 'ชำระเงินแล้ว' : 'รอชำระเงิน'}
                        color={order.payment_status === 'completed' ? 'success' : 'warning'}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 2,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {order.payment_status === 'pending' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewQR(order.id)}
                          disabled={qrLoading}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                          }}
                        >
                          {qrLoading ? 'กำลังโหลด...' : 'ดู QR Code'}
                        </Button>
                      ) : (
                        <Typography 
                          variant="body2" 
                          color="success.main"
                          sx={{ fontWeight: 500 }}
                        >
                          สำเร็จ
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={orders?.length || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="แถวต่อหน้า"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
          sx={{
            '.MuiTablePagination-select': {
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              p: '4px 8px',
              '&:focus': {
                borderColor: theme.palette.primary.main,
              },
            },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontWeight: 500,
            },
          }}
        />
      </Paper>

      {/* Order Details Dialog */}
      <Dialog
        open={qrDialog}
        onClose={() => {
          setQrDialog(false);
          setSelectedOrder(null);
          setQrError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ออเดอร์ #{selectedOrder?.id} - QR Code สำหรับชำระเงิน
        </DialogTitle>
        <DialogContent>
          {qrLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : qrError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {qrError}
            </Alert>
          ) : selectedOrder?.promptpay_qr ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <img
                src={selectedOrder.promptpay_qr}
                alt="PromptPay QR Code"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                สแกน QR code ด้วยแอพธนาคารของคุณเพื่อชำระเงิน
              </Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                ยอดชำระ: ฿{Number(selectedOrder.total_amount).toFixed(2)}
              </Typography>
            </Box>
          ) : (
            <Alert severity="info">
              ไม่พบ QR code สำหรับออเดอร์นี้
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              รายการสินค้า:
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>สินค้า</TableCell>
                    <TableCell align="right">จำนวน</TableCell>
                    <TableCell align="right">ราคา</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrder?.items?.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">฿{Number(item.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default Orders; 