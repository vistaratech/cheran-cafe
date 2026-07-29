"use client"

import { useState } from "react"
import { LoginForm, SignupForm } from "@/components/login/login-form"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GoogleButton } from "@/components/login/google-button"
import LoginLayout from "@/components/layout/login-layout"
import { useI18nStore } from "@/lib/stores/i18n-store"

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login")
  const { t } = useI18nStore()

  return (
    <LoginLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="signup">
          <SignupForm />
        </TabsContent>
      </Tabs>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('userMenu.or')}</span>
        </div>
      </div>
      <GoogleButton role={activeTab === "signup" ? "Owner" : undefined} />
    </LoginLayout>
  )
}