import React from "react"
import { cn } from "../lib/utils"

const Avatar = React.forwardRef(({ className, src, alt, fallback, ...props }, ref) => {
  const [imageError, setImageError] = React.useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={cn("relative inline-block h-10 w-10 overflow-hidden rounded-full", className)} ref={ref} {...props}>
      {!imageError && src ? (
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          {fallback ? (
            fallback
          ) : (
            <span className="text-xl font-medium uppercase text-muted-foreground">{alt ? alt.charAt(0) : "?"}</span>
          )}
        </div>
      )}
    </div>
  )
})

Avatar.displayName = "Avatar"

export { Avatar }

