import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  TablePagination,
  useTheme,
} from '@mui/material';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

function Profile() {
  const { user, updatePoints } = useAuth();
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update form data when user data becomes available
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const { data: pointsHistory, isLoading: isLoadingHistory, error: historyError } = useQuery(
    ['pointsHistory', user?.id],
    async () => {
      if (!user) return null;
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3005/api/points/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      enabled: !!user, // Only run query if user exists
    }
  );

  const updateProfile = useMutation(async (data) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      'http://localhost:3005/api/users/profile',
      data,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }, {
    onSuccess: (data) => {
      setSuccess('โปรไฟล์ได้รับการแก้ไขแล้ว');
      setEditing(false);
      // Update local user data
      updatePoints(data.points);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    updateProfile.mutate(formData);
  };

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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate the slice of data to show based on pagination
  const getDisplayedTransactions = () => {
    if (!pointsHistory) return [];
    const startIndex = page * rowsPerPage;
    return pointsHistory.slice(startIndex, startIndex + rowsPerPage);
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                ข้อมูลโปรไฟล์
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
            </Box>

            {editing ? (
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    type="submit"
                    sx={{ mr: 1 }}
                    disabled={updateProfile.isLoading}
                  >
                    ยืนยัน
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        username: user.username || '',
                        email: user.email || '',
                      });
                    }}
                  >
                    ยกเลิก
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Username:</strong> {user.username}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {user.email}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Points Balance:</strong> {user.points || 0} แต้ม
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Member Since:</strong> {formatDate(user.created_at)}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setEditing(true)}
                  sx={{ mt: 2 }}
                >
                  แก้ไขโปรไฟล์
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Points History */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              ประวัติการใช้แต้ม
            </Typography>
            {isLoadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : historyError ? (
              <Alert severity="error">
                Failed to load points history. Please try again later.
              </Alert>
            ) : (
              <Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>วันที่</TableCell>
                        <TableCell>ประเภท</TableCell>
                        <TableCell align="right">แต้ม</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getDisplayedTransactions()?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            ไม่มีประวัติการใช้แต้ม
                          </TableCell>
                        </TableRow>
                      ) : (
                        getDisplayedTransactions()?.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {formatDate(transaction.created_at)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.transaction_type === 'earned' ? 'ได้รับแต้ม' : 'ใช้แต้ม'}
                                color={transaction.transaction_type === 'earned' ? 'success' : 'error'}
                                size="small"
                                sx={{
                                  fontWeight: 500,
                                  '& .MuiChip-label': {
                                    px: 2,
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                color={transaction.transaction_type === 'earned' ? 'success.main' : 'error.main'}
                                sx={{ fontWeight: 600 }}
                              >
                                {transaction.transaction_type === 'earned' ? '+' : '-'}
                                {transaction.points}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={pointsHistory?.length || 0}
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
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Profile; 