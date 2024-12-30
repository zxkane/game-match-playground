import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';

interface BreadcrumbsComponentProps {
  links: { href: string; label: string }[];
  current: string;
}

const BreadcrumbsComponent: React.FC<BreadcrumbsComponentProps> = ({ links, current }) => {
  return (
    <Breadcrumbs aria-label="breadcrumb">
      {links.map((link, index) => (
        <MuiLink 
          key={index} 
          underline="hover" 
          sx={{ 
            fontWeight: 'bold',
            color: 'var(--amplify-colors-font-secondary) !important'
          }}
          href={link.href}
        >
          {link.label}
        </MuiLink>
      ))}
      <Typography sx={{ fontWeight: 'bold', color: 'var(--amplify-colors-font-secondary) !important' }}>
        {current}
      </Typography>
    </Breadcrumbs>
  );
};

export default BreadcrumbsComponent; 