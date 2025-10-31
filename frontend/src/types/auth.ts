export interface AuthToken {
	accessToken: string;
	refreshToken: string;
	expiresIn: number; // in seconds
	tokenType: string; // e.g., "Bearer"
}