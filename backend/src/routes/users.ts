import { Router } from 'express';
import { User } from '../models/User';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Protect all user routes
router.use(authenticateJWT);

// GET /api/users - Get all users (Admin/Manager read allowed)
router.get('/', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/users - Create user (Admin only)
router.post('/', authorizeRoles('ADMIN'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!['ADMIN', 'MANAGER', 'SALESMAN', 'SALESMANAGER', 'WAREHOUSEMANAGER', 'CASHIER'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role selection' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      status: 'active',
    });

    const userObj = newUser.toObject();
    delete (userObj as any).password;

    return res.status(201).json(userObj);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authorizeRoles('ADMIN'), async (req, res) => {
  const { name, email, role, status, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update details
    if (name) user.name = name;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (role) {
      if (!['ADMIN', 'MANAGER', 'SALESMAN', 'SALESMANAGER', 'WAREHOUSEMANAGER', 'CASHIER'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role as any;
    }
    if (status) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      user.status = status as any;
    }
    if (password) {
      user.password = password; // Pre-save hook will hash it
    }

    await user.save();
    const updatedUserObj = user.toObject();
    delete (updatedUserObj as any).password;

    return res.json(updatedUserObj);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Do not delete last admin
    if (user.role === 'ADMIN') {
      const admins = await User.countDocuments({ role: 'ADMIN' });
      if (admins <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only admin' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
