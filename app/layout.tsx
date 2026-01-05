import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { UserProvider } from '@auth0/nextjs-auth0/client';

export const metadata = {
  title: 'Fantasy Playoffs',
  description: 'Fantasy Football Playoff Challenge',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white dark:bg-gray-900`}>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
