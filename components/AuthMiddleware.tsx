'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    // If user is not authenticated and trying to access protected routes
    if (!isAuthenticated && pathname !== '/') {
      router.push('/');
    }
    // If user is authenticated and on the home page
    else if (isAuthenticated && pathname === '/') {
      router.push('/message');
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
} 