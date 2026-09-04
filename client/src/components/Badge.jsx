import React from 'react';
import { Tag, TagLabel, TagLeftIcon, TagRightIcon } from '@chakra-ui/react';

/**
 * Badge Component (based on Credhive Design System)
 * 
 * Consolidates 'Pills' and 'Alert Badge' into a single scalable component.
 * 
 * @param {string} intent - 'default' | 'positive' | 'warning' | 'critical' | 'in-progress'
 * @param {string} variant - 'subtle' (default) | 'filled' (solid) | 'outline'
 * @param {string} label - The text to display inside the badge
 * @param {elementType} leadingIcon - Optional icon component (e.g. from lucide-react)
 * @param {elementType} trailingIcon - Optional icon component
 * @param {boolean} actionable - If true, increases padding for touch targets and adds pointer
 * @param {function} onClick - Click handler if actionable
 */
export const Badge = ({
  intent = 'default',
  variant = 'subtle',
  label,
  leadingIcon,
  trailingIcon,
  actionable = false,
  onClick,
  ...props
}) => {
  // Map our custom intents to Chakra's built-in color schemes
  const colorSchemeMap = {
    default: 'gray',
    positive: 'green',
    warning: 'orange',
    critical: 'red',
    'in-progress': 'blue',
  };

  const colorScheme = colorSchemeMap[intent] || 'gray';
  
  // Chakra's variants: 'subtle', 'solid', 'outline'
  const chakraVariant = variant === 'filled' ? 'solid' : variant;

  return (
    <Tag
      size={actionable ? 'lg' : 'md'}
      variant={chakraVariant}
      colorScheme={colorScheme}
      borderRadius="full" // Gives the pill shape
      px={actionable ? 4 : 2}
      py={actionable ? 2 : 0.5}
      cursor={actionable || onClick ? 'pointer' : 'default'}
      onClick={onClick}
      transition="all 0.2s"
      _hover={(actionable || onClick) ? { opacity: 0.8, transform: 'scale(1.02)' } : {}}
      {...props}
    >
      {leadingIcon && <TagLeftIcon boxSize="14px" as={leadingIcon} />}
      <TagLabel fontSize="xs" fontWeight="600">{label}</TagLabel>
      {trailingIcon && <TagRightIcon boxSize="14px" as={trailingIcon} />}
    </Tag>
  );
};

export default Badge;
