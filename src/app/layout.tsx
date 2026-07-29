import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthWrapper } from '@/components/layout/auth-provider';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Cheran Cafe',
  description: 'POS and KDS for Cheran Cafe',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        {/* Payphone Cajita de Pagos */}
        <link href="https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css" rel="stylesheet" />
        {/* Cargar script con atributos para mejor control de carga */}
        <script
          src="https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js"
          async={true}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress Chrome DevTools profiling warnings
              if (typeof window !== 'undefined') {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (
                    message.includes('Base.Message.Init: Init completed slowly') ||
                    message.includes('Base.Events: Time boxed event exceeded timeout') ||
                    message.includes('Base.DF: Device profiling did not complete')
                  ) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };

                // Log para rastrear carga del script de Payphone
                console.log('[Layout] Script de Payphone insertado en el DOM');

                // Detectar cuando el script carga
                window.addEventListener('load', function() {
                  console.log('[Layout] Window load event fired');
                  setTimeout(function() {
                    console.log('[Layout] PPaymentButtonBox disponible:', typeof window.PPaymentButtonBox !== 'undefined');
                  }, 500);
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <Providers>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </Providers>
        <Toaster richColors />
      </body>
    </html>
  );
}