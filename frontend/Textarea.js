import React from 'react';
import {loadCSSFromString} from '@airtable/blocks/ui';

export const Textarea = ({onChange}) => {
	const textareaCSS = `
	textarea {
		font-size: 13px;
		height: 70px;
		width: 100%;
		line-height: 21px;
		padding-left: 10px;
		padding-right: 10px;
		box-sizing: border-box;
		font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		font-weight: 400;
		-webkit-appearance: none;
		color: rgb(51, 51, 51);
		background-color: rgb(242, 242, 242);
		border-radius: 3px;
		outline: none;
		border-width: initial;
		border-style: none;
		border-color: initial;
		border-image: initial;
	}

	::-webkit-resizer {
		display: none;
	}
	`
	loadCSSFromString(textareaCSS);

	return (
		<textarea onChange={onChange}/>
	)
}
