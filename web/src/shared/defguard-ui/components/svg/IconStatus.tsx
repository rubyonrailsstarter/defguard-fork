import type { SVGProps } from 'react';
const SvgIconStatus = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={8}
    height={8}
    fill="none"
    viewBox="0 0 8 8"
    {...props}
  >
    <path
      fill="#CB3F3F"
      fillRule="evenodd"
      d="M4 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8m0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgIconStatus;
