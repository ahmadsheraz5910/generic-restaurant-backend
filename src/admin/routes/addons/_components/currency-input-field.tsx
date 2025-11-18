"use client";
import BaseCurrencyInput from "react-currency-input-field";
import { ControllerRenderProps } from "react-hook-form";
import { AdminCurrency } from "@medusajs/framework/types";
import { Input, Text } from "@medusajs/ui";

interface Props {
  currencyInfo: AdminCurrency;
  field: ControllerRenderProps<any, string>;
}

export const CurrencyInputField = ({ currencyInfo, field }: Props) => {
  const { value, onChange, onBlur, ref, ...rest } = field;

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center border-r">
        <Text
          className="text-ui-fg-muted"
          size="small"
          leading="compact"
          weight="plus"
        >
          {currencyInfo.symbol_native}
        </Text>
      </div>
      <BaseCurrencyInput
        {...rest}
        ref={ref}
        className="pl-10 flex-1"
        onBlur={onBlur}
        onChange={onChange}
        decimalScale={currencyInfo.decimal_digits}
        decimalsLimit={currencyInfo.decimal_digits}
        autoComplete="off"
        placeholder="0.00"
        customInput={Input}
      />
    </div>
  );
};
