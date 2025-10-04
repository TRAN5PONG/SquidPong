


export enum AuthMessage {
    LOGIN_SUCCESS = 'Login successful.',
    LOGOUT_SUCCESS = 'Logout successful.',
    SIGNUP_SUCCESS = 'Signup completed successfully.',
    TOKEN_REFRESHED = 'Token refreshed.',
    PROFILE_UPDATED = 'Profile updated.',
    PASSWORD_CHANGED = 'Password changed successfully.',
    EMAIL_VERIFIED = 'Email verified.',
    TWO_FA_ENABLED = 'Two-factor authentication enabled.',
    TWO_FA_DISABLED = 'Two-factor authentication disabled.',
    CODE_SENT = 'Verification code sent.',
  }
  
  export enum AuthError {
    LOGIN_SUCCESSFUL = 'Login successful.',
    TOKEN_EXPIRED = 'Session expired. Please login again.',
    UNKNOWN_ERROR = 'An unknown error occurred.',
    INTERNAL_SERVER_ERROR = 'Internal server error.',
    BAD_REQUEST = 'Bad request.',
    UNAUTHORIZED = 'Unauthorized.',
    FORBIDDEN = 'Forbidden.',
    NOT_FOUND = 'Resource not found.',
    METHOD_NOT_ALLOWED = 'Method not allowed.',
    VALIDATION_ERROR = 'Validation failed.',
  }
  
  export enum LoginError {
    INVALID_CREDENTIALS = 'Invalid email or password.',
    ACCOUNT_NOT_FOUND = 'Account does not exist.',
    ACCOUNT_DISABLED = 'Account is disabled.',
    ACCOUNT_LOCKED = 'Account is locked.',
    LOGIN_REQUIRED = 'Please login to continue.',
    TOO_MANY_ATTEMPTS = 'Too many failed attempts. Try again later.',
    EMAIL_NOT_VERIFIED = 'Email is not verified.',
    TWO_FA_REQUIRED = 'Two-factor authentication required.',
    ALREADY_LOGGED_IN = 'User is already logged in.',
  }

  export enum SignupError {
    EMAIL_ALREADY_USED = 'Email is already registered.',
    USERNAME_ALREADY_USED = 'Username is already taken.',
    WEAK_PASSWORD = 'Password is too weak.',
    INVALID_EMAIL = 'Invalid email format.',
    PASSWORDS_DO_NOT_MATCH = 'Passwords do not match.',
    SIGNUP_DISABLED = 'Signup is currently disabled.',
  }
  
  export enum TokenMessage {
    TOKEN_EXPIRED = 'Session expired. Please login again.',
    TOKEN_INVALID = 'Invalid token.',
    TOKEN_MISSING = 'Access token is missing.',
    REFRESH_TOKEN_EXPIRED = 'Refresh token expired.',
    TOKEN_REVOKED = 'Token has been revoked.',
    TOKEN_BLACKLISTED = 'Token is blacklisted.',
  }
  
  export enum TwoFA {
    TWO_FA_VERIFY_SUCCESS = '2FA verified successfully.',
    TWO_FA_SETUP_SUCCESS = '2FA setup completed successfully.',
    TWO_FA_ALREADY_ENABLED = '2fa via Authenticator App is already enabled.',
    TWO_FA_ENABLED = '2FA is  enabled.',
    TWO_FA_DESABLED = '2FA is  desabled.',
    INVALID_2FA_CODE = 'Invalid 2FA code.',
    VALID_2FA_CODE = 'Valid 2FA code.',
    TWO_FA_SETUP_REQUIRED = '2FA setup required.',
    TWO_FA_VERIFIED = '2FA verified successfully.',
    TWO_FA_DISABLE_SUCCESS = '2FA has been disabled successfully.',
    TWO_FA_ENABLE_SUCCESS = '2FA has been enabled successfully.',



  }
  

  export enum TwoFaEmaiL {
    TWO_FA_EMAIL_EXPIRED = '2FA code has expired.',
    TWO_FA_EMAIL_SENT = '2FA code sent to email.',
    TWO_FA_EMAIL_FAILED = 'Failed to send 2FA code email.',
    TWO_FA_ALREADY_ENABLED = '2FA via email is already enabled.',
    TWO_FA_NOT_ENABLED = '2FA via email is not enabled.',
    INVALID_2FA_CODE = 'Invalid 2FA code.',
    VALID_2FA_CODE = 'Valid 2FA code.',
    TWO_FA_EMAIL_SETUP_SUCCESS = 'Email 2FA setup completed successfully.',
    TWO_FA_EMAIL_VERIFY_SUCCESS = 'Email 2FA verified successfully.',
    TWO_FA_EMAIL_DISABLED = 'Email 2FA has been disabled successfully.',
    TWO_FA_EMAIL_ENABLED = 'Email 2FA has been enabled successfully.',
    TWO_FA_EMAIL_INVALID = 'Invalid email for 2FA.',
    TWO_FA_EMAIL_REQUIRED = 'Email is required for 2FA.',
    TWO_FA_EMAIL_NOT_CONFIGURED = 'Email service is not configured for 2FA.',
    TWO_FA_EMAIL_RATE_LIMIT = 'Too many requests. Please try again later.',


  }

  export enum PasswordMessage {
    RESET_TOKEN_EXPIRED = 'Reset code has expired. we have sent you a new one to your email.',
    INVALID_RESET_TOKEN = 'Invalid reset code.',
    PASSWORDS_DO_NOT_MATCH = 'Passwords do not match.',
    PASSWORD_RESET_EMAIL_SENT = 'Password reset email sent.',
    PASSWORD_RESET_SUCCESS = 'Password reset successful.',
    PASSWORD_CHANGED_SUCCESS = 'Password changed successfully.',
    PASSWORD_RESET_INVALID = 'Invalid reset token.',
    PASSWORD_RESET_EXPIRED = 'Reset link has expired.',
    CURRENT_PASSWORD_INCORRECT = 'Current password is incorrect.',
    PASSWORD_SAME_AS_OLD = 'New password cannot be the same as the old password.',
  }
  
  export enum EmailMessage {
    USER_NOW_LINKED_ACCOUNT = 'User now has a linked account. u have two options for login.',
    EMAIL_LINKED_ACCOUNT = 'Email is linked to an OAuth account. Please login using your OAuth provider.',
    EMAIL_ALREADY_REGISTERED = 'Email is already registered.',
    EMAIL_VERIFIED_SUCCESSFULLY = 'Email has been successfully verified.',
    EMAIL_ALREADY_VERIFIED = 'Email is already verified.',
    EMAIL_VERIFICATION_REQUIRED = 'Please verify your email.',
    EMAIL_VERIFICATION_SENT = 'Verification email sent.',
    INVALID_VERIFICATION_TOKEN = 'Invalid email verification token.',
    VERIFICATION_TOKEN_EXPIRED = 'Email verification token expired.',
  }
  
  export enum UserProfileMessage
  {
    U_HAVE_ACCOUNT_OAUTH = 'You have an account via OAuth. u cant change password.',
    USERNAME_ALREADY_TAKEN = 'Username is already taken.',
    INVALID_USERNAME = 'Invalid username.',
    USER_NOT_FOUND = 'User not found.',
    DELETE_ACCOUNT_SUCCESS = 'Account deleted successfully.', // ✅ NEW
    LOGIN_SUCCESSFUL = 'Login successful.', // ✅ NEW
    LOGOUT_SUCCESSFUL = 'Logout successful.', // ✅ NEW
    EMAIL_ALREADY_USED = 'Email is already registered.',
    USERNAME_ALREADY_USED = 'Username is already taken.',
    WEAK_PASSWORD = 'Password is too weak.',
    INVALID_EMAIL = 'Invalid email format.',
    PASSWORDS_DO_NOT_MATCH = 'Passwords do not match.',
    SIGNUP_DISABLED = 'Signup is currently disabled.',
    USER_ALREADY_EXISTS = 'User already exists.', // ✅ NEW
    OAUTH_LOGIN_REQUIRED = 'Please login using your OAuth provider.', // ✅ NEW
    INVALID_CREDENTIALS = 'Invalid email or password.',  
    PROFILE_NOT_COMPLETE = 'User profile is incomplete.',
    AVATAR_UPLOAD_SUCCESS = 'Avatar uploaded successfully.',
    AVATAR_UPLOAD_FAIL = 'Avatar upload failed.',
    PROFILE_UPDATE_FAIL = 'Failed to update profile.',
  }
  
  export enum UsernameError {
    INVALID_USERNAME = 'Invalid username.',
    USERNAME_TOO_SHORT = 'Username is too short.',
    USERNAME_TOO_LONG = 'Username is too long.',
    USERNAME_TAKEN = 'Username already taken.',
  }
  
  export enum RateLimit {
    TOO_MANY_REQUESTS = 'Too many requests. Please try again later.',
    RATE_LIMIT_EXCEEDED = 'Rate limit exceeded.',
  }
  
  export enum CustomAuthMessage {
    LOGIN_WITH_GOOGLE_SUCCESS = 'Logged in with Google successfully.',
    LOGIN_WITH_GITHUB_SUCCESS = 'Logged in with GitHub successfully.',
    OAUTH_FAILED = 'OAuth login failed.',
    SESSION_RESTORED = 'Session restored.',
    ACCOUNT_ALREADY_EXISTS = 'Account already exists.',
    ACCOUNT_DELETED = 'Account deleted.',
    TEMP_PASSWORD_USED = 'Temporary password in use.',
    DEVICE_BLOCKED = 'This device is blocked.',
    LOCATION_NOT_ALLOWED = 'Login from this location is not allowed.',
  }
  