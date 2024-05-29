import HtmlToJSX from 'htmltojsx';

export function convert(input: string): string {
  let output = '';
  let converter = new HtmlToJSX({
    createClass: false,
  });
  output = converter.convert(input);
  return output;
}
