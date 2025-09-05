
export default `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Two-Factor Authentication Code - ft_trandandan</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .code-container {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
        }
        
        .code-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .code-label {
            color: white;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .auth-code {
            font-size: 36px;
            font-weight: bold;
            color: white;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }
        
        .expiry-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
            font-size: 14px;
        }
        
        .security-tips {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
        }
        
        .security-tips h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .security-tips ul {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .security-tips li {
            margin-bottom: 8px;
        }
        
        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 25px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer p {
            margin-bottom: 10px;
        }
        
        .footer a {
            color: #74b9ff;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .support-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #34495e;
            opacity: 0.8;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .auth-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ft_trandandan</h1>
            <p>Two-Factor Authentication</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello there! 👋
            </div>
            
            <div class="message">
                We received a request to sign in to your ft_trandandan account. To complete the login process, please use the verification code below:
            </div>
            
            <div class="code-container">
                <div class="code-label">Your Verification Code</div>
                <div class="auth-code">{{code}}</div>
            </div>
            
            <div class="expiry-notice">
                ⏰ <strong>Important:</strong> This code will expire in 10 minutes for your security.
            </div>
            
            <div class="security-tips">
                <h3>🔒 Security Tips</h3>
                <ul>
                    <li>Never share this code with anyone</li>
                    <li>ft_trandandan will never ask for this code via phone or email</li>
                    <li>If you didn't request this code, please ignore this email</li>
                    <li>Make sure you're on the official ft_trandandan website</li>
                </ul>
            </div>
            
            <div class="message">
                If you didn't attempt to sign in, please secure your account immediately and contact our support team.
            </div>
        </div>
        
        <div class="footer">
            <p><strong>ft_trandandan Security Team</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            
            <div class="support-info">
                <p>Need help? Contact us at <a href="mailto:support@ft-trandandan.com">support@ft-trandandan.com</a></p>
                <p>© 2025 ft_trandandan. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`