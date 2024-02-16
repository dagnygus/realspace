import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'yearFromDate',
  standalone: true
})
export class YearFromDatePipe implements PipeTransform {

  transform(date: string): unknown {
    return date.substring(0, 4);
  }

}
