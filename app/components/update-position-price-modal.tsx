"use client";



import { useEffect, useState } from "react";

import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";

import { InputWithSuffix } from "@/app/components/input-with-suffix";

import { PhoneField } from "@/app/components/phone-field";

import { formatAmount } from "@/app/lib/estimates/calculate-line";

import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";

import {

  formInputClassName,

  formInputFullWidthClass,

} from "@/app/lib/form/input-styles";

import type {

  PositionPriceSummary,

  UpdatePositionUnitPriceInput,

} from "@/app/lib/positions/types";

import type { CurrencyCode } from "@/app/lib/settings/currencies";

import {

  parseStoredPhone,

  validateEmail,

  validatePhone,

} from "@/app/lib/validation/contact-fields";

const modalSectionClassName =
  "overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50/90 to-white shadow-sm";

const modalSectionHeaderClassName =
  "flex items-start gap-3 border-b border-zinc-100 bg-zinc-50/80 px-5 py-3.5";

const modalSectionIconClassName =
  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200/80";

const modalSectionTitleClassName =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500";

const modalSectionBodyClassName = "p-5";



type UpdatePositionUnitPriceModalProps = {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  position: PositionPriceSummary;

  currency: CurrencyCode;

  onSave: (input: Omit<UpdatePositionUnitPriceInput, "id">) => void;

  blocking?: boolean;

};



type SupplierFormState = {

  supplierName: string;

  supplierContactName: string;

  supplierEmail: string;

  supplierPhone: string;

};



type FieldErrors = {

  unitPrice?: string;

  supplierEmail?: string;

  supplierPhone?: string;

};



function parseDecimalInput(value: string): number | null {

  const normalized = value.trim().replace(",", ".");

  if (!normalized) return null;



  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed)) return null;

  return parsed;

}



function calcUnitPriceFromTotals(

  volumeValue: string,

  totalPriceValue: string,

): number | null {

  const volume = parseDecimalInput(volumeValue);

  const totalPrice = parseDecimalInput(totalPriceValue);



  if (volume === null || totalPrice === null || volume <= 0) {

    return null;

  }



  return totalPrice / volume;

}



const emptySupplierForm: SupplierFormState = {

  supplierName: "",

  supplierContactName: "",

  supplierEmail: "",

  supplierPhone: "",

};



export function UpdatePositionPriceModal({

  open,

  onOpenChange,

  position,

  currency,

  onSave,

  blocking = false,

}: UpdatePositionUnitPriceModalProps) {

  const [unitPrice, setUnitPrice] = useState("");

  const [totalVolume, setTotalVolume] = useState("");

  const [totalPrice, setTotalPrice] = useState("");

  const [supplierForm, setSupplierForm] =

    useState<SupplierFormState>(emptySupplierForm);

  const [phoneCallingCode, setPhoneCallingCode] = useState(DEFAULT_CALLING_CODE);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});



  useEffect(() => {

    if (!open) return;



    const { callingCode, local } = parseStoredPhone(

      position.supplierPhone ?? "",

    );



    setUnitPrice(

      position.unitPrice !== undefined ? formatAmount(position.unitPrice) : "",

    );

    setTotalVolume("");

    setTotalPrice("");

    setSupplierForm({

      supplierName: position.supplierName ?? "",

      supplierContactName: position.supplierContactName ?? "",

      supplierEmail: position.supplierEmail ?? "",

      supplierPhone: local,

    });

    setPhoneCallingCode(callingCode);

    setFieldErrors({});

  }, [open, position]);



  function updateSupplierField<K extends keyof SupplierFormState>(

    field: K,

    value: SupplierFormState[K],

  ) {

    setSupplierForm((current) => ({ ...current, [field]: value }));

    if (field === "supplierEmail") {

      setFieldErrors((current) => ({ ...current, supplierEmail: undefined }));

    }

    if (field === "supplierPhone") {

      setFieldErrors((current) => ({ ...current, supplierPhone: undefined }));

    }

  }



  function applyCalculatedUnitPrice(volumeValue: string, totalPriceValue: string) {

    const calculated = calcUnitPriceFromTotals(volumeValue, totalPriceValue);

    if (calculated === null) return;

    setUnitPrice(formatAmount(calculated));

    setFieldErrors((current) => ({ ...current, unitPrice: undefined }));

  }



  function handleVolumeChange(value: string) {

    setTotalVolume(value);

    applyCalculatedUnitPrice(value, totalPrice);

  }



  function handleTotalPriceChange(value: string) {

    setTotalPrice(value);

    applyCalculatedUnitPrice(totalVolume, value);

  }



  function validateForm(): boolean {

    const nextErrors: FieldErrors = {};

    const parsedUnitPrice = parseDecimalInput(unitPrice);



    if (parsedUnitPrice === null || parsedUnitPrice < 0) {

      nextErrors.unitPrice = "Ievadi derīgu cenu par 1 mērvienību.";

    }



    const emailError = validateEmail(supplierForm.supplierEmail);

    if (emailError) nextErrors.supplierEmail = emailError;



    const phoneError = validatePhone(

      supplierForm.supplierPhone,

      phoneCallingCode,

    );

    if (phoneError) nextErrors.supplierPhone = phoneError;



    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;

  }



  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();



    if (!validateForm()) {

      return;

    }



    const parsedUnitPrice = parseDecimalInput(unitPrice);

    if (parsedUnitPrice === null) {

      return;

    }



    onSave({

      unitPrice: parsedUnitPrice,

      supplierName: supplierForm.supplierName,

      supplierContactName: supplierForm.supplierContactName,

      supplierEmail: supplierForm.supplierEmail,

      supplierPhone: supplierForm.supplierPhone,

      supplierPhoneCallingCode: phoneCallingCode,

    });

  }



  const initialUnitPrice =
    position.unitPrice !== undefined ? formatAmount(position.unitPrice) : "";
  const initialPhone = parseStoredPhone(position.supplierPhone ?? "");
  const isDirty =
    unitPrice !== initialUnitPrice ||
    totalVolume.trim().length > 0 ||
    totalPrice.trim().length > 0 ||
    supplierForm.supplierName !== (position.supplierName ?? "") ||
    supplierForm.supplierContactName !== (position.supplierContactName ?? "") ||
    supplierForm.supplierEmail !== (position.supplierEmail ?? "") ||
    supplierForm.supplierPhone !== initialPhone.local ||
    phoneCallingCode !== initialPhone.callingCode;



  return (

    <AppModal

      open={open}

      onOpenChange={onOpenChange}

      title="Atjaunot cenu"

      description={`${position.name} · ${position.unit}`}

      blocking={blocking}

      dirty={isDirty}

      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}

    >

      <form noValidate onSubmit={handleSubmit} className="space-y-4">

        <label htmlFor={`update-unit-price-${position.id}`} className="block">

          <span className="mb-1.5 block text-sm font-medium text-zinc-700">

            Cena par 1 {position.unit}

          </span>

          <InputWithSuffix

            id={`update-unit-price-${position.id}`}

            name="unitPrice"

            type="text"

            inputMode="decimal"

            value={unitPrice}

            suffix={`${currency} / ${position.unit}`}

            invalid={Boolean(fieldErrors.unitPrice)}

            onChange={(event) => {

              setUnitPrice(event.target.value);

              setFieldErrors((current) => ({ ...current, unitPrice: undefined }));

            }}

          />

          {fieldErrors.unitPrice ? (

            <p className="mt-1 text-sm text-red-600" role="alert">

              {fieldErrors.unitPrice}

            </p>

          ) : null}

        </label>



        <div className={modalSectionClassName}>

          <div className={modalSectionHeaderClassName}>

            <span className={modalSectionIconClassName}>

              <i className="fas fa-calculator" aria-hidden="true" />

            </span>

            <div>

              <p className={modalSectionTitleClassName}>Aprēķins no apjoma</p>

              <p className="mt-1 text-sm leading-snug text-zinc-600">

                Ievadi kopējo apjomu un kopējo cenu — cena par 1 mērvienību

                aizpildīsies automātiski.

              </p>

            </div>

          </div>



          <div className={`${modalSectionBodyClassName} grid grid-cols-2 gap-4`}>

            <label

              htmlFor={`update-total-volume-${position.id}`}

              className="block min-w-0"

            >

              <span className="mb-1.5 block text-sm font-medium text-zinc-700">

                Kopējais apjoms

              </span>

              <InputWithSuffix

                id={`update-total-volume-${position.id}`}

                name="totalVolume"

                type="text"

                inputMode="decimal"

                value={totalVolume}

                suffix={position.unit}

                onChange={(event) => handleVolumeChange(event.target.value)}

              />

            </label>



            <label

              htmlFor={`update-total-price-${position.id}`}

              className="block min-w-0"

            >

              <span className="mb-1.5 block text-sm font-medium text-zinc-700">

                Kopējā cena

              </span>

              <InputWithSuffix

                id={`update-total-price-${position.id}`}

                name="totalPrice"

                type="text"

                inputMode="decimal"

                value={totalPrice}

                suffix={currency}

                onChange={(event) =>

                  handleTotalPriceChange(event.target.value)

                }

              />

            </label>

          </div>

        </div>



        <div className={modalSectionClassName}>

          <div className={modalSectionHeaderClassName}>

            <span className={modalSectionIconClassName}>

              <i className="fas fa-store" aria-hidden="true" />

            </span>

            <div>

              <p className={modalSectionTitleClassName}>Veikals</p>

              <p className="mt-1 text-sm leading-snug text-zinc-600">

                Norādi veikalu un kontaktpersonu, no kuras iegādāta cena.

              </p>

            </div>

          </div>



          <div className={`${modalSectionBodyClassName} space-y-4`}>

          <div className="grid grid-cols-2 gap-4">

            <label

              htmlFor={`update-supplier-name-${position.id}`}

              className="block min-w-0"

            >

              <span className="mb-1.5 block text-sm font-medium text-zinc-700">

                Veikala nosaukums

              </span>

              <input

                id={`update-supplier-name-${position.id}`}

                name="supplierName"

                type="text"

                value={supplierForm.supplierName}

                onChange={(event) =>

                  updateSupplierField("supplierName", event.target.value)

                }

                className={`${formInputFullWidthClass} ${formInputClassName(false)}`}

              />

            </label>



            <label

              htmlFor={`update-supplier-contact-${position.id}`}

              className="block min-w-0"

            >

              <span className="mb-1.5 block text-sm font-medium text-zinc-700">

                Saziņas personas vārds

              </span>

              <input

                id={`update-supplier-contact-${position.id}`}

                name="supplierContactName"

                type="text"

                value={supplierForm.supplierContactName}

                onChange={(event) =>

                  updateSupplierField("supplierContactName", event.target.value)

                }

                className={`${formInputFullWidthClass} ${formInputClassName(false)}`}

              />

            </label>

          </div>



          <div className="grid grid-cols-2 items-start gap-4">

            <label

              htmlFor={`update-supplier-email-${position.id}`}

              className="block min-w-0"

            >

              <span className="mb-1.5 block text-sm font-medium text-zinc-700">

                Epasts

              </span>

              <input

                id={`update-supplier-email-${position.id}`}

                name="supplierEmail"

                type="email"

                autoComplete="email"

                value={supplierForm.supplierEmail}

                onChange={(event) =>

                  updateSupplierField("supplierEmail", event.target.value)

                }

                className={`${formInputFullWidthClass} ${formInputClassName(Boolean(fieldErrors.supplierEmail))}`}

                aria-invalid={Boolean(fieldErrors.supplierEmail)}

              />

              {fieldErrors.supplierEmail ? (

                <p className="mt-1 text-sm text-red-600" role="alert">

                  {fieldErrors.supplierEmail}

                </p>

              ) : null}

            </label>



            <div className="min-w-0">

              <PhoneField

                id={`update-supplier-phone-${position.id}`}

                value={supplierForm.supplierPhone}

                onChange={(value) => updateSupplierField("supplierPhone", value)}

                callingCode={phoneCallingCode}

                onCallingCodeChange={setPhoneCallingCode}

                error={fieldErrors.supplierPhone}

                skipGeoLookup={Boolean(position.supplierPhone?.trim())}

              />

            </div>

          </div>

          </div>

        </div>



        <ModalFormActions
          onCancel={() => onOpenChange(false)}
          cancelDisabled={blocking}
        >
          <button
            type="submit"
            disabled={blocking}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {blocking ? "Saglabā…" : "Saglabāt"}
          </button>
        </ModalFormActions>

      </form>

    </AppModal>

  );

}

