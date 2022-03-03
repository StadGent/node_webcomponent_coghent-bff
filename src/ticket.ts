import { environment } from './environment';
import { splitStringInTwo } from './parsers/ticket';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { ticketXML } from './sources/ticket';
import { Context } from './types';

export class TicketsAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${environment.printService}/`;

  updateCodeOfTicket(_code: string): string {
    const defaultCode = '12345678'
    const splittedText = splitStringInTwo(ticketXML, defaultCode)
    return `${splittedText.before}${_code}${splittedText.after}`
  }

  updateQrCodeOfTicket(_textWithNewCode: string, _qrCodeValue: string): string {
    const defaultQrCodeValue = 'https://youtu.be/dQw4w9WgXcQ'
    const splittedText = splitStringInTwo(_textWithNewCode, defaultQrCodeValue)
    return `${splittedText.before}${_qrCodeValue}${splittedText.after}`
  }

  async print(_ticket: string): Promise<string | null> {
    let ticket = null
    try {
      ticket = await this.post(``, _ticket)
    } catch (error) {
      console.error({ error })
      console.error(`Couldn't POST to print ticket.`)
    }
    return ticket
  }
}