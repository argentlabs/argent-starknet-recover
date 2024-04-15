import {
  constants,
  number,
  validateAndParseAddress,
  validateChecksumAddress,
} from "starknet-410";

import * as yup from "yup";

const isChecksumAddress = (address: string) => {
  if (/^0x[0-9a-f]{63,64}$/.test(address)) {
    return false;
  }
  return true;
};

export const numberValue = yup
  .string()
  .trim()
  .matches(/^[0-9]+$/)
  .required();

export const hexValue = yup
  .string()
  .trim()
  .matches(
    /^0x[0-9a-f]+$/i,
    "Hex value must be 0x prefixed and only contain hex characters"
  )
  .required("Hex value is required");

export const addressSchema = hexValue
  .required("Address is required")
  .test((address, ctx) => {
    if (!address) {
      return ctx.createError({ message: "Address is required" });
    }
    try {
      if (!/^0x[0-9a-fA-F]+$/.test(address)) {
        return ctx.createError({ message: "Address should be hexadecimal" });
      }

      if (!/^0x[0-9a-fA-F]{62,64}$/.test(address)) {
        return ctx.createError({
          message: "Address should be between 62 and 64 characters long",
        });
      }

      const parsedAddress = validateAndParseAddress(address);
      if (number.toBN(parsedAddress).eq(constants.ZERO)) {
        return ctx.createError({ message: "Zero address not allowed" });
      }
    } catch {
      return ctx.createError({ message: "Invalid address" });
    }

    return true;
  });
