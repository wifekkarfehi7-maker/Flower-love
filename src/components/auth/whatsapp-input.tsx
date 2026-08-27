"use client";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";

export function WhatsappInput({
  dialCode,
  local,
  onDialCodeChange,
  onLocalChange,
  placeholder,
  invalid,
  id,
}: {
  dialCode: string;
  local: string;
  onDialCodeChange: (value: string) => void;
  onLocalChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
}) {
  return (
    <div className="flex gap-2" dir="ltr">
      <Select
        aria-label="Country code"
        value={dialCode}
        onChange={(e) => onDialCodeChange(e.target.value)}
        className="w-32 shrink-0 ps-3 pe-8 text-start"
        invalid={invalid}
      >
        {COUNTRIES.filter((c) => c.dialCode).map((c) => (
          <option key={c.code} value={c.dialCode}>
            {c.flag} +{c.dialCode}
          </option>
        ))}
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        dir="ltr"
        className="min-w-0 flex-1 text-start"
        placeholder={placeholder}
        value={local}
        onChange={(e) => onLocalChange(e.target.value.replace(/[^0-9]/g, ""))}
        invalid={invalid}
      />
    </div>
  );
}
