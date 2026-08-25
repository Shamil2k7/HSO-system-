import { Router } from 'express';
import { User } from '../models/User';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// Protect all user routes
router.use(authenticateJWT);

// GET /api/users - Get all users (Admin/Manager read allowed)
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    // CLC (Manager) can see all users, but in UI they will be focused on HOS
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/users - Create user (Admin and Manager allowed)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!['ADMIN', 'MANAGER', 'SALESMAN', 'SALESMANAGER'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role selection' });
  }

  // Manager (CLC) can only create SALESMAN (HOS)
  if (req.user!.role === 'MANAGER' && role !== 'SALESMAN') {
    return res.status(403).json({ message: 'CLC can only create HOS (salesman) profiles.' });
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

// PUT /api/users/:id - Update user (Admin and Manager allowed)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  const { name, email, role, status, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Manager (CLC) can only edit SALESMAN (HOS)
    if (req.user!.role === 'MANAGER') {
      if (user.role !== 'SALESMAN') {
        return res.status(403).json({ message: 'CLC can only edit HOS (salesman) profiles.' });
      }
      if (role && role !== 'SALESMAN') {
        return res.status(403).json({ message: 'CLC cannot change role to non-HOS.' });
      }
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
      if (!['ADMIN', 'MANAGER', 'SALESMAN', 'SALESMANAGER'].includes(role)) {
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

// DELETE /api/users/:id - Delete user (Admin and Manager allowed)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Manager (CLC) can only delete SALESMAN (HOS)
    if (req.user!.role === 'MANAGER' && user.role !== 'SALESMAN') {
      return res.status(403).json({ message: 'CLC can only delete HOS (salesman) profiles.' });
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
