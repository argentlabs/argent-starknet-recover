import { Ora } from "ora";

export function oraLog(ora: Ora, log: string) {
  const oraSpinning = ora.isSpinning;
  const oraText = ora.text;
  ora.info(log);
  if (oraText) {
    ora.text = oraText;
  }
  if (oraSpinning) {
    ora.start();
  }
}
