"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheranLogo } from "@/components/ui/cheran-logo"

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-amber-900/10 shadow-lg">
          <CardHeader className="text-center items-center">
            <CheranLogo size={72} className="mb-2" />
            <CardTitle className="text-3xl font-headline font-bold text-[#603B26]">Cheran Cafe</CardTitle>
            <CardDescription>Welcome back! Please login to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
