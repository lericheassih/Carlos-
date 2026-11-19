import {
  ArrowUpDown, BedDouble, Car, Check, ChefHat, Droplets, Laptop, Refrigerator, ShieldCheck, Snowflake, Sun, Tv, Umbrella,
  WashingMachine, Waves, Wifi, Zap, type LucideProps,
} from "lucide-react";

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  wifi: Wifi, snowflake: Snowflake, "chef-hat": ChefHat, tv: Tv, zap: Zap, car: Car, waves: Waves, droplets: Droplets,
  refrigerator: Refrigerator, "washing-machine": WashingMachine, "shield-check": ShieldCheck, "arrow-up-down": ArrowUpDown,
  sun: Sun, umbrella: Umbrella, laptop: Laptop, "bed-double": BedDouble, check: Check,
};

export function AmenityIcon({ name, ...props }: { name: string } & LucideProps) {
  const I = MAP[name] ?? Check;
  return <I aria-hidden {...props} />;
}
