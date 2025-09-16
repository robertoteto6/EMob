"use client";

import { cloneElement, isValidElement, ReactElement, ReactNode, useId } from "react";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: TooltipSide;
  className?: string;
  tooltipClassName?: string;
}

const SIDE_CLASSES: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const Tooltip = ({
  content,
  children,
  side = "top",
  className = "",
  tooltipClassName = "",
}: TooltipProps) => {
  const tooltipId = useId();

  let child = children;
  if (isValidElement(children)) {
    const childProps = (children.props as Record<string, unknown>) || {};
    const existingDescription = typeof childProps["aria-describedby"] === "string"
      ? (childProps["aria-describedby"] as string)
      : undefined;
    const describedBy = [existingDescription, tooltipId].filter(Boolean).join(" ").trim();

    child = cloneElement(children, {
      "aria-describedby": describedBy,
    } as unknown as Partial<typeof children.props>);
  }

  return (
    <div className={`relative inline-flex group/tooltip ${className}`}>
      {child}
      <div
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute z-20 whitespace-pre rounded-lg bg-gray-900/95 px-3 py-2 text-xs font-medium text-gray-100 shadow-xl opacity-0 transition-opacity duration-200 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${SIDE_CLASSES[side]} ${tooltipClassName}`.trim()}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
