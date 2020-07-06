import React, {Fragment} from 'react';
import {Box, useRecordById} from '@airtable/blocks/ui';
import {PageCommentsList} from './PageCommentsList';
import {PageCommentsEditor} from './PageCommentsEditor';

export const PageComments = ({pagesTable, pageID}) => {
	let page = useRecordById(pagesTable, pageID);

	let style = {
		display: 'flex',
		flexDirection: 'column',
		maxHeight: 'calc(100vh - 50px)',
	}

	return (
		<Box style={style}>
			<PageCommentsList page={page}/>
			<PageCommentsEditor page={page}/>
		</Box>
	)
}
