import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Error | Chefcito',
  robots: 'noindex, nofollow',
}

interface ErrorPageProps {
  searchParams: Promise<{ message?: string }>
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const { message } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-lg">
        <Card className="w-full max-w-md mx-auto border-destructive/30 bg-destructive/5 animate-in fade-in zoom-in duration-500">
          <CardHeader className="text-center space-y-4 pb-2">
            <AlertTriangle className="h-20 w-20 text-destructive mx-auto animate-in zoom-in duration-300" />
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-destructive">
                Algo salió mal
              </CardTitle>
              <CardDescription className="text-destructive/80 text-base">
                {message ?? 'Se produjo un error inesperado. Por favor intenta de nuevo.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Si el problema persiste, contacta al administrador del sistema.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button asChild className="w-full">
              <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Perfil
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
