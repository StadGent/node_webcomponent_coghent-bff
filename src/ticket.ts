import { environment } from './environment';
import { splitStringInTwo } from './parsers/ticket';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { ticketXML } from './sources/ticket';
import { Context } from './types';

export class TicketsAPI extends RESTDataSourceWithStaticToken<Context> {

  private updateCodeOfTicket(_code: string): string {
    const defaultCode = '12345678'
    const splittedText = splitStringInTwo(ticketXML, defaultCode)
    return `${splittedText.before}${_code}${splittedText.after}`
  }

  private updateQrCodeOfTicket(_textWithNewCode: string, _qrCodeValue: string): string {
    const defaultQrCodeValue = 'https://youtu.be/dQw4w9WgXcQ'
    const splittedText = splitStringInTwo(_textWithNewCode, defaultQrCodeValue)
    return `${splittedText.before}${_qrCodeValue}${splittedText.after}`
  }

  print(_code: string): string {
    const linkToWebPortal = `${environment.webPortal}${environment.codePostfix}/${_code}`
    const updatedWithCode = this.updateCodeOfTicket(_code)
    const updatedWithQRCode = this.updateQrCodeOfTicket(updatedWithCode, linkToWebPortal)
    return updatedWithQRCode
  }
}