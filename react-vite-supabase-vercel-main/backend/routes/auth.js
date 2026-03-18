const express = require('express');
const bcrypt = require('bcrypt');
const { supabase } = require('../db/supabase');

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        const name = email.split('@')[0];
        const role = 'quiz_host';

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: existing } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle();

        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                email,
                name,
                phone: null,
                role,
                password_hash: passwordHash
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

module.exports = router;