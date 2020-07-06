import React, {createContext, useContext, useEffect, useRef, useState, Fragment} from 'react';
import {cursor} from '@airtable/blocks';
import {
	initializeBlock,
	useBase,
	useRecordById,
	useRecords,
	Box,
	Button,
	colorUtils,
	colors,
	ConfirmationDialog,
	Heading,
	Input,
	Select,
	Text,
	TextButton,
	Tooltip,
	useViewport,
	useLoadable,
	useWatchable,
	loadScriptFromURLAsync,
	loadCSSFromString} from '@airtable/blocks/ui';

import {PageComments} from './PageComments';
import {PageList} from './PageList';
import {QuestionCenter} from './QuestionCenter';
import {ToolbarTooltip} from './ToolbarTooltip';
import {UnverifiedPagesList} from './UnverifiedPagesList';
import {PageEditor} from './PageEditor';
import {PageViewer} from './PageViewer';
import {PageVerificationDialog} from './PageVerificationDialog';
import {sanitize} from './sanitize';

import Frame, {FrameContextConsumer} from 'react-frame-component';
import {Editor} from '@tinymce/tinymce-react';
import copy from 'copy-to-clipboard';
import Dragula from 'react-dragula';

import {
    Accordion,
    AccordionItem,
    AccordionItemHeading,
    AccordionItemButton,
    AccordionItemPanel,
} from 'react-accessible-accordion';

export const ViewsContext = createContext();
export const ActionsContext = createContext();
const localStorage = window.localStorage;

function KnowledgeBlock() {
  const viewport = useViewport();
  
  let storedDetailMode = localStorage.getItem('KNOWLEDGE_BLOCK_DETAIL_MODE') || 'list.comments';

  let storedSelectedPageID = localStorage.getItem('KNOWLEDGE_BLOCK_SELECTED_PAGE_ID');
  if (storedSelectedPageID === 'null' || storedSelectedPageID === 'undefined') {
		localStorage.removeItem('KNOWLEDGE_BLOCK_SELECTED_PAGE_ID');
		storedSelectedPageID = null;
  }

  const [detailMode, setDetailMode] = useState(storedDetailMode);
	const [showComments, setShowComments] = useState(false);
  const [selectedPageID, setSelectedPageID] = useState(storedSelectedPageID);

  const base = useBase();
  const collaborators = base.activeCollaborators;

  const organizersTable = base.getTableByNameIfExists('Organizers');

	const pagesTable = base.getTableByNameIfExists('Pages');
	const unVerifiedView = pagesTable.getViewByNameIfExists('Unverified');
	if (!unVerifiedView) {
		console.log('The view of unverified pages is missing.')
	}
	let pages = useRecords(pagesTable);
	let unVerifiedPages = useRecords(unVerifiedView);

	const onRecordSelected = () => {
		if (cursor.activeTableId !== pagesTable.id) {
			return
		}

		let newPageID = cursor.selectedRecordIds[0];
		setSelectedPageID(newPageID);
		localStorage.setItem('KNOWLEDGE_BLOCK_SELECTED_PAGE_ID', newPageID);
	}

	useLoadable(cursor);
	useWatchable(cursor, 'selectedRecordIds', onRecordSelected);

  useEffect(() => {
		if (!viewport.isFullscreen) {
	  	cursor.setActiveTable(pagesTable);
	  	setDetailMode('page');
	  }
  }, [viewport.isFullscreen]);
	
	const commentsTable = base.getTableByNameIfExists('Comments');

  const recentCommentsView = commentsTable.getViewByNameIfExists('Past Week');
  if (!recentCommentsView) {
		console.log('The view of recent comments is missing.')
	}

	const unansweredView = commentsTable.getViewByNameIfExists('Unanswered Questions');
	if (!unansweredView) {
		console.log('The view of unanswered comments is missing.')
	}

	const views = {
		pagesTable,
		organizersTable,
		commentsTable,
		recentCommentsView,
		unVerifiedView,
		unansweredView,
	};

	const handlePageUpdated = debounce((updates, pageID=null) => {
		if (pageID) {
			pagesTable.updateRecordAsync(pageID, updates);
		} else if (selectedPageID) {
			pagesTable.updateRecordAsync(selectedPageID, updates);
		}
	}, 500);

	const handlePageClicked = (pageID) => {
		setSelectedPageID(pageID);
		setDetailMode('page');
		localStorage.setItem('KNOWLEDGE_BLOCK_SELECTED_PAGE_ID', pageID);
		localStorage.setItem('KNOWLEDGE_BLOCK_DETAIL_MODE', 'page');
	}

	const addOrganizer = async (parentCategory, title='New Organizer') => {
		let fields = {
			'Title': title,
			'Is Top-level': parentCategory ? false : true,
		};

		let newOrganizerID = await organizersTable.createRecordAsync(fields);

		if (parentCategory) {
			let children = parentCategory.getCellValue('Child Organizers') || [];
			organizersTable.updateRecordAsync(parentCategory, {
				'Child Organizers': [...children, {id: newOrganizerID}],
			})
		}
	};

	const updateOrganizer = (organizer, fields, organizerID=null) => {
		if (organizerID) {
			organizersTable.updateRecordAsync(organizerID, fields);
		} else {
			organizersTable.updateRecordAsync(organizer, fields);
		}
	}

	const addPage = async (parentCategory, title='New Page', content='<p>Hello, World!</p>') => {
		let newPageID = await pagesTable.createRecordAsync({
			'Title': title,
			'Content': content,
			'Organizer': parentCategory ? [{id: parentCategory.id}] : null,
		});
		setSelectedPageID(newPageID);
	};

	const addComment = async (fields) => {
		let newCommentID = await commentsTable.createRecordAsync(fields);
		return newCommentID;
	};

	const updateComment = (commentID, fields) => {
		commentsTable.updateRecordAsync(commentID, fields);
	}

	const toggleComments = () => {
		setShowComments(!showComments);
	}

	const setNextVerificationDate = (page, date) => {
		pagesTable.updateRecordAsync(page, {'Next Verification': date})
	}

	const setNextVerificationDateRelativeToToday = (page, offset) => {
		let today = new Date();
		let newDay = new Date(today.setDate(today.getDate() + offset));
		pagesTable.updateRecordAsync(page, {'Next Verification': formatDate(newDay)});
	}

	const setLatestVerificationToToday = (page) => {
		let today = new Date();
		pagesTable.updateRecordAsync(page, {'Latest Verification': formatDate(today)});
	}

	const setNextVerifier = (page, collaborator) => {
		let collaboratorObject = collaborator ? {id: collaborator} : null;
		pagesTable.updateRecordAsync(page, {'Next Verifier': collaboratorObject})
	}

	const formatDate = (date) => {
		let yyyy = date.getFullYear();
		let mm = date.getMonth() + 1;
		let dd = date.getDate();
		mm = mm.toString().padStart(2, '0');
		dd = dd.toString().padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	const actions = {
		addOrganizer,
		addPage,
		addComment,
		updateComment,
		showComments,
		toggleComments,
		setNextVerificationDateRelativeToToday,
		setNextVerificationDate,
		setLatestVerificationToToday,
		setNextVerifier,
		handlePageClicked,
		updateOrganizer,
		collaborators
	};

  return (
  	<ViewsContext.Provider value={views}>
	  	<ActionsContext.Provider value={actions}>
		  	<Box display="flex" height="100vh">
		    	{
		    		viewport.isFullscreen &&
			    	<Overview
							pagesTable={pagesTable}
							organizersTable={organizersTable}
							setDetailMode={setDetailMode}
							handlePageClicked={handlePageClicked}
							handlePageUpdated={handlePageUpdated}
			    	/>
		    	}
		    	<Detail
		    		detailMode={detailMode}
		    		setDetailMode={setDetailMode}
		    		pagesTable={pagesTable}
		    		selectedPageID={selectedPageID}
		    		setSelectedPageID={setSelectedPageID}
		    		handlePageUpdated={handlePageUpdated}
		    		handlePageClicked={handlePageClicked}
		    	/>
		  	</Box>
	  	</ActionsContext.Provider>
  	</ViewsContext.Provider>
  );
}

// Debounce saving page updates to Airtable prevent the cursor from jumping to the top
// https://davidwalsh.name/javascript-debounce-function
// https://gist.github.com/nmsdvid/8807205#gistcomment-2318343
function debounce (callback, time) {
  let interval;
  return (...args) => {
    clearTimeout(interval);
    interval = setTimeout(() => {
      interval = null;
      callback(...args);
    }, time);
  };
}

function Overview({pagesTable, organizersTable, setDetailMode, handlePageClicked, handlePageUpdated}) {
  let [showTopButtonBar, setShowTopButtonBar] = useState(false);

	const actions = useContext(ActionsContext);
  const views = useContext(ViewsContext);


  let unVerifiedPages = useRecords(views.unVerifiedView);
  let unansweredQuestions = useRecords(views.unansweredView);

  // Get and render the top-level pages and organizers
	const topLevelPagesView = pagesTable.getViewByNameIfExists('Top-level Pages');
	let topLevelPages = useRecords(topLevelPagesView);

  const topLevelView = organizersTable.getViewByNameIfExists('Top-level Organizers');
	if (!topLevelView) {
		return (<Box>The view of top-level organizers is missing</Box>);
	}
	let topLevelOrganizers = useRecords(topLevelView);

	let storedExpandedOrganizers = localStorage.getItem('KNOWLEDGE_BLOCK_EXPANDED_ORGANIZERS');
	if (storedExpandedOrganizers) {
		storedExpandedOrganizers = storedExpandedOrganizers.split(',');
	} else {
		storedExpandedOrganizers = [];
	}
	
	const [expandedOrganizers, updateExpandedOrganizers] = useState(storedExpandedOrganizers);
	
	const handleAccordionChanged = (expandedOrganizers) => {
		updateExpandedOrganizers(expandedOrganizers);
		localStorage.setItem('KNOWLEDGE_BLOCK_EXPANDED_ORGANIZERS', expandedOrganizers);
	};

	const handleUnverifiedListButtonClicked = () => {
		setDetailMode('list.unverifieds');
		localStorage.setItem('KNOWLEDGE_BLOCK_DETAIL_MODE', 'list.unverifieds');
	};

	const handleCommentsListButtonClicked = () => {
		setDetailMode('list.comments');
		localStorage.setItem('KNOWLEDGE_BLOCK_DETAIL_MODE', 'list.comments');
	};

	const style = {
		flexBasis: '300px',
		display: 'flex',
		flexDirection: 'column',
		overflowY: 'scroll',
		padding: '8px',
		borderRight: '1px solid gray',
		lineHeight: '28px',
  };

  const handleDrop = (el, target, source, sibling) => {
  	handlePageClicked(el.id);
  	// store an order for each page, defaulting to 0
  	// when rendering pages, use order={order}

  	// see if the target and source elements are different
  	// if they are, update the page's organizer

  	// get all children in the target element
  	// for each (child, index) in children:
  	// set the child's Order to be the index
  	target.children.forEach((page, index) => {
  		let updates = {
  			'Order': index,
  		}

  		if (page.id === el.id && target.id !== source.id) {
				console.log('updating organizer');
				updates['Organizer'] = [{id: target.id}];
	  	}

	  	if (page.id) {
				handlePageUpdated(updates, page.id)
	  	}
  	});
  }

  const handleDropOrganizer = (el, target, source, sibling) => {
  	target.children.forEach((child, index) => {
			actions.updateOrganizer(null, {'Order': index}, child.id);

	  	// TODO:
  		// If an organizer is dragged into another organizer,
  		// update the latter organizer's child organizers.
  		// if (organizer.id === el.id && target.id !== source.id) {
				// updates['Organizer'] = [{id: target.id}];
	  	// }
  	});
  }

	const myDrake = Dragula();
	myDrake.on('drop', handleDrop);

	// const myOrganizersDrake = Dragula([], {
	// 	moves: (el, source, handle, sibling) => {
	// 		console.log(el.className);
	// 		return el.className === 'accordion__heading';
	// 	}
	// });
	// myOrganizersDrake.on('drop', handleDropOrganizer);
	
  const [drake, setDrake] = useState(myDrake);
  // const [organizersDrake, setOrganizersDrake] = useState(myOrganizersDrake);

	const topLevelPagesListRef = useRef();
	const topLevelOrganizersListRef = useRef();

	useEffect(() => {
		if (myDrake) {
			myDrake.containers.push(topLevelPagesListRef.current);
		}
	}, [topLevelPagesListRef]);

	// useEffect(() => {
	// 	if (myOrganizersDrake) {
	// 		myOrganizersDrake.containers.push(topLevelOrganizersListRef.current);
	// 	}
	// }, [topLevelOrganizersListRef]);

	const dragulaCSS = `
	.gu-mirror,
	li.gu-mirror {
		position: fixed !important;
		margin: 0 !important;
		z-index: 9999 !important;
		opacity: 0.8;
		-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=80)";
		filter: alpha(opacity=80);
	}
	.gu-hide {
		display: none !important;
	}
	.gu-unselectable {
		-webkit-user-select: none !important;
		-moz-user-select: none !important;
		-ms-user-select: none !important;
		user-select: none !important;
	}
	.gu-transit,
	li.gu-transit {
		opacity: 0.2;
		-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=20)";
		filter: alpha(opacity=20);
	}
	li.gu-mirror {
		list-style: none;
	}
	`;
	loadCSSFromString(dragulaCSS);

	return (
		<Box style={style}>
			<Heading>Activity</Heading>

			<Heading size="xsmall" tabIndex={-1}>
				<TextButton variant="dark" size="large" onClick={handleUnverifiedListButtonClicked}>
					Pages to Review ({unVerifiedPages.length})
				</TextButton>
			</Heading>

			<Heading size="xsmall" tabIndex={-1}>
				<TextButton variant="dark" size="large" onClick={handleCommentsListButtonClicked}>
					Questions ({unansweredQuestions.length})
				</TextButton>
			</Heading>

			<Box
				display="flex"
				alignItems="baseline"
				justifyContent="space-between"

				onMouseEnter={() => {setShowTopButtonBar(true)}}
				onMouseLeave={() => setShowTopButtonBar(false)}
			>
			<Heading marginTop={3} flex="4">
				Resources
			</Heading>
			{
				showTopButtonBar &&
				<OrganizerButtonBar organizer={null}/>
			}
			</Box>
			
			<Accordion
				allowZeroExpanded={true}
				allowMultipleExpanded={true}
				preExpanded={storedExpandedOrganizers}
				onChange={expandedOrganizers => handleAccordionChanged(expandedOrganizers)}
			>
				<ul
					ref={topLevelPagesListRef}
					className="page-list"
					style={{
						display: 'flex',
						flexDirection: 'column',
						paddingLeft: '12px',
						listStyle: 'none',
						margin: '0 0',
					}}
				>
					{
						topLevelPages.map(page => (
							<li
								id={page.id}
								key={page.id}
								style={{order: page.getCellValue('Order'), paddingLeft: '4px'}}
								onClick={() => handlePageClicked(page.id)}
							>
								<TextButton variant="dark" size="large">
									{page.name}
								</TextButton>
							</li>
						))
					}
				</ul>
				
				<ul
					style={{
						display: 'flex',
						flexDirection: 'column',
						paddingLeft: '12px',
						listStyle: 'none',
						margin: '0 0',
					}}
				>
					{
						topLevelOrganizers.map(organizer => (
					  	<li
					  		id={organizer.id}
					  		key={organizer.id}
					  		style={{order: organizer.getCellValue('Order')}}
					  	>
						  	<Organizer
						  		organizer={organizer}
						  		setDetailMode={setDetailMode}
						  		expandedOrganizers={expandedOrganizers}
						  		handlePageClicked={handlePageClicked}
						  		drake={drake}
						  	/>
					  	</li>
		  			))}
	  		</ul>
  		</Accordion>
	  </Box>
	);
}

function Organizer({organizer, setDetailMode, expandedOrganizers, handlePageClicked, drake}) {
	let organizerExpanded = expandedOrganizers.includes(organizer.id);

	let pagesQuery = organizer.selectLinkedRecordsFromCell('Pages');
	let pages = useRecords(pagesQuery);

	let childOrganizersQuery = organizer.selectLinkedRecordsFromCell('Child Organizers');
	let childOrganizers = useRecords(childOrganizersQuery);

	const pageListRef = useRef();

	useEffect(() => {
		if (drake) {
			drake.containers.push(pageListRef.current);
		}
	}, [pageListRef]);

	return (
		<AccordionItem uuid={organizer.id} className="organizer">
			<OrganizerHeading
				organizer={organizer}
				organizerExpanded={organizerExpanded}
			/>
			<AccordionItemPanel>
				<ul
					id={organizer.id}
					ref={pageListRef}
					className="page-list"
					style={{
						display: 'flex',
						flexDirection: 'column',
						paddingLeft: '27px',
						listStyle: 'none',
						margin: '0 0',
					}}
				>
					{pages.map(page => (
						<li
							id={page.id}
							key={page.id}
							style={{order: page.getCellValue('Order'), paddingLeft: '4px'}}
							onClick={() => handlePageClicked(page.id)}
						>
							<TextButton variant="dark" size="large">
								{page.name}
							</TextButton>
						</li>
					))}
				</ul>

				<ul style={{paddingLeft: '12px', margin: '0 0'}}>
					{childOrganizers.map(child => (
						<Organizer
							key={child.id}
							organizer={child}
							expandedOrganizers={expandedOrganizers}
							handlePageClicked={handlePageClicked}
							drake={drake}
						/>
					))}
				</ul>
			</AccordionItemPanel>
		</AccordionItem>
	)
}

function OrganizerHeading({organizer, organizerExpanded}) {
	const actions = useContext(ActionsContext);
	const [showButtonBar, setShowButtonBar] = useState(false);
	const [organizerTitle, setOrganizerTitle] = useState(organizer.getCellValueAsString('Title'));
	const [showOrganizerNameInput, setShowOrganizerNameInput] = useState(false);

	const handleOrganizerTitleChanged = (newTitle) => {
		setOrganizerTitle(newTitle);
	}

	const handleOrganizerTitleSaved = () => {
		actions.updateOrganizer(organizer, {'Title': organizerTitle});
		setShowOrganizerNameInput(false);
	}

	const organizerHeadingCSS = `
	.accordion-item-button {
		height: 32px;
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
	}
	`
	loadCSSFromString(organizerHeadingCSS);

	if (showOrganizerNameInput) {
		return (
			<Box display="flex">
				<Input
					type="text"
					placeholder="Add a name"
					marginRight={1}
					value={organizerTitle}
					onChange={(event) => handleOrganizerTitleChanged(event.target.value)}
					autoFocus={true}
				/>
				<Button
					icon="check"
					variant="primary"
					aria-label="Save Organizer Name"
					onClick={handleOrganizerTitleSaved}
				/>
			</Box>
		)
	}

	return (
		<AccordionItemHeading
			onMouseEnter={() => setShowButtonBar(true)}
			onMouseLeave={() => setShowButtonBar(false)}
		>		
			<AccordionItemButton className="accordion-item-button">
				<Heading size="xsmall" tabIndex={-1} minWidth="0" flex="1">
					<TextButton variant="dark" size="large" className="organizer-button" tabIndex={-1}>
						{organizerExpanded ? '📖' : '📘'} {organizerTitle}
					</TextButton>
				</Heading>
				{
					showButtonBar &&
					<OrganizerButtonBar
						organizer={organizer}
						setShowOrganizerNameInput={setShowOrganizerNameInput}
					/>
				}
			</AccordionItemButton>
		</AccordionItemHeading>
	)
}

function OrganizerButtonBar({organizer, setShowOrganizerNameInput}) {
	const actions = useContext(ActionsContext);
	const views = useContext(ViewsContext);

	return (
		<Box flexShrink="0">
			{
				organizer &&
				<ToolbarTooltip content="Rename">
					<Button
						onClick={(event) => {
							event.stopPropagation();
							setShowOrganizerNameInput(true);
						}}
						icon="edit"
						size="small"
						variant="secondary"
						aria-label="Rename Organizer"
						disabled={!views.organizersTable.hasPermissionToUpdateRecord()}
					/>
				</ToolbarTooltip>
			}

			<ToolbarTooltip content="Add Organizer">
				<Button
					onClick={(event) => {
						event.stopPropagation();
						actions.addOrganizer(organizer);
					}}
					icon="gantt"
					size="small"
					variant="secondary"
					aria-label="Add Organizer"
					disabled={!views.organizersTable.hasPermissionToCreateRecord()}
				/>
			</ToolbarTooltip>

			<ToolbarTooltip content="Add Page">
				<Button
					onClick={(event) => {
						event.stopPropagation();
						actions.addPage(organizer);
					}}
					icon="file"
					size="small"
					variant="secondary"
					aria-label="Add Page"
					disabled={!views.pagesTable.hasPermissionToCreateRecord()}
				/>
				</ToolbarTooltip>
		</Box>
	)
}

function Detail({detailMode, setDetailMode, pagesTable, selectedPageID, setSelectedPageID, handlePageUpdated, handlePageClicked}) {
  const viewport = useViewport();
  const actions = useContext(ActionsContext);
  let { recentCommentsView, unansweredView, unVerifiedView } = useContext(ViewsContext);

	let pages = useRecords(pagesTable);

  function handleFullscreenClicked() {
		let firstPageID = pages[0].id;
		setSelectedPageID(firstPageID);
  	viewport.enterFullscreenIfPossible();
  }

  const style = {
		flex: 5,
		padding: '8px',
		display: 'flex',
		flexDirection: 'column',
  };

  const pageStyle = {
		flex: 5,
		padding: '8px',
		display: 'flex',
  };

  const renderQuestions = () => (<QuestionCenter view={unansweredView} handlePageClicked={() => console.log('click')} style={style}/>);
  const renderUnverifieds = () => (<UnverifiedPagesList view={unVerifiedView} handlePageClicked={handlePageClicked} style={style}/>);
  const renderPage = () => {
  	if (!selectedPageID) {
  		if (viewport.isFullscreen) {
  			return (
  			  <Box style={pageStyle} flexDirection="column" alignItems="center" justifyContent="center">
  			  	<Text justifyContent="center">Select a Pages record to see the page.</Text>
			  	</Box>
  			);
  		}

  		return (
  			<Box style={pageStyle} flexDirection="column" alignItems="center" justifyContent="center">
			  	<Text>Select a Pages record to see the page, or make this block fullscreen to do more.</Text>
			  	<br/>
  				<TextButton onClick={handleFullscreenClicked}>
  					Go fullscreen
  				</TextButton>
  			</Box>
  		);
  	}

  	return (
			<Box style={pageStyle}>
				<Box flex={2} display="flex" flexDirection="column">
					<DetailButtons
						pagesTable={pagesTable}
						selectedPageID={selectedPageID}
						setSelectedPageID={setSelectedPageID}
					/>

					{
						pagesTable.hasPermissionToUpdateRecord()
						? <PageEditor
							pagesTable={pagesTable}
							selectedPageID={selectedPageID}
							handlePageUpdated={handlePageUpdated}
						/>
						: <PageViewer pageID={selectedPageID}/>
					}

				</Box>
				{
					actions.showComments &&
					<Box flex={1}>
						<PageComments pagesTable={pagesTable} pageID={selectedPageID}/>
					</Box>
				}
			</Box>
		);
  };

  const detailModes = {
		'page': renderPage,
		'list.comments': renderQuestions,
		'list.unverifieds': renderUnverifieds,
  }

  return detailModes[detailMode]();
}

function DetailButtons({pagesTable, selectedPageID, setSelectedPageID}) {
	return (
		<Box display="flex">
			<DetailButtonVerified selectedPageID={selectedPageID} pagesTable={pagesTable}/>
			<DetailButtonCopyURL pagesTable={pagesTable} selectedPageID={selectedPageID}/>
			<DetailButtonOpenComments/>
			<DetailButtonDeletePage pagesTable={pagesTable} selectedPageID={selectedPageID} setSelectedPageID={setSelectedPageID}/>
		</Box>
	)
}

const tooltipStyle = `
.styled-tooltip {
	width: auto;
	padding: 8px;
	color: #040404;
	background-color: #eee;
}
`;
loadCSSFromString(tooltipStyle);

function DetailButtonCopyURL({pagesTable, selectedPageID}) {
	let selectedPage = useRecordById(pagesTable, selectedPageID)

	const handleCopyURLClicked = () => {
		copy(selectedPage.url);
	}

	return (
		<ToolbarTooltip content="Copy URL">
			<Button size="small" variant="secondary" icon="hyperlink" aria-label="Copy URL" onClick={handleCopyURLClicked}/>
		</ToolbarTooltip>
	)
}

function DetailButtonOpenComments() {
	const actions = useContext(ActionsContext);

	const handleToggleCommentsClicked = () => {
		actions.toggleComments();
	}

	return (
		<ToolbarTooltip content="Toggle Comments">
			<Button
				icon="chat"
				size="small"
				variant="secondary"
				aria-label="questions"
				onClick={handleToggleCommentsClicked}
			/>
		</ToolbarTooltip>
	)
}

function DetailButtonDeletePage({pagesTable, selectedPageID, setSelectedPageID}) {
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
	const views = useContext(ViewsContext);

	const handleDeletePageButtonClicked = () => {
		setIsConfirmationOpen(true);
	}

	const handleDeletePage = (page) => {
		setIsConfirmationOpen(false);
		setSelectedPageID(null);
		localStorage.removeItem('KNOWLEDGE_BLOCK_SELECTED_PAGE_ID');
		pagesTable.deleteRecordAsync(page);
	}

	return (
		<Fragment>
			<ToolbarTooltip content="Delete Page">
				<Button
					icon="trash"
					size="small"
					aria-label="Delete Page"
					style={{color:'red', backgroundColor:'white'}}
					onClick={handleDeletePageButtonClicked}
					disabled={!views.pagesTable.hasPermissionToDeleteRecord()}
				/>
			</ToolbarTooltip>

			{
				isConfirmationOpen && (
					<ConfirmationDialog
						title="Do you really want to delete this page?"
						body="There's no way to undo this action for now."
						onConfirm={() => handleDeletePage(selectedPageID)}
						onCancel={() => setIsConfirmationOpen(false)}
						isConfirmActionDangerous={true}
					/>
				)
			}
		</Fragment>
	)
}

function DetailButtonVerified({selectedPageID, pagesTable}) {
	const actions = useContext(ActionsContext);
	const views = useContext(ViewsContext);

	const [showDialog, setShowDialog] = useState(false);

	let page = useRecordById(pagesTable, selectedPageID);
	let isVerified = page.getCellValue('Is Verified');

	let backgroundColor = isVerified ? '#20c933' : '#f82b60';
	let buttonStyle = {
		color: '#ffffff',
		backgroundColor: backgroundColor,
	};

	const handleIsVerifiedToggled = () => {
		// If the page is verified, unverify it by setting
		// the next verification date to the past.
		if (isVerified) {
			actions.setNextVerificationDateRelativeToToday(page, -1);
		}

		// Otherwise, set the latest verification date to day,
		// and set the next verificate date to the given date.
		else {
			setShowDialog(true);
		}
	}

	const setLatestVerificationToToday = (page) => {
		let today = new Date();
		pagesTable.updateRecordAsync(page, {'Latest Verification': formatDate(today)});
	}

	return (
		<Fragment>
			<ToolbarTooltip content={() => (<VerifiedTooltipContent page={page}/>)}>
				<Button
					size="small"
					icon="checkboxChecked"
					aria-label="Verified"
					style={buttonStyle}
					onClick={handleIsVerifiedToggled}
					disabled={!views.pagesTable.hasPermissionToUpdateRecord()}
				>
					{
						isVerified
						? 'Verified'
						: 'Unverified'
					}
				</Button>
			</ToolbarTooltip>

			{
				showDialog &&
				<PageVerificationDialog
					pageID={selectedPageID}
					setShowDialog={setShowDialog}
				/>
			}
		</Fragment>
	)
}

function VerifiedTooltipContent({page}) {
	let isVerified = page.getCellValue("Is Verified");

	if (isVerified) {
		let latestVerifier = page.getCellValueAsString("Latest Verifier") || 'Mysterious Reviewer X';
		let latestVerification = page.getCellValueAsString("Latest Verification");
		let nextVerification = page.getCellValueAsString("Next Verification");

		return (
			<Fragment>
				{`Verified by ${latestVerifier} on ${latestVerification}`}
				<br/>
				{`Verify again after ${nextVerification}`}
			</Fragment>
		)
	} else {
		return (
			<Fragment>
				{'Not verified. Click to verify.'}
			</Fragment>
		)
	}
}

initializeBlock(() => <KnowledgeBlock />);
