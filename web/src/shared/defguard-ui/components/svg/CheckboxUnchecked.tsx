import type { SVGProps } from 'react';
const SvgCheckboxUnchecked = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="none"
    viewBox="0 0 20 20"
    {...props}
  >
    <rect width={18} height={18} x={1} y={1} fill="#F9F9F9" rx={6} />
    <rect width={18} height={18} x={1} y={1} stroke="#E8E8E8" rx={6} />
  </svg>
);
export default SvgCheckboxUnchecked;
