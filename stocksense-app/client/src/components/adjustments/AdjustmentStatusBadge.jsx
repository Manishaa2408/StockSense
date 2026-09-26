import React from 'react';
import Badge from '../ui/Badge';

const STATUS_CONFIG = {
  DRAFT:     { variant: 'neutral',  label: 'Draft' },
  APPROVED:  { variant: 'info',     label: 'Approved' },
  COMPLETED: { variant: 'success',  label: 'Completed' },
  CANCELED:  { variant: 'danger',   label: 'Canceled' }
};

export default function AdjustmentStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { variant: 'neutral', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
