/**
 * Handlers for user-related operations
 */

import { Request, Response } from 'express';
import { checkUserByEmail } from '../../lib/utils/supabase';

/**
 * Check if an email exists in the database
 * @param req Request with email as parameter
 * @param res Response
 */
export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email not provided',
        message: 'An email is required for verification'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'The provided email is not in a valid format'
      });
    }

    // Check if the email exists in Supabase
    const result = await checkUserByEmail(email);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: 'Error verifying email',
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        exists: result.exists
      }
    });
  } catch (error: any) {
    console.error('Error in checkEmail:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Something went wrong while verifying the email'
    });
  }
};

/**
 * Get the service status
 * @param req Request
 * @param res Response
 */
export const getStatus = (req: Request, res: Response) => {
  try {
    // Basic service status information
    const status = {
      service: 'NeuralWallet API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Error in getStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Something went wrong when getting the service status'
    });
  }
};