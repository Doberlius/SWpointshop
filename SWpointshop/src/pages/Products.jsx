import { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  Alert,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Fade,
  Chip,
  IconButton,
  Zoom,
} from '@mui/material';
import {
  Search as SearchIcon,
  Sort as SortIcon,
  ShoppingCart as CartIcon,
  LocalOffer as LocalOfferIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';

function Products() {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState('price-low');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [exchangeDialog, setExchangeDialog] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [imagePreview, setImagePreview] = useState({
    open: false,
    image: '',
    name: ''
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const { addToCart } = useCart();
  const { user, updatePoints } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery('products', async () => {
    const response = await axios.get('http://localhost:3005/api/products');
    return response.data;
  });

  const { data: couponRates } = useQuery('couponRates', async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:3005/api/points/coupon-rates', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, {
    enabled: !!user
  });

  const { data: userCoupons } = useQuery('userCoupons', async () => {
    if (!user) return [];
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:3005/api/points/coupons', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, {
    enabled: !!user
  });

  const exchangePointsMutation = useMutation(
    async (points_amount) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3005/api/points/exchange-coupon',
        { points_amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Update points immediately using the updatePoints function
        const newPoints = user.points - selectedRate.points;
        updatePoints(newPoints);
        
        queryClient.invalidateQueries('userCoupons');
        queryClient.invalidateQueries(['user', user?.id]);
        setSnackbar({
          open: true,
          message: 'Successfully exchanged points for coupon!',
          severity: 'success'
        });
        setExchangeDialog(false);
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to exchange points',
          severity: 'error'
        });
      }
    }
  );

  const handleAddToCart = (product) => {
    addToCart(product);
    setSnackbar({
      open: true,
      message: 'ใส่ตะกร้าแล้ว!',
      severity: 'success'
    });
  };

  const handleExchange = () => {
    if (selectedRate) {
      exchangePointsMutation.mutate(selectedRate.points);
    }
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = filteredProducts?.sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return a.price - b.price;
    }
  });

  const renderProducts = () => {
    if (!sortedProducts?.length) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            ไม่พบสินค้า
          </Typography>
        </Box>
      );
    }

    return sortedProducts.map((product) => (
      <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
        <Fade in={true}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardMedia
              component="img"
              sx={{
                height: 280,
                objectFit: 'contain',
                bgcolor: 'background.paper',
                p: 2,
                cursor: 'pointer',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
              image={product.image_url || 'https://source.unsplash.com/random?product'}
              alt={product.name}
              onClick={() => setImagePreview({
                open: true,
                image: product.image_url || 'https://source.unsplash.com/random?product',
                name: product.name
              })}
            />
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 500 }}>
                {product.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Stock: {product.stock} units
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                  {Number(product.price).toFixed(2)} บาท
                </Typography>
                {product.points_reward > 0 && (
                  <Chip
                    icon={<LocalOfferIcon />}
                    label={`+${product.points_reward} points`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Box>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleAddToCart(product)}
                disabled={!user}
                startIcon={<CartIcon />}
                sx={{
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {user ? 'เพิ่มลงตะกร้า' : 'กรุณาเข้าสู่ระบบ'}
              </Button>
            </CardActions>
          </Card>
        </Fade>
      </Grid>
    ));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Points Exchange Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          gap: 2 
        }}>
          <LocalOfferIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 60,
                  height: 4,
                  backgroundColor: 'primary.main',
                  borderRadius: 2,
                }
              }}
            >
              แลกคูปอง
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              แต้มที่มี: <span style={{ color: theme.palette.primary.main, fontWeight: 600 }}>{user?.points || 0}</span> points
            </Typography>
          </Box>
        </Box>
        
        <Paper 
          elevation={3}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            mb: 4,
            '& .MuiTableCell-head': {
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 600,
            },
          }}
        >
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>แต้มที่ต้องใช้</TableCell>
                  <TableCell>ลดได้</TableCell>
                  <TableCell align="right">กดปุ่มเพื่อแลก</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {couponRates?.map((rate) => (
                  <TableRow 
                    key={rate.points}
                    sx={{
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {rate.points} points
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" color="primary" sx={{ fontWeight: 500 }}>
                        {rate.discount} บาท
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="medium"
                        disabled={!user || (user?.points || 0) < rate.points}
                        onClick={() => {
                          setSelectedRate(rate);
                          setExchangeDialog(true);
                        }}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          textTransform: 'none',
                          boxShadow: theme.shadows[2],
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4],
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        แลกแต้ม
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {userCoupons?.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <LocalOfferIcon sx={{ fontSize: 30, color: 'primary.main' }} />
              คูปองที่คุณมี
            </Typography>
            <Paper 
              elevation={3}
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                '& .MuiTableCell-head': {
                  backgroundColor: 'grey.100',
                  fontWeight: 600,
                },
              }}
            >
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Coupon ID</TableCell>
                      <TableCell>ส่วนลด</TableCell>
                      <TableCell>แต้มที่ใช้ไป</TableCell>
                      <TableCell>สร้างเมื่อวันที่</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(rowsPerPage > 0
                      ? userCoupons.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      : userCoupons
                    ).map((coupon) => (
                      <TableRow 
                        key={coupon.id}
                        sx={{
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={`#${coupon.id}`}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 500 }}>
                          {Number(coupon.discount_amount).toFixed(2)} บาท
                        </TableCell>
                        <TableCell>{coupon.points_used} points</TableCell>
                        <TableCell>{new Date(coupon.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={userCoupons.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '& .MuiTablePagination-select': {
                    borderRadius: 1,
                  },
                  '& .MuiTablePagination-selectIcon': {
                    color: 'primary.main',
                  },
                }}
                labelRowsPerPage="แถวต่อหน้า"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
                }
              />
            </Paper>
          </Box>
        )}
      </Box>

      {/* Filters */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 3,
          mb: 4,
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SortIcon fontSize="small" />
                  เรียงจาก
                </Box>
              </InputLabel>
              <Select
                value={sortBy}
                label="เรียงจาก"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <MenuItem value="price-low">ราคา: ต่ำ ไป สูง</MenuItem>
                <MenuItem value="price-high">ราคา: สูง ไป ต่ำ</MenuItem>
                <MenuItem value="name">ชื่อ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ค้นหาสินค้า"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Products Grid */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={4}>
          {renderProducts()}
        </Grid>
      </Box>

      {/* Exchange Dialog */}
      <Dialog
        open={exchangeDialog}
        onClose={() => setExchangeDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[24],
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          fontWeight: 600
        }}>
          ยืนยันการแลกคูปอง
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography gutterBottom>
            คุณต้องการแลก {selectedRate?.points} points เพื่อรับคูปองส่วนลด {selectedRate?.discount} บาท?
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            แต้มคงเหลือหลังแลก: {user ? user.points - (selectedRate?.points || 0) : 0} points
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setExchangeDialog(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
            }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleExchange}
            disabled={exchangePointsMutation.isLoading}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              boxShadow: theme.shadows[4],
              '&:hover': {
                boxShadow: theme.shadows[8],
              },
            }}
          >
            {exchangePointsMutation.isLoading ? 'Processing...' : 'ยืนยัน'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreview.open}
        onClose={() => setImagePreview({ open: false, image: '', name: '' })}
        maxWidth="md"
        fullWidth
        TransitionComponent={Zoom}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ 
          m: 0, 
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
            {imagePreview.name}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setImagePreview({ open: false, image: '', name: '' })}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: 'background.paper' }}>
          <Box
            sx={{
              width: '100%',
              height: '70vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}
          >
            <img
              src={imagePreview.image}
              alt={imagePreview.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Products; 