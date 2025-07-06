import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Fade,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import axios from 'axios';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';

function Cart() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getPointsTotal,
  } = useCart();
  const { user, updatePoints } = useAuth();
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user's available coupons
  const { data: userCoupons } = useQuery('userCoupons', async () => {
    if (!user) return [];
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/points/coupons', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, {
    enabled: !!user
  });

  const createOrder = useMutation(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('ไม่พบ Token กรุณาเข้าสู่ระบบใหม่');
    }

    if (!cartItems.length) {
      throw new Error('ไม่พบสินค้าในตะกร้า');
    }

    // Validate cart items
    const orderItems = cartItems.map(item => {
      if (!item.id || !item.quantity || item.quantity < 1) {
        throw new Error('ข้อมูลสินค้าไม่ถูกต้อง');
      }
      return {
        product_id: item.id,
        quantity: item.quantity,
        use_points: item.usePoints || false
      };
    });
    
    // Calculate total points being used for redemption
    const pointsToUse = cartItems.reduce((total, item) => {
      if (item.usePoints) {
        return total + (item.points_price * item.quantity);
      }
      return total;
    }, 0);

    try {
      const response = await axios.post(
        '/api/orders',
        {
          items: orderItems,
          total_amount: getFinalTotal(),
          points_used: pointsToUse,
          coupon_id: selectedCoupon?.id || null
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Get updated user data to sync points
      const userResponse = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        order: response.data,
        updatedUser: userResponse.data
      };
    } catch (error) {
      console.error('Order creation error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
    }
  }, {
    onSuccess: (data) => {
      clearCart();
      // Update points in auth context
      updatePoints(data.updatedUser.points);
      // Invalidate all relevant queries
      queryClient.invalidateQueries('orders');
      queryClient.invalidateQueries('products');
      queryClient.invalidateQueries('pointsHistory');
      queryClient.invalidateQueries('userCoupons');
      queryClient.invalidateQueries('featuredProducts');
      queryClient.invalidateQueries(['user', user?.id]);
      
      // Close dialog and navigate to orders page
      setCheckoutDialog(false);
      navigate('/orders');
    },
    onError: (error) => {
      setError(error.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
    }
  });

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Validate points balance
    const pointsNeeded = getPointsTotal();
    if (pointsNeeded > user.points) {
      setError(`Insufficient points. You need ${pointsNeeded} points but have ${user.points} points.`);
      return;
    }

    setError(null);
    setCheckoutDialog(true);
  };

  const handleConfirmCheckout = () => {
    createOrder.mutate();
  };

  const handleCloseDialog = () => {
    setCheckoutDialog(false);
    setError(null);
    if (!cartItems.length) {
      navigate('/orders');
    }
  };

  const getFinalTotal = () => {
    const subtotal = getCartTotal();
    const discount = selectedCoupon ? Number(selectedCoupon.discount_amount) : 0;
    return Math.max(0, subtotal - discount);
  };

  if (!cartItems.length) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Paper 
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
            ตะกร้าสินค้าของคุณว่างเปล่า
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            sx={{
              mt: 3,
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem',
              boxShadow: theme.shadows[4],
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8],
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            ดำเนินการเลือกซื้อต่อ
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 600,
          mb: 4,
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
        ตะกร้าสินค้า
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {cartItems.map((item, index) => (
            <Fade 
              key={`${item.id}-${item.usePoints}`}
              in={true} 
              timeout={300} 
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Card 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <Grid container>
                  <Grid item xs={4}>
                    <CardMedia
                      component="img"
                      sx={{
                        height: 280,
                        objectFit: 'contain',
                        bgcolor: 'background.paper',
                        p: 2,
                        transition: 'transform 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        }
                      }}
                      image={item.image_url || 'https://source.unsplash.com/random?product'}
                      alt={item.name}
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>{item.name}</Typography>
                      <Typography 
                        variant="body2" 
                        color="primary"
                        sx={{ 
                          mt: 1,
                          fontSize: '1.1rem',
                          fontWeight: 500 
                        }}
                      >
                        {item.usePoints ? (
                          `${item.points_price} points`
                        ) : (
                          `${Number(item.price).toFixed(2)} บาท`
                        )}
                      </Typography>
                      <Box sx={{ 
                        mt: 3, 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1 
                      }}>
                        <IconButton
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.usePoints)}
                          sx={{
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            updateQuantity(item.id, value, item.usePoints);
                          }}
                          sx={{ 
                            width: 60,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        />
                        <IconButton
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.usePoints)}
                          sx={{
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => removeFromCart(item.id, item.usePoints)}
                          sx={{
                            ml: 2,
                            '&:hover': {
                              bgcolor: 'error.light',
                              color: 'white',
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            </Fade>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            position: 'sticky',
            top: 24,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            bgcolor: 'background.paper',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  pb: 2,
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                }}
              >
                ยอดทั้งหมด
              </Typography>
              <Box sx={{ my: 2 }}>
                <Box sx={{ 
                  mb: 2, 
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}>
                  {cartItems.map((item) => (
                    <Box 
                      key={`summary-${item.id}-${item.usePoints}`} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mb: 1.5,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
                        {item.name} x{item.quantity}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          color: item.usePoints ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {item.usePoints 
                          ? `${item.points_price * item.quantity} points`
                          : `${(item.price * item.quantity).toFixed(2)} บาท`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Typography sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>รวม:</span>
                  <span>{Number(getCartTotal()).toFixed(2)} บาท</span>
                </Typography>
                {getPointsTotal() > 0 && (
                  <Typography sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: 'primary.main',
                    mb: 1
                  }}>
                    <span>Points Used:</span>
                    <span>{getPointsTotal()} points</span>
                  </Typography>
                )}
                {selectedCoupon && (
                  <Typography 
                    color="success.main"
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mb: 1
                    }}
                  >
                    <span>ลดไป:</span>
                    <span>-{Number(selectedCoupon.discount_amount).toFixed(2)} บาท</span>
                  </Typography>
                )}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mt: 2,
                    pt: 2,
                    borderTop: '2px solid',
                    borderColor: 'primary.main',
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontWeight: 600
                  }}
                >
                  <span>เป็นจำนวนเงิน:</span>
                  <span>{getFinalTotal().toFixed(2)} บาท</span>
                </Typography>
                {user && (
                  <Typography 
                    color="text.secondary" 
                    sx={{ 
                      mt: 2,
                      textAlign: 'right',
                      fontSize: '0.9rem'
                    }}
                  >
                    แต้มคงเหลือ: {user.points} points
                  </Typography>
                )}

                {userCoupons?.length > 0 && (
                  <FormControl fullWidth sx={{ mt: 3 }}>
                    <InputLabel>ใช้แต้ม</InputLabel>
                    <Select
                      value={selectedCoupon?.id || ''}
                      onChange={(e) => {
                        const coupon = userCoupons.find(c => c.id === e.target.value);
                        setSelectedCoupon(coupon || null);
                      }}
                      label="Apply Coupon"
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
                            '&::-webkit-scrollbar': {
                              width: '8px',
                              borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                              backgroundColor: 'background.paper',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: 'primary.main',
                              borderRadius: '4px',
                              '&:hover': {
                                backgroundColor: 'primary.dark',
                              },
                            },
                          },
                        },
                      }}
                      sx={{ 
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>ไม่มี</em>
                      </MenuItem>
                      {userCoupons.map((coupon) => (
                        <MenuItem 
                          key={coupon.id} 
                          value={coupon.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                            py: 1.5,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="caption"
                              sx={{ 
                                bgcolor: 'primary.main',
                                color: 'white',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontWeight: 500
                              }}
                            >
                              #{coupon.id}
                            </Typography>
                            <Typography color="success.main" sx={{ fontWeight: 500 }}>
                              {Number(coupon.discount_amount).toFixed(2)} บาท
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(coupon.created_at).toLocaleDateString()}
                          </Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCheckout}
                disabled={createOrder.isLoading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8],
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {createOrder.isLoading ? 'Processing...' : 'สรุปรายการ'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Checkout Dialog with enhanced styling */}
      <Dialog
        open={checkoutDialog}
        onClose={handleCloseDialog}
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
          ยืนยันการสั่งซื้อ
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}
          {createOrder.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography gutterBottom sx={{ mb: 3 }}>
                โปรดกดยืนยันการสั่งซื้อ
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'action.hover',
                borderRadius: 2,
                mb: 2
              }}>
                <Typography sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>รวม:</span>
                  <span>{Number(getCartTotal()).toFixed(2)} บาท</span>
                </Typography>
                {getPointsTotal() > 0 && (
                  <Typography sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: 'primary.main',
                    mb: 1
                  }}>
                    <span>Points to Use:</span>
                    <span>{getPointsTotal()} points</span>
                  </Typography>
                )}
                {selectedCoupon && (
                  <Typography 
                    color="success.main"
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mb: 1
                    }}
                  >
                    <span>คูปองลดไป:</span>
                    <span>-{Number(selectedCoupon.discount_amount).toFixed(2)} บาท</span>
                  </Typography>
                )}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontWeight: 600
                  }}
                >
                  <span>เป็นจำนวนเงิน:</span>
                  <span>{getFinalTotal().toFixed(2)} บาท</span>
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmCheckout}
            variant="contained"
            disabled={createOrder.isLoading}
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
            {createOrder.isLoading ? 'Processing...' : 'ชำระเงิน'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Cart; 