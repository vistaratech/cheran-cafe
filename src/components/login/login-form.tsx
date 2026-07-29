"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner";
import { useI18nStore } from "@/lib/stores/i18n-store"
import { useUserStore } from "@/lib/stores/user-store";
import { clearSWRCache } from "@/lib/swr-fetcher"

// Simple cookie utility
const setCookie = (name: string, value: string, days: number) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

export function LoginForm() {
    const router = useRouter()
    const { t } = useI18nStore();
    const { login } = useUserStore();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Using the new login function from user store
        const success = await login(identifier, password);

        if (success) {
            // IMPORTANT: Clear SWR cache to ensure fresh data for this user
            clearSWRCache();
            
            // Set the auth cookie to maintain session
            setCookie("chefcito-auth", "true", 1);

            toast.success(t('userMenu.login_success_title'), {
                description: t('userMenu.login_success_desc'),
                duration: 3000,
            });
            
            // Pequeño delay para asegurar que el store esté sincronizado
            setTimeout(() => {
                router.push("/pos")
            }, 100)
        } else {
            toast.error(t('userMenu.login_error_title'), {
                description: t('userMenu.login_error_desc'),
                duration: 3000,
            });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="identifier">{t('userMenu.email_or_username')}</Label>
                <Input id="identifier" type="text" placeholder="email or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">{t('userMenu.password')}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full !mt-6 bg-primary hover:bg-accent text-primary-foreground font-bold">
                {t('userMenu.login')}
            </Button>
        </form>
    )
}

export function SignupForm() {
    const router = useRouter()
    const { t } = useI18nStore();
    const [name, setName] = useState("");
    const [restaurantName, setRestaurantName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error(t('userMenu.signup_error_title'), {
                description: t('userMenu.passwords_do_not_match'),
                duration: 3000,
            });
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    restaurantName: restaurantName || 'Mi Restaurante',
                    role: "Owner",
                    status: "Off Shift"
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(t('userMenu.signup_success_title'), {
                    description: t('userMenu.signup_success_desc'),
                    duration: 3000,
                });
                router.push("/login");
            } else {
                toast.error(t('userMenu.signup_error_title'), {
                    description: data.error || t('userMenu.signup_error_desc'),
                    duration: 3000,
                });
            }
        } catch (error) {
            toast.error(t('userMenu.signup_error_title'), {
                description: t('userMenu.signup_error_desc'),
                duration: 3000,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="signup-name">{t('userMenu.name')}</Label>
                <Input
                    id="signup-name"
                    type="text"
                    placeholder={t('userMenu.enter_your_name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="signup-restaurant-name">Nombre del Restaurante</Label>
                <Input
                    id="signup-restaurant-name"
                    type="text"
                    placeholder="Ej: Mi Restaurante Sabroso"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Opcional. Se usará "Mi Restaurante" si lo dejas vacío.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="signup-email">{t('userMenu.email')}</Label>
                <Input
                    id="signup-email"
                    type="email"
                    placeholder="owner@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="signup-password">{t('userMenu.password')}</Label>
                <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">{t('userMenu.confirm_password')}</Label>
                <Input
                    id="signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>

            <Button type="submit" className="w-full !mt-6 bg-primary hover:bg-accent text-primary-foreground font-bold">
                {t('userMenu.sign_up')}
            </Button>
        </form>
    )
}