"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user-store";
import { clearSWRCache } from "@/lib/swr-fetcher";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

interface GoogleButtonProps {
  role?: string;
}

export function GoogleButton({ role }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setUser } = useUserStore();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Google client ID from server (no NEXT_PUBLIC_ needed)
  useEffect(() => {
    fetch("/api/auth/google/config")
      .then(r => r.json())
      .then(data => {
        if (data.enabled && data.clientId) {
          setClientId(data.clientId);
        } else {
          setClientId(null);
        }
      })
      .catch(() => setClientId(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    const initButton = () => {
      if (!window.google || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential, role }),
            });

            const data = await res.json();

            if (!res.ok) {
              console.error('[GoogleButton] Auth failed:', data);
              toast.error(data.error || "Google sign-in failed");
              return;
            }

            clearSWRCache();
            setUser(data.user);
            document.cookie = "chefcito-auth=true; path=/; max-age=86400";
            router.push("/pos");
          } catch {
            toast.error("Google sign-in failed");
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: containerRef.current.offsetWidth || 320,
        text: role ? "signup_with" : "signin_with",
      });
    };

    if (window.google) {
      initButton();
      return;
    }

    const existing = document.getElementById("google-gis-script");
    if (existing) {
      existing.addEventListener("load", initButton);
      return () => existing.removeEventListener("load", initButton);
    }

    const script = document.createElement("script");
    script.id = "google-gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initButton;
    script.onerror = () => {
      console.error('[GoogleButton] Failed to load Google Identity Services script');
    };
    document.head.appendChild(script);
  }, [clientId, role, router, setUser]);

  if (loading) {
    return (
      <div className="w-full min-h-[40px] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-sm font-medium">Google (not configured)</span>
      </button>
    );
  }

  return <div ref={containerRef} className="w-full min-h-[40px]" />;
}
