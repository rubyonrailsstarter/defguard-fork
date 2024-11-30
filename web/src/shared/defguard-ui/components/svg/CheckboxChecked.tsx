import type { SVGProps } from 'react';
const SvgCheckboxChecked = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    fill="none"
    viewBox="0 0 18 18"
    {...props}
  >
    <rect width={18} height={18} fill="#0C8CE0" rx={6} />
    <rect width={8} height={8} x={5} y={5} fill="#F9F9F9" rx={2} />
  </svg>
);
export default SvgCheckboxChecked;
