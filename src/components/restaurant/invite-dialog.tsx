"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Copy, Check, Loader2 } from "lucide-react"
import { useI18nStore } from "@/lib/stores/i18n-store"
import { useUserStore } from "@/lib/stores/user-store"
import { toast } from "sonner"

interface InviteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  roles: { id: string; name: string }[]
}

export function InviteDialog({ isOpen, onOpenChange, roles }: InviteDialogProps) {
  const { t } = useI18nStore()
  const getCurrentUser = useUserStore((s) => s.getCurrentUser)

  const [selectedRole, setSelectedRole] = useState("")
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateLink = async () => {
    if (!selectedRole) {
      toast.error(t('restaurant.users.invite.select_role_error'))
      return
    }

    const currentUser = getCurrentUser()
    if (!currentUser) {
      toast.error("Not authenticated")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: currentUser.id, role: selectedRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || t('restaurant.users.invite.generate_error'))
        return
      }

      setGeneratedLink(data.link)
    } catch {
      toast.error(t('restaurant.users.invite.generate_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedRole("")
      setGeneratedLink(null)
      setCopied(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('restaurant.users.invite.title')}</DialogTitle>
          <DialogDescription>{t('restaurant.users.invite.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invite-role" className="text-right">
              {t('restaurant.users.dialog.role')}
            </Label>
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!!generatedLink}>
              <SelectTrigger className="col-span-3" id="invite-role">
                <SelectValue placeholder={t('restaurant.users.dialog.role_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {generatedLink && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">{t('restaurant.users.invite.link_label')}</Label>
              <div className="col-span-3 flex gap-2">
                <Input value={generatedLink} readOnly className="text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {generatedLink && (
            <p className="text-xs text-muted-foreground text-center">
              {t('restaurant.users.invite.expires_note')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            {generatedLink ? t('restaurant.users.dialog.cancel').replace('Cancel', 'Close') : t('restaurant.users.dialog.cancel')}
          </Button>
          {!generatedLink && (
            <Button type="button" onClick={handleGenerateLink} disabled={loading || !selectedRole}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('restaurant.users.invite.generate_button')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
