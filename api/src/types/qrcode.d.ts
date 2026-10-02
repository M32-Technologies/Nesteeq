declare module "qrcode" {
  type QRCodeErrorCorrectionLevel = "L" | "M" | "Q" | "H"

  type QRCodeToDataURLOptions = {
    width?: number
    margin?: number
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel
  }

  const QRCode: {
    toDataURL(
      text: string,
      options?: QRCodeToDataURLOptions
    ): Promise<string>
  }

  export default QRCode
}
