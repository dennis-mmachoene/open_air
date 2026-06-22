import { redirect } from "next/navigation";

/** The old per-user admin area has been replaced by the isolated System
 *  Administrator console at /sys. */
export default function AdminRedirect() {
  redirect("/sys");
}
