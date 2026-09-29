import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { JWT_SECRET } from '../config/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id,email,username')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);

    if (checkError) {
      console.error('Supabase checkError:', checkError);
      return res.status(500).json({ error: 'Database error: ' + checkError.message });
    }

    if (existingUser && existingUser.length > 0) {
      const isEmail = existingUser[0].email === email;
      return res.status(400).json({
        error: isEmail ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name || '',
        lastName: newUser.last_name || '',
        address: newUser.address || '',
        city: newUser.city || '',
        postcode: newUser.postcode || '',
        country: newUser.country || 'United Kingdom',
        phone: newUser.phone || ''
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been restricted by the administrator.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        address: user.address || '',
        city: user.city || '',
        postcode: user.postcode || '',
        country: user.country || 'United Kingdom',
        phone: user.phone || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .limit(1)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      address: user.address || '',
      city: user.city || '',
      postcode: user.postcode || '',
      country: user.country || 'United Kingdom',
      phone: user.phone || '',
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      username,
      firstName,
      lastName,
      email,
      address,
      city,
      postcode,
      country,
      phone,
      currentPassword,
      newPassword
    } = req.body;

    // Build update data object
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Add fields to update if provided
    if (username) updateData.username = username;
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (postcode) updateData.postcode = postcode;
    if (country) updateData.country = country;
    if (phone) updateData.phone = phone;

    // Handle password change if requested
    if (currentPassword && newPassword) {
      // Get current user to verify password
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', req.user.id)
        .limit(1)
        .single();

      if (fetchError || !currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      // Hash new password
      updateData.password_hash = bcrypt.hashSync(newPassword, 10);
    }

    // Update user in Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name || '',
        lastName: updatedUser.last_name || '',
        address: updatedUser.address || '',
        city: updatedUser.city || '',
        postcode: updatedUser.postcode || '',
        country: updatedUser.country || 'United Kingdom',
        phone: updatedUser.phone || ''
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Login (Secret Portal)
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Stored credentials take precedence. A failed login must never fall through
    // to older environment credentials.
    if (supabase) {
      const { data: dbCreds, error: dbError } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_credentials')
        .maybeSingle();

      if (dbError) return res.status(503).json({ error: 'Admin login temporarily unavailable' });

      if (dbCreds && dbCreds.value) {
        const { username: dbUser, passwordHash } = dbCreds.value;
        if (username === dbUser && passwordHash) {
          const isValid = await bcrypt.compare(password, passwordHash);
          if (isValid) {
            const token = jwt.sign({ id: 'fuji-admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
            return res.json({ message: 'Admin authenticated', token });
          }
        }
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
    }

    // Environment credentials are for initial setup only, and must be explicit.
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (adminUser && adminPass && username === adminUser && password === adminPass) {
      const token = jwt.sign({ id: 'fuji-admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ message: 'Admin authenticated', token });
    }

    res.status(401).json({ error: 'Invalid admin credentials' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Change Password
router.post('/admin-change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (typeof username !== 'string' || typeof oldPassword !== 'string' ||
        typeof newPassword !== 'string' || newPassword.length < 12) {
      return res.status(400).json({ error: 'Provide current credentials and a new password of at least 12 characters' });
    }

    // 1. Verify current credentials (ENV or DB)
    let authenticated = false;
    
    // Check DB first (If connectivity is available)
    if (supabase) {
      const { data: dbCreds, error: dbError } = await supabase.from('admin_settings').select('value').eq('key', 'admin_credentials').maybeSingle();
      if (dbError) return res.status(503).json({ error: 'Admin credentials temporarily unavailable' });
      if (dbCreds && dbCreds.value) {
        if (username === dbCreds.value.username && dbCreds.value.passwordHash) {
          authenticated = await bcrypt.compare(oldPassword, dbCreds.value.passwordHash);
        }
      } else {
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;
        authenticated = !!(adminUser && adminPass && username === adminUser && oldPassword === adminPass);
      }
    } else {
      return res.status(503).json({ error: 'Database offline: Cannot update credentials' });
    }

    if (!authenticated) {
      return res.status(401).json({ error: 'Authentication failed: current credentials incorrect.' });
    }

    // 2. Hash and save new credentials (If connectivity is available)
    if (supabase) {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const { error: upsertError } = await supabase.from('admin_settings').upsert({
        key: 'admin_credentials',
        value: { username, passwordHash },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      if (upsertError) throw upsertError;
    } else {
      return res.status(503).json({ error: 'Database offline: Cannot update credentials permanently in this environment.' });
    }

    res.json({ message: 'Administrative passcode updated successfully.' });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ error: 'Critical system error during credential rotation.' });
  }
});

export default router;
