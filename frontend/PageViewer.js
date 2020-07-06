import React, {useContext, Fragment} from 'react';
import {useRecordById} from '@airtable/blocks/ui';
import Frame, {FrameContextConsumer} from 'react-frame-component';

import {ViewsContext} from './index';
import {sanitize} from './sanitize';

export const PageViewer = ({pageID}) => {
	let {pagesTable} = useContext(ViewsContext);
	let page = useRecordById(pagesTable, pageID);

	const style = {
    width: '100%',
    height: 'calc(50vh)',
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'auto',
    overflowWrap: 'break-word',
    border: '1px solid #ddd',
    borderRadius: '3px',
    borderImageWidth: 0
	};

	const initialContent = `
		<!DOCTYPE html><html>
		<head>
			<link href="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.2.0/skins/content/default/content.min.css" rel="stylesheet">
			<link href="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.2.0/skins/ui/oxide/content.min.css" rel="stylesheet">
			<style type="text/css">
			</style>
		</head>
		<body>
			<div id='htmlContent'></div>
		</body>
		</html>
	`;

	let content = sanitize(page.getCellValueAsString('Content'));

	return (
		<Fragment>
			<Frame style={style} initialContent={initialContent}>
				<FrameContextConsumer>
				{
					({document}) => {
						document.getElementById('htmlContent').innerHTML = content;
					}
				}
				</FrameContextConsumer>
			</Frame>
		</Fragment>
	)
}
