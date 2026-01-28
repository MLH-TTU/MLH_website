/**
 * Error messages for user feedback
 * Requirements: 9.1, 9.2, 9.3, 9.5, 9.6
 */
export const ERROR_MESSAGES = {
  AUTH_FAILED: "Unable to sign in with Google. Please try again.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  TTU_EMAIL_INVALID: "Please enter a valid TTU email address (e.g., username@ttu.edu)",
  TTU_EMAIL_DUPLICATE: "This TTU email is already registered to another account.",
  VERIFICATION_CODE_INVALID: "Invalid verification code. Please try again.",
  VERIFICATION_CODE_EXPIRED: "Verification code has expired. Please request a new one.",
  MAX_ATTEMPTS_EXCEEDED: "Maximum verification attempts exceeded. Your account has been removed. Please sign up again.",
  ONBOARDING_INCOMPLETE: "Please complete your profile to continue.",
  PROFILE_UPDATE_FAILED: "Failed to update profile. Please try again.",
  FILE_UPLOAD_FAILED: "Failed to upload file. Please try again.",
  FILE_SIZE_EXCEEDED: "File size exceeds the maximum allowed size.",
  INVALID_FILE_TYPE: "Invalid file type. Please upload a valid file.",
} as const;

/**
 * Success messages for user feedback
 */
export const SUCCESS_MESSAGES = {
  SIGN_IN_SUCCESS: "Successfully signed in!",
  SIGN_OUT_SUCCESS: "Successfully signed out.",
  PROFILE_UPDATED: "Profile updated successfully!",
  EMAIL_VERIFIED: "Email verified successfully!",
  VERIFICATION_CODE_SENT: "Verification code sent to your email.",
  FILE_UPLOADED: "File uploaded successfully!",
  ONBOARDING_COMPLETE: "Welcome! Your profile is complete.",
} as const;
