import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-stone-100 text-stone-800",
        food: "bg-orange-100 text-orange-700",
        hotel: "bg-blue-100 text-blue-700",
        transport: "bg-purple-100 text-purple-700",
        shopping: "bg-pink-100 text-pink-700",
        tickets: "bg-green-100 text-green-700",
        other: "bg-stone-100 text-stone-600",
        owner: "bg-amber-100 text-amber-700",
        editor: "bg-blue-100 text-blue-700",
        viewer: "bg-stone-100 text-stone-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
