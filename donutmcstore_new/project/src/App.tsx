import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PromoBanner } from './components/PromoBanner';
import { HomePage } from './pages/HomePage';
import { CartPage } from './pages/CartPage';
import { SellPage } from './pages/SellPage';
import { FreeMoneyPage } from './pages/FreeMoneyPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { SchematicsPage } from './pages/SchematicsPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminInvites } from './pages/admin/AdminInvites';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminSchematics } from './pages/admin/AdminSchematics';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminLogs } from './pages/admin/AdminLogs';
import { useAuthStore } from './stores/authStore';
import { BannedPage } from './pages/BannedPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function GlobalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particleCount = Math.min(60, Math.floor(window.innerWidth / 25));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      hue: Math.random() * 30 + 185,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let time = 0;
    let lastTime = 0;
    const animate = (currentTime: number) => {
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const delta = currentTime - lastTime;
      if (delta < 16) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime;

      time += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.sin(time) * 200,
        canvas.height / 2 + Math.cos(time * 0.7) * 200,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.9
      );
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
      gradient.addColorStop(0.4, 'rgba(59, 130, 246, 0.06)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.8 + Math.cos(time * 0.5) * 150,
        canvas.height * 0.2 + Math.sin(time * 0.8) * 150,
        0,
        canvas.width * 0.8,
        canvas.height * 0.2,
        canvas.width * 0.6
      );
      gradient2.addColorStop(0, 'rgba(14, 165, 233, 0.08)');
      gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient3 = ctx.createRadialGradient(
        canvas.width * 0.2 + Math.sin(time * 0.6) * 100,
        canvas.height * 0.7 + Math.cos(time * 0.4) * 100,
        0,
        canvas.width * 0.2,
        canvas.height * 0.7,
        canvas.width * 0.5
      );
      gradient3.addColorStop(0, 'rgba(6, 182, 212, 0.06)');
      gradient3.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          particle.vx -= (dx / dist) * force * 0.015;
          particle.vy -= (dy / dist) * force * 0.015;
        }

        particle.vx *= 0.99;
        particle.vy *= 0.99;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 80%, 60%, ${particle.opacity})`;
        ctx.fill();

        particles.forEach((other, j) => {
          if (i >= j) return;
          const ox = other.x - particle.x;
          const oy = other.y - particle.y;
          const odist = Math.sqrt(ox * ox + oy * oy);
          if (odist < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `hsla(195, 80%, 55%, ${0.15 * (1 - odist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsAnimating(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
      {displayChildren}
    </div>
  );
}

function AppContent() {
  const initialize = useAuthStore((state) => state.initialize);
  const isBanned = useAuthStore((state) => state.isBanned);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated && isBanned && window.location.pathname !== '/banned') {
      window.location.href = '/banned';
    }
  }, [isAuthenticated, isBanned]);

  if (isLoading) {
    return (
      <>
        <GlobalBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 mx-auto border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400 text-lg">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (isAuthenticated && isBanned && window.location.pathname !== '/banned') {
    return (
      <>
        <GlobalBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 mx-auto border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-red-400 text-lg">Access Denied - Redirecting...</p>
          </div>
        </div>
      </>
    );
  }

  const BannedRedirect = ({ children }: { children: React.ReactNode }) => {
    if (isAuthenticated && isBanned) {
      return <Navigate to="/banned" replace />;
    }
    return <>{children}</>;
  };

  return (
    <>
      <GlobalBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <PromoBanner />
        <Navbar />
        <main className="flex-1 pt-32">
          <PageTransition>
            <Routes>
              <Route path="/" element={<BannedRedirect><HomePage /></BannedRedirect>} />
              <Route path="/cart" element={<BannedRedirect><CartPage /></BannedRedirect>} />
              <Route path="/order-success" element={<BannedRedirect><OrderSuccessPage /></BannedRedirect>} />
              <Route path="/banned" element={<BannedPage />} />
              <Route path="/sell" element={<BannedRedirect><ProtectedRoute><SellPage /></ProtectedRoute></BannedRedirect>} />
              <Route path="/free-money" element={<BannedRedirect><ProtectedRoute><FreeMoneyPage /></ProtectedRoute></BannedRedirect>} />
              <Route path="/reviews" element={<BannedRedirect><ReviewsPage /></BannedRedirect>} />
              <Route path="/schematics" element={<BannedRedirect><ProtectedRoute><SchematicsPage /></ProtectedRoute></BannedRedirect>} />
              <Route path="/orders" element={<BannedRedirect><ProtectedRoute><OrdersPage /></ProtectedRoute></BannedRedirect>} />
              <Route path="/profile" element={<BannedRedirect><ProtectedRoute><ProfilePage /></ProtectedRoute></BannedRedirect>} />
              <Route path="/admin" element={<BannedRedirect><AdminLayout /></BannedRedirect>}>
                <Route index element={<AdminOverview />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="invites" element={<AdminInvites />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="schematics" element={<AdminSchematics />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="logs" element={<AdminLogs />} />
              </Route>
            </Routes>
          </PageTransition>
        </main>
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
