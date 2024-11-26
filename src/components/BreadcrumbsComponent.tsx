import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';

interface BreadcrumbsComponentProps {
  links: { href: string; label: string }[];
  current: string;
}

const BreadcrumbsComponent: React.FC<BreadcrumbsComponentProps> = ({ links, current }) => {
  return (
    <Breadcrumbs aria-label="breadcrumb">
      {links.map((link, index) => (
        <MuiLink key={index} underline="hover" color="inherit" href={link.href}>
          {link.label}
        </MuiLink>
      ))}
      <Typography sx={{ color: 'text.primary' }}>{current}</Typography>
    </Breadcrumbs>
  );
};

export default BreadcrumbsComponent; 