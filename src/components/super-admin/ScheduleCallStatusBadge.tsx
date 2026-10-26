import { Badge } from "@/components/ui/Badge";
import type { ScheduleCallStatus } from "@/lib/schedule-call-view";
import { scheduleCallStatusMeta } from "@/lib/schedule-call-view";

export function ScheduleCallStatusBadge({
  status,
  dot = true,
}: {
  status: ScheduleCallStatus;
  dot?: boolean;
}) {
  const meta = scheduleCallStatusMeta(status);
  return (
    <Badge tone={meta.tone} dot={dot}>
      {meta.label}
    </Badge>
  );
}
