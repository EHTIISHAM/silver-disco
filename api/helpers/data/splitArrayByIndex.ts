export default function splitArrayByIndex(arr: any[], index: number) {
  return [arr.slice(0, index), arr.slice(index)];
}
