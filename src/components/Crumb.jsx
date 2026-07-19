import { Link } from 'react-router-dom';
import { IconChevronLeft } from './icons.jsx';

export default function Crumb({ to, label }) {
  return (
    <Link className="crumb" to={to}>
      <IconChevronLeft />
      {label}
    </Link>
  );
}
