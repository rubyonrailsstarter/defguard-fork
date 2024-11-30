import type { SVGProps } from 'react';
const SvgIconOutsideLink = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={13}
    height={13}
    fill="none"
    viewBox="0 0 13 13"
    {...props}
  >
    <path
      fill="#000"
      fillRule="evenodd"
      d="M.5.18h4v1.333H1.833v9.334h9.334V8.18H12.5v4H.5zm9.724 1.333H8.278V.18H12.5v4.222h-1.333V2.456L6.97 6.651 6.03 5.71z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgIconOutsideLink;
