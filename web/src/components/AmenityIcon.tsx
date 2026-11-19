import {
  AlarmSmoke, ArrowUpDown, Bath, BedDouble, BriefcaseMedical, Car, Cctv, Check, ChefHat, Cigarette, Coffee, CookingPot, Droplet, Droplets,
  FireExtinguisher, Flame, KeyRound, Laptop, Lock, Microwave, PawPrint, Refrigerator, ShieldCheck, Shirt, Siren, Snowflake, Sun,
  Thermometer, Tv, Umbrella, WashingMachine, Waves, Wifi, Wind, Zap, type LucideProps,
} from "lucide-react";

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  wifi: Wifi, snowflake: Snowflake, "chef-hat": ChefHat, tv: Tv, zap: Zap, car: Car, waves: Waves, droplets: Droplets, droplet: Droplet,
  refrigerator: Refrigerator, "washing-machine": WashingMachine, "shield-check": ShieldCheck, "arrow-up-down": ArrowUpDown,
  sun: Sun, umbrella: Umbrella, laptop: Laptop, "bed-double": BedDouble, check: Check, wind: Wind, bath: Bath, shirt: Shirt,
  thermometer: Thermometer, "cooking-pot": CookingPot, flame: Flame, microwave: Microwave, coffee: Coffee, "paw-print": PawPrint,
  cigarette: Cigarette, "key-round": KeyRound, lock: Lock, cctv: Cctv, "alarm-smoke": AlarmSmoke, siren: Siren,
  "fire-extinguisher": FireExtinguisher, "briefcase-medical": BriefcaseMedical,
};

export function AmenityIcon({ name, ...props }: { name: string } & LucideProps) {
  const I = MAP[name] ?? Check;
  return <I aria-hidden strokeWidth={1.5} {...props} />;
}
