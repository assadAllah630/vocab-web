import * as React from "react"
import { cn } from "../../utils/cn"

const Slider = React.forwardRef(({ className, min = 0, max = 100, step = 1, value = [0], onValueChange, ...props }, ref) => {
    const handleChange = (e) => {
        const newValue = [parseFloat(e.target.value)];
        onValueChange?.(newValue);
    };

    return (
        <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value[0]}
                onChange={handleChange}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                ref={ref}
                {...props}
            />
        </div>
    )
})
Slider.displayName = "Slider"

export { Slider }
