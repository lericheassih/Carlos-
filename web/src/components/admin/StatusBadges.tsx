import { Badge, type Tone } from "@/components/ui/Badge";
import { PAY_STATUS_LABELS, RES_STATUS_LABELS, STATUS_LABELS, type ApartmentStatus, type PaymentStatus, type ReservationStatus } from "@/lib/types";

const APT: Record<ApartmentStatus, Tone> = { draft: "neutral", published: "success", hidden: "warning", archived: "neutral" };
const RES: Record<ReservationStatus, Tone> = { pending: "attention", confirmed: "info", in_progress: "brand", completed: "success", cancelled: "danger" };
const PAY: Record<PaymentStatus, Tone> = { unpaid: "danger", partial: "warning", paid: "success", refunded: "neutral" };

export const AptStatus = ({ s }: { s: ApartmentStatus }) => <Badge tone={APT[s]} dot>{STATUS_LABELS[s]}</Badge>;
export const ResStatus = ({ s }: { s: ReservationStatus }) => <Badge tone={RES[s]} dot>{RES_STATUS_LABELS[s]}</Badge>;
export const PayStatus = ({ s }: { s: PaymentStatus }) => <Badge tone={PAY[s]}>{PAY_STATUS_LABELS[s]}</Badge>;
