"use client"

import { useRef } from "react"
import { useTheme } from "next-themes"
import TextCursorProximity from "@/components/ui/text-cursor-proximity"

const ASCII = ["\u270E", "\u2710", "\u2711", "\u2711"]

export default function TextCursorProximityPreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24"
      ref={containerRef}
    >
      <div 
        className="relative w-full cursor-pointer overflow-hidden justify-start items-start flex text-white rounded-3xl"
        style={{ 
          backgroundColor: isDark ? "#000000" : "#0000FF",
          minHeight: "400px", // Добавляем minimal height
          height: "100%"
        }}
      >
        <div className="flex flex-col justify-center uppercase leading-none pt-12 pl-12">
          <TextCursorProximity
            label="DIGITAL"
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter"
            styles={{
              transform: {
                from: "scale(1)",
                to: "scale(1.4)",
              },
              color: { 
                from: "#FFFFFF", 
                to: isDark ? "#84CC16" : "#FF87C1"
              },
            }}
            falloff="gaussian"
            radius={100}
            containerRef={containerRef}
          />
          <TextCursorProximity
            label="WORKSHOP"
            className="leading-none text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter"
            styles={{
              transform: {
                from: "scale(1)",
                to: "scale(1.4)",
              },
              color: { 
                from: "#FFFFFF", 
                to: isDark ? "#84CC16" : "#FF87C1"
              },
            }}
            falloff="gaussian"
            radius={100}
            containerRef={containerRef}
          />
        </div>

        <div className="absolute bottom-6 flex w-full justify-between px-12">
          {ASCII.map((pencil, i) => (
            <span 
              key={i} 
              className="text-2xl opacity-80"
              style={{ fontFamily: "serif" }}
            >
              {pencil}
            </span>
          ))}
        </div>

        <TextCursorProximity
          className="absolute top-6 right-6 hidden sm:block text-xs"
          label="15/01/2025"
          styles={{
            transform: {
              from: "scale(1)",
              to: "scale(1.4)",
            },
            color: { 
              from: "#FFFFFF", 
              to: isDark ? "#84CC16" : "#FF87C1"
            },
          }}
          falloff="linear"
          radius={10}
          containerRef={containerRef}
        />
      </div>
    </div>
  )
}

export { TextCursorProximityPreview as Preview }
