import 'server-only';
import { Resend } from 'resend';
import { getAdminFirestore, getAdminAuth } from '../firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Verification code interface
interface VerificationCode {
  code: string;
  email: string;
  uid: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  attempts: number;
}

/**
 * Generate a random 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification code to TTU email address
 * Generates a 6-digit code, stores it in Firestore with 10-minute expiration,
 * and sends it via email using Resend
 * 
 * @param ttuEmail - The TTU email address to send the code to
 * @param uid - The Firebase user ID
 * @throws Error if email sending fails or Firestore operation fails
 */
export async function sendVerificationCode(
  ttuEmail: string,
  uid: string
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const code = generateVerificationCode();
    
    // Calculate expiration time (10 minutes from now)
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 10 * 60 * 1000);
    
    // Store verification code in Firestore
    const verificationData: VerificationCode = {
      code,
      email: ttuEmail,
      uid,
      createdAt: now,
      expiresAt,
      attempts: 0,
    };
    
    console.log('Attempting to store verification code for UID:', uid);
    
    // Store in verificationCodes collection with UID as document ID
    await db.collection('verificationCodes').doc(uid).set(verificationData);
    
    console.log('Verification code stored successfully');
    
    // Send email using Resend
    console.log('Sending verification email to:', ttuEmail);
    
    const emailResult = await resend.emails.send({
      from: 'MLH TTU <verify@mlhttu.org>',
      to: ttuEmail,
      subject: 'Verify your TTU Email - MLH TTU',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your TTU Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #cc0000; margin-top: 0;">Welcome to MLH TTU!</h1>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for signing up. To complete your registration, please verify your TTU email address.
              </p>
              <div style="background-color: #fff; border: 2px solid #cc0000; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code is:</p>
                <p style="font-size: 36px; font-weight: bold; color: #cc0000; letter-spacing: 8px; margin: 10px 0;">
                  ${code}
                </p>
              </div>
              <p style="font-size: 14px; color: #666;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="font-size: 14px; color: #666;">
                You have <strong>3 attempts</strong> to enter the correct code. After 3 failed attempts, you'll need to wait a few minutes before trying again.
              </p>
            </div>
            <div style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              <p>If you didn't request this verification code, please ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} MLH TTU. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log('Verification email sent successfully:', emailResult);
  } catch (error: any) {
    console.error('Error in sendVerificationCode:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      throw new Error('Database permission error. Please contact support.');
    }
    
    throw new Error('Failed to send verification code. Please try again.');
  }
}

/**
 * Verify the entered code against the stored code
 * Checks if the code is correct and not expired
 * 
 * @param uid - The Firebase user ID
 * @param code - The verification code entered by the user
 * @returns true if code is correct and not expired, false otherwise
 * @throws Error if verification document not found or Firestore operation fails
 */
export async function verifyCode(uid: string, code: string): Promise<boolean> {
  const db = getAdminFirestore();
  
  try {
    const verificationDoc = await db.collection('verificationCodes').doc(uid).get();
    
    if (!verificationDoc.exists) {
      throw new Error('Verification code not found. Please request a new code.');
    }
    
    const verificationData = verificationDoc.data() as VerificationCode;
    
    // Check if code has expired
    const now = Timestamp.now();
    if (now.toMillis() > verificationData.expiresAt.toMillis()) {
      throw new Error('Verification code has expired. Please request a new code.');
    }
    
    // Check if code matches
    if (verificationData.code !== code) {
      return false;
    }
    
    // Code is correct - mark TTU email as verified in user profile
    await db.collection('users').doc(uid).update({
      ttuEmailVerified: true,
      updatedAt: now,
    });
    
    // Delete verification code document after successful verification
    await db.collection('verificationCodes').doc(uid).delete();
    
    return true;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
}

/**
 * Increment the number of failed verification attempts
 * Returns the updated attempt count
 * 
 * @param uid - The Firebase user ID
 * @returns The updated number of attempts
 * @throws Error if verification document not found or Firestore operation fails
 */
export async function incrementAttempts(uid: string): Promise<number> {
  const db = getAdminFirestore();
  
  try {
    const verificationDoc = await db.collection('verificationCodes').doc(uid).get();
    
    if (!verificationDoc.exists) {
      throw new Error('Verification code not found.');
    }
    
    const verificationData = verificationDoc.data() as VerificationCode;
    const newAttempts = verificationData.attempts + 1;
    
    // Update attempts count
    await db.collection('verificationCodes').doc(uid).update({
      attempts: newAttempts,
    });
    
    return newAttempts;
  } catch (error) {
    console.error('Error incrementing attempts:', error);
    throw error;
  }
}

/**
 * Apply rate limiting after failed verification attempts
 * Sets a cooldown period of 5 minutes before user can try again
 * 
 * @param uid - The Firebase user ID
 * @throws Error if Firestore operation fails
 */
export async function applyRateLimit(uid: string): Promise<void> {
  const db = getAdminFirestore();
  
  try {
    const now = Timestamp.now();
    const cooldownEnd = Timestamp.fromMillis(now.toMillis() + 5 * 60 * 1000); // 5 minutes
    
    // Update verification code document with cooldown
    await db.collection('verificationCodes').doc(uid).update({
      rateLimitedUntil: cooldownEnd,
      attempts: 0, // Reset attempts after rate limit
    });
    
    console.log(`Applied rate limit for user ${uid} until ${cooldownEnd.toDate()}`);
  } catch (error) {
    console.error('Error applying rate limit:', error);
    throw new Error('Failed to apply rate limit.');
  }
}

/**
 * Check if user is currently rate limited
 * 
 * @param uid - The Firebase user ID
 * @returns true if user is rate limited, false otherwise
 */
export async function isRateLimited(uid: string): Promise<boolean> {
  const db = getAdminFirestore();
  
  try {
    const verificationDoc = await db.collection('verificationCodes').doc(uid).get();
    
    if (!verificationDoc.exists) {
      return false;
    }
    
    const verificationData = verificationDoc.data() as VerificationCode & { rateLimitedUntil?: Timestamp };
    
    if (!verificationData.rateLimitedUntil) {
      return false;
    }
    
    const now = Timestamp.now();
    return now.toMillis() < verificationData.rateLimitedUntil.toMillis();
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false;
  }
}

/**
 * Clean up failed verification by deleting Firebase account and user profile
 * Called after 3 failed verification attempts
 * 
 * @param uid - The Firebase user ID
 * @throws Error if deletion fails
 */
export async function cleanupFailedVerification(uid: string): Promise<void> {
  const db = getAdminFirestore();
  const auth = getAdminAuth();
  
  try {
    // Delete user profile from Firestore
    await db.collection('users').doc(uid).delete();
    
    // Delete verification code document
    await db.collection('verificationCodes').doc(uid).delete();
    
    // Delete Firebase Authentication account
    await auth.deleteUser(uid);
    
    console.log(`Cleaned up failed verification for user ${uid}`);
  } catch (error) {
    console.error('Error cleaning up failed verification:', error);
    throw new Error('Failed to clean up account after failed verification.');
  }
}

/**
 * Check if user has completed onboarding
 * Used to determine if account should be cleaned up
 * 
 * @param uid - The Firebase user ID
 * @returns true if onboarding is complete, false otherwise
 */
export async function hasCompletedOnboarding(uid: string): Promise<boolean> {
  const db = getAdminFirestore();
  
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    return userData?.hasCompletedOnboarding === true && userData?.ttuEmailVerified === true;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}
