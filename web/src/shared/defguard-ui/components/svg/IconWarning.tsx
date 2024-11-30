import type { SVGProps } from 'react';
const SvgIconWarning = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    fill="none"
    viewBox="0 0 18 18"
    {...props}
  >
    <circle cx={9} cy={9} r={9} fill="#CB3F3F" />
    <path
      fill="#FCEEEE"
      d="M9.933 10.849H8.066l-.294-6.802h2.455zm-2.229 2.119q0-.246.092-.458.093-.212.264-.366.17-.154.403-.243.232-.088.52-.088.286 0 .519.088.233.09.403.243.171.154.264.366.092.212.092.458 0 .245-.092.458-.093.212-.264.365a1.3 1.3 0 0 1-.403.243q-.232.09-.52.089-.286 0-.52-.089a1.3 1.3 0 0 1-.402-.243 1.05 1.05 0 0 1-.264-.365 1.1 1.1 0 0 1-.092-.458"
    />
  </svg>
);
export default SvgIconWarning;
