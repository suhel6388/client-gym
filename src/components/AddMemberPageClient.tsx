"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";

export function AddMemberPageClient() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to an API
    router.push("/members");
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          Add New Member
        </h1>
        <p className="mt-1.5 text-sm text-subtle">
          Fill in the details below to add a new member.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-6 rounded-card border border-line bg-card p-6 shadow-card"
      >
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
            Personal Information
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" name="phone" type="tel" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" name="dob" type="date" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gender">Gender</Label>
              <Select id="gender" name="gender">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" rows={3} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
            Membership Details
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="plan">Membership plan</Label>
              <Select id="plan" name="plan" required>
                <option value="">Select a plan</option>
                <option value="monthly">Monthly Flex</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual Pro</option>
                <option value="student">Student</option>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
            Emergency Contact
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="emergencyContact">Full name</Label>
              <Input id="emergencyContact" name="emergencyContact" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="emergencyPhone">Phone number</Label>
              <Input id="emergencyPhone" name="emergencyPhone" type="tel" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
            Additional Notes
          </h2>
          <div className="mt-4">
            <Textarea id="notes" name="notes" rows={4} />
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.push("/members")}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            Save member
          </Button>
        </div>
      </form>
    </div>
  );
}
