import React, {useEffect, useRef} from 'react';

import {
	Box,
	CollaboratorToken,
	Text,
	useRecords
} from '@airtable/blocks/ui';

export const PageCommentsList = ({page}) => {
	let commentsQuery = page.selectLinkedRecordsFromCell('Comments');
	let comments = useRecords(commentsQuery);

	// https://stackoverflow.com/a/52266212
	const endOfComments = useRef(null);
	useEffect(() => {
		endOfComments.current.scrollIntoView();
	}, [comments])

	let style = {
		flex: 5,
		overflowY: 'scroll',
	}

	return (
		<Box style={style}>
			{
				comments.length === 0 &&
				<Box
					height="84px"
					display="flex"
					alignItems="center"
					justifyContent="center"
				>
					There are no comments yet. Why not add one?
				</Box>
			}

			{
				comments.map(comment => {
					let created = comment.getCellValueAsString('created');
					let author = comment.getCellValue('Author');
					let text = comment.getCellValueAsString('Text');

					return (
						<Box key={comment.id} maxWidth="30em" padding={2} marginBottom={2}>
							<CollaboratorToken collaborator={author}/>
							<Text marginBottom={2}>{created}</Text>
							<Box border="default" borderRadius="large" padding={2}>
								<Text maxWidth="30em">{text}</Text>
							</Box>
						</Box>
					)
				})
			}
			<div
				style={{float: 'left', clear: 'both'}}
				ref={endOfComments}
			>

			</div>
		</Box>
	)
}
