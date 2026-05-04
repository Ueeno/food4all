import type * as React from "react"

import { GlassButton } from "@/components/glass-button"

export type AppButtonProps = React.ComponentProps<typeof GlassButton>

export function AppButton(props: AppButtonProps) {
  return <GlassButton {...props} />
}
