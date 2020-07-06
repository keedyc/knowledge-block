import React, {useContext, useState} from 'react';
import {ActionsContext, ViewsContext} from './index';

import {
	Box,
	Button,
	Input
} from '@airtable/blocks/ui';

export const PageCommentsEditor = ({page, addComment}) => {
	const actions = useContext(ActionsContext);
	const views = useContext(ViewsContext);

	let [commentValue, setCommentValue] = useState('');

	const handleCommentSubmitted = () => {
		actions.addComment({
			'Text': commentValue,
			'Page': [{id: page.id}],
		});
		setCommentValue('');
	};

	return (
		<Box display="flex">
			<Input
				type="text"
				value={commentValue}
				placeholder="Add a comment"
				marginRight={1}
				onChange={(event) => setCommentValue(event.target.value)}
				disabled={!views.commentsTable.hasPermissionToCreateRecord()}
			/>
			<Button
				variant="primary"
				onClick={handleCommentSubmitted}
				disabled={!views.commentsTable.hasPermissionToCreateRecord()}
			>
				Add
			</Button>
		</Box>
	)
}
