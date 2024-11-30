import type { SVGProps } from 'react';
const SvgIconPlus = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={10}
    height={10}
    fill="none"
    viewBox="0 0 10 10"
    {...props}
  >
    <path fill="#899CA8" d="M4 1v8a1 1 0 0 0 2 0V1a1 1 0 0 0-2 0" />
    <path fill="#899CA8" d="M1 6h8a1 1 0 0 0 0-2H1a1 1 0 0 0 0 2" />
  </svg>
);
export default SvgIconPlus;
