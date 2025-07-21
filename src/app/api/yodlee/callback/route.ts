import { NextRequest, NextResponse } from 'next/server';
import YodleeService from '@/lib/yodlee';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');
    const providerAccountId = searchParams.get('providerAccountId');

    console.log('Yodlee callback received:', { status, providerId, providerAccountId });

    if (status === 'SUCCESS' && providerAccountId) {
      // Initialize Yodlee service
      const yodleeService = await YodleeService.getInstance();

      // Define the Account type (adjust fields as needed)
      type Account = {
        id: string;
        accountName?: string;
        accountNumber?: string;
        accountType?: string;
        providerAccount?: { id?: string };
        balance?: { amount?: number; currency?: string };
      };

      // Fetch account details and map to Account[]
      const bankAccounts = await yodleeService.getAccounts();
      const accounts: Account[] = bankAccounts.map((ba: any) => ({
        id: ba.id,
        accountName: ba.accountName,
        accountNumber: ba.accountNumber,
        accountType: ba.accountType,
        providerAccount: { id: ba.providerAccount?.id },
        balance: { amount: ba.balance?.current, currency: 'USD' }
      }));
      
      // Store connected accounts
      const connectedAccounts = accounts.map((account: Account) => ({
        id: account.id,
        name: account.accountName || account.accountNumber,
        type: account.accountType,
        provider: 'yodlee',
        providerAccountId: account.providerAccount?.id || providerAccountId,
        balance: account.balance?.amount,
        currency: account.balance?.currency || 'USD',
        isActive: true
      }));

      return new NextResponse(`
        <html>
          <head><title>Bank Connection Successful</title></head>
          <body>
            <script>
              // Store account data
              localStorage.setItem('yodlee_accounts', JSON.stringify(${JSON.stringify(connectedAccounts)}));
              
              // Notify parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'YODLEE_SUCCESS',
                  accounts: ${JSON.stringify(connectedAccounts)}
                }, '*');
                window.close();
              } else {
                // Redirect if not in popup
                window.location.href = '/subscriptions?connected=true';
              }
            </script>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2>✅ Bank Account Connected Successfully!</h2>
              <p>Your account has been connected. This window will close automatically.</p>
              <p>If it doesn't close, you can <a href="/subscriptions">return to subscriptions</a>.</p>
            </div>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } else {
      // Handle failure or cancellation
      return new NextResponse(`
        <html>
          <head><title>Bank Connection Failed</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'YODLEE_ERROR',
                  error: 'Connection failed or cancelled'
                }, '*');
                window.close();
              } else {
                window.location.href = '/subscriptions?error=connection_failed';
              }
            </script>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2>❌ Bank Connection Failed</h2>
              <p>The bank connection was not completed successfully.</p>
              <p><a href="/subscriptions">Return to subscriptions</a></p>
            </div>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
  } catch (error) {
    console.error('Yodlee callback error:', error);
    
    return new NextResponse(`
      <html>
        <head><title>Connection Error</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'YODLEE_ERROR',
                error: 'Internal server error'
              }, '*');
              window.close();
            } else {
              window.location.href = '/subscriptions?error=server_error';
            }
          </script>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2>❌ Connection Error</h2>
            <p>An error occurred while processing your bank connection.</p>
            <p><a href="/subscriptions">Return to subscriptions</a></p>
          </div>
        </body>
      </html>
    `, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Yodlee callback received:', body);
    
    const { userId, status, reason } = body;
    
    if (status === 'SUCCESS') {
      // Connection successful, fetch accounts
      const yodleeService = await YodleeService.getInstance();
      const accounts = await yodleeService.getAccounts();
      return NextResponse.json({ 
        message: 'Bank connection successful',
        accounts: accounts,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        message: 'Bank connection failed',
        reason: reason,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling Yodlee callback:', error);
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}
