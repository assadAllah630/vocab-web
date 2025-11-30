"use client"

import * as React from "react"
import { cn } from "../../utils/cn"

const Collapsible = React.forwardRef(({ className, open, onOpenChange, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open || false)

    React.useEffect(() => {
        if (open !== undefined) {
            setIsOpen(open)
        }
    }, [open])

    const handleOpenChange = (newOpen) => {
        setIsOpen(newOpen)
        onOpenChange?.(newOpen)
    }

    return (
        <div
            ref={ref}
            data-state={isOpen ? "open" : "closed"}
            className={cn(className)}
            {...props}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { isOpen, onOpenChange: handleOpenChange })
                }
                return child
            })}
        </div>
    )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef(({ className, children, isOpen, onOpenChange, asChild, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button"
    return (
        <Comp
            ref={ref}
            onClick={() => onOpenChange?.(!isOpen)}
            className={cn(className)}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            {children}
        </Comp>
    )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef(({ className, children, isOpen, ...props }, ref) => {
    if (!isOpen) return null

    return (
        <div
            ref={ref}
            className={cn("overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down", className)}
            {...props}
        >
            {children}
        </div>
    )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
