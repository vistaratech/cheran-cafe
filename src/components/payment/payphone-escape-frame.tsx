'use client'

import { useEffect } from 'react'

/**
 * Detects when PayPhone has opened the return URL inside an iframe or popup
 * and breaks out to the top-level window so the user sees the full page.
 */
export function PayphoneEscapeFrame() {
  useEffect(() => {
    try {
      if (window.opener && !window.opener.closed) {
        // PayPhone opened checkout in a popup — redirect the opener and close the popup
        window.opener.location.href = window.location.href
        window.close()
      } else if (window.top && window.top !== window) {
        // PayPhone opened checkout in an iframe — break out to the top frame
        window.top.location.href = window.location.href
      }
    } catch {
      // Cross-origin restriction — cannot escape, stay put
    }
  }, [])

  return null
}
