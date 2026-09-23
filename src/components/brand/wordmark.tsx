import { cn } from "@/lib/utils";

const SIZES = {
  sm: "text-[1.2rem]",
  md: "text-[1.45rem]",
  lg: "text-[2.4rem] sm:text-[2.8rem]",
};

/**
 * The brand set as a word: Cormorant at book weight, the ampersand in italic
 * brass. It is always Latin — `lang="en"` keeps the Arabic page's rules
 * (and screen readers' pronunciation) from treating it as Arabic.
 */
export function Wordmark({ size = "md", className }: { size?: keyof typeof SIZES; className?: string }) {
  return (
    <span lang="en" className={cn("wordmark leading-none", SIZES[size], className)}>
      Flower <em>&amp;</em> Love
    </span>
  );
}
