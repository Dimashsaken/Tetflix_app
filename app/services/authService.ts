import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser, 
  confirmSignUp,
  resendSignUpCode,
  type SignInInput,
  type SignUpInput 
} from 'aws-amplify/auth';

export interface AuthUser {
  userId: string;
  username: string;
  email?: string;
  attributes?: Record<string, any>;
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string) {
    try {
      const result = await signIn({
        username: email,
        password,
      });
      
      return {
        success: true,
        data: result,
        requiresConfirmation: !result.isSignedIn,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign in failed',
        code: error.name,
      };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, attributes?: Record<string, string>) {
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            ...attributes,
          },
        },
      });

      return {
        success: true,
        data: result,
        requiresConfirmation: !result.isSignUpComplete,
        userId: result.userId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign up failed',
        code: error.name,
      };
    }
  }

  /**
   * Confirm sign up with verification code
   */
  static async confirmSignUp(email: string, confirmationCode: string) {
    try {
      const result = await confirmSignUp({
        username: email,
        confirmationCode,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Confirmation failed',
        code: error.name,
      };
    }
  }

  /**
   * Resend verification code
   */
  static async resendConfirmationCode(email: string) {
    try {
      const result = await resendSignUpCode({
        username: email,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to resend code',
        code: error.name,
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      await signOut();
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign out failed',
      };
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await getCurrentUser();
      
      return {
        userId: user.userId,
        username: user.username,
        email: user.signInDetails?.loginId,
        attributes: user.signInDetails,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }
}

export default AuthService; 