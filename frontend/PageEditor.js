import React, {useEffect, useState} from 'react';
import {Editor} from '@tinymce/tinymce-react';
import {sanitize} from './sanitize';
import {
	Box,
	Heading,
	Loader,
	loadCSSFromString,
	loadScriptFromURLAsync,
	useRecordById,
} from '@airtable/blocks/ui';

const LoadingSpinner = () => {
	// Set backgroundColor and zIndex so it overlaps tinymce until it's initialized.
	return (
		<Box
			backgroundColor='white'
			zIndex='2'
			position='fixed'
			display='flex'
			justifyContent='center'
			alignItems='center'
			height='calc(100vh - 24px)'
			width='100vw'
			top='0'
		>
		<Loader />
	</Box>
	)
}

// Load the tinymce script only after the editor is first called.
// If it's never called, there's no need to load it.
let editorScriptLoaded = false;

const EditorLoadingState = Object.freeze ({
	NotLoaded: 'NotLoaded',
	Loading: 'Loading',
	Loaded: 'Loaded',
	Initialized: 'Initialized'
});

export const PageEditor = ({pagesTable, selectedPageID, handlePageUpdated}) => {
	let intitialEditorLoadingState = EditorLoadingState.NotLoaded;
	if (editorScriptLoaded === true) {
		intitialEditorLoadingState = EditorLoadingState.Loaded;
	}

	const [editorLoadingState, setEditorLoadingState] = useState(intitialEditorLoadingState);
	const tinymce_url = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.2.0/tinymce.min.js';

	if (editorLoadingState === EditorLoadingState.NotLoaded) {
		setEditorLoadingState(EditorLoadingState.Loading);
		loadScriptFromURLAsync(tinymce_url).then(() => {
			editorScriptLoaded = true;
			setEditorLoadingState(EditorLoadingState.Loaded);
		});
	}

	const handleInit = () => {
		setEditorLoadingState(EditorLoadingState.Initialized);
		return;
  };

	const handleEditorChange = (content, editor) => {
		let sanitizedContent = sanitize(content);

		handlePageUpdated({
			'Content': sanitizedContent,
			'Content as Text': editor.getContent({format: 'text'}),
		});
		return;
	};

	let selectedPage = useRecordById(pagesTable, selectedPageID);
	const [pageTitle, setPageTitle] = useState(selectedPage.name || 'Add a title');

	useEffect(() => {
		setPageTitle(selectedPage.name);
	}, [selectedPage]);

	const handleTitleChanged = (title) => {
		setPageTitle(title);
		handlePageUpdated({
			'Title': title,
		});
	}

	// const toolbar = 'read | undo redo | formatselect removeformat | bold italic underline | forecolor backcolor | image media | link hr | alignleft aligncenter alignright | bullist numlist | outdent indent | codesample | toc | fullscreen print help';
	const plugins = 'advlist anchor autolink codesample emoticons fullscreen help hr image link lists media paste print quickbars searchreplace table textpattern toc visualblocks';

	const init = {
    height: 'calc(100vh - 24px)',
    plugins: plugins,
    // toolbar: toolbar,
    toolbar: false,
    menubar: false,
    inline: true,
    // quickbars_insert_toolbar: false,
    quickbars_selection_toolbar: 'bold italic underline | bullist numlist | h1 h2 h3',
    statusbar: false,
    branding: false,
    default_link_target: '_blank',
    target_list: true, // Will not display the target list.
		valid_elements: '*[*]',
		// Setting entity_encoding to 'raw' prevents this bug by
		// making the editor use a single space instead of ;nbsp:
		//  1. Type some text in the page editor.
		//  2. Type a space at the end of the text. It'll become an ;nbsp.
		//  3. Wait a split-second for the change to be saved.
		//  4. sanitize-html turns ;nbsp into a single space.
		//  5. The converted text is saved to the base.
		//  6. The page editor's content re-renders.
		//  7. The cursor jumps to the top of the editor.
		entity_encoding: 'raw',
	};

	let content = selectedPage
		?	sanitize(selectedPage.getCellValueAsString('Content'))
		: 'No page selected';

	if (!editorScriptLoaded) {
		return <LoadingSpinner />;
	}

	const style = {
		padding: '0 10px',
	}

	let css = `
	.mce-edit-focus,
	.page-title-input:focus {
		outline: none;
	}
	.mce-content-body,
	.mce-edit-focus {
		font-size: 14px;
		overflow: scroll;
		max-height: calc(100vh - 130px);
	}
	`

	loadCSSFromString(css);

	return (
		<Box style={style} as='main' overflow='hidden' top='0'>
		{	/*
			When using Tiny MCE as a controlled component in React, use onEditorChange instead of onChange.
			This stops the cursor from going to the top of the editor when you hit the enter key.
			https://www.tiny.cloud/docs/integrations/react/#usingthetinymcereactcomponentasacontrolledcomponent
			*/
		}
			<input
				value={pageTitle}
				placeholder="Add a title"
				onChange={(event) => handleTitleChanged(event.target.value)}
				className="page-title-input"
				// Mimic the styling for <Heading size="xlarge"> from Airtable's SDK
				style={{
					width: '100%',
					border: 'none',
					fontSize: '27px',
					fontWeight: '500',
					lineHeight: '34px',
					marginTop: '16px',
					marginBottom: '16px',
					padding: '0',
					fontFamily: "-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'",
					color: 'hsl(0,0%,20%)',
				}}
			/>

			<Editor
				style={style}
				value={content}
				init={init}
				onInit={handleInit}
				onEditorChange={handleEditorChange}
			/>
		</Box>
	)
}
