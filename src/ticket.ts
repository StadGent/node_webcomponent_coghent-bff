import { environment } from './environment';
import { RESTDataSourceWithStaticToken } from './RestDataSourceWithStaticToken';
import { ticketXML } from './sources/ticket';
import { Context } from './types';

export class TicketsAPI extends RESTDataSourceWithStaticToken<Context> {
  public baseURL = `${environment.api.collectionAPIUrl}/`;

  updateCodeOfTicket (_code: string): string{
    const defaultCode = '123456'
    const firstIndex =ticketXML.indexOf(defaultCode)
    const textBeforeCode = ticketXML.substring(0,firstIndex)
    const textAfterCode = ticketXML.substring(firstIndex+defaultCode.length + 2)
    return `${textBeforeCode}${_code}${textAfterCode}`
  }
}