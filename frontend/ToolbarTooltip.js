import React from 'react';
import {Tooltip} from '@airtable/blocks/ui';

export const ToolbarTooltip = ({content, children}) => {
	return (
		<Tooltip
			content={content}
			placementX={Tooltip.placements.CENTER}
			placementY={Tooltip.placements.BOTTOM}
			className="styled-tooltip"
		>
			{children}
		</Tooltip>
)};