"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Easing, TargetAndTransition, Transition } from "framer-motion";

const easingMap = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
} as const;

export const BlurText = ({
  text,
  delay = 200,
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = "easeOut",
  onAnimationComplete,
  className = "",
}: {
  text: string;
  delay?: number;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: TargetAndTransition;
  animationTo?: TargetAndTransition;
  easing?: keyof typeof easingMap | Easing;
  onAnimationComplete?: () => void;
  className?: string;
}) => {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  const animatedCount = useRef(0);

  // Default animations based on direction
  const defaultFrom =
    direction === "top"
      ? {
          filter: "blur(10px)",
          opacity: 0,
          transform: "translate3d(0,-50px,0)",
        }
      : {
          filter: "blur(10px)",
          opacity: 0,
          transform: "translate3d(0,50px,0)",
        };

  const defaultTo: TargetAndTransition = {
    filter: ["blur(5px)", "blur(0px)"],
    opacity: [0.5, 1],
    transform: [
      direction === "top"
        ? "translate3d(0,5px,0)"
        : "translate3d(0,-5px,0)",
      "translate3d(0,0,0)",
    ],
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const easingValue: Transition["ease"] =
    typeof easing === "string" && easing in easingMap
      ? easingMap[easing as keyof typeof easingMap]
      : easing;

  return (
    <p ref={ref} className={`blur-text ${className} flex flex-wrap`}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          initial={animationFrom || defaultFrom}
          animate={inView ? animationTo || defaultTo : animationFrom || defaultFrom}
          transition={{
            duration: 1,
            ease: easingValue || "easeOut",
            delay: index * (delay / 1000),
          }}
          onAnimationComplete={() => {
            animatedCount.current += 1;
            if (animatedCount.current === elements.length && onAnimationComplete) {
              onAnimationComplete();
            }
          }}
          style={{
            display: "inline-block",
            willChange: "transform, filter, opacity",
            marginRight: animateBy === "words" ? "0.25em" : "0",
          }}
        >
          {element === " " ? "\u00A0" : element}
        </motion.span>
      ))}
    </p>
  );
};
