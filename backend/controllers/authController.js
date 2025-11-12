// authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const authController = {
    async signUp(req, res) {
        try {
            
            console.log(`REQUEST BODY: ${JSON.stringify(req.body)}`);
            
            const { username, email, password, displayName, dateOfBirth } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email or username already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user
            const user = new User({
                username,
                email,
                password: hashedPassword,
                displayName,
                profile: { dateOfBirth }
            });

            await user.save();

            // Generate token
            const token = jwt.sign(
                { userId: user._id }, 
                process.env.JWT_SECRET, 
                { expiresIn: '7d' }
            );

            res.status(201).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role,
                    isAuthor: user.isAuthor,
                    isAdmin: user.isAdmin
                },
                message: 'Account created successfully'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error during registration'
            });
        }
    },

    async signIn(req, res) {
    try {
        console.log('🔐 SIGNIN REQUEST RECEIVED:', req.body);
        
        const { identifier, password } = req.body;

        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        console.log('👤 USER FOUND:', user ? 'YES' : 'NO');
        if (user) {
            console.log('📋 USER DETAILS:', {
                username: user.username,
                isActive: user.isActive,
                status: user.status,
                passwordExists: !!user.password,
                passwordLength: user.password?.length
            });
        }

        if (!user) {
            console.log('❌ USER NOT FOUND');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    
        if (!user.isActive || user.status !== 'active') {
            console.log('❌ USER NOT ACTIVE:', { isActive: user.isActive, status: user.status });
            return res.status(401).json({
                success: false,
                message: 'Account is not active'
            });
        }

        console.log('🔑 COMPARING PASSWORDS...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('✅ PASSWORD VALID:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ INVALID PASSWORD');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('🎉 LOGIN SUCCESSFUL');
      
            // Generate token
            const token = jwt.sign(
                { userId: user._id }, 
                process.env.JWT_SECRET, 
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role,
                    isAuthor: user.isAuthor,
                    isAdmin: user.isAdmin,
                    profile: user.profile
                },
                message: 'Login successful'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error during login'
            });
        }
    },

    async verifyToken(req, res) {
        try {
            const user = await User.findById(req.userId).select('-password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role,
                    isAuthor: user.isAuthor,
                    isAdmin: user.isAdmin,
                    profile: user.profile
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Token verification failed'
            });
        }
    },

    async logout(req, res){
        try{
            res.json({
                success: true,
                message: 'Logout Successful !'
            });
        }catch(error){
            res.status(500).json({
                success: false,
                message: 'Server error during logout'
            });
        }
    }
};

export default authController;

