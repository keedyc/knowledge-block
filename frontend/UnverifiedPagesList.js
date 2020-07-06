import React, {useContext, useState, Fragment} from 'react';

import {Box, SelectButtons, useRecords} from '@airtable/blocks/ui';
import {session} from '@airtable/blocks';

import {PageList} from './PageList';
import {PagePreviewDialog} from './PagePreviewDialog';
import {PageVerificationDialog} from './PageVerificationDialog';

export const UnverifiedPagesList = ({view, handlePageClicked, style}) => {
	let records = useRecords(view);
	let myRecords = records.filter(record => {
		let nextVerifier = record.getCellValue('Next Verifier');
		return (nextVerifier && nextVerifier.id === session.currentUser.id);
	});

	const filters = {
		all: records,
		mine: myRecords,
	};

	const options = [
		{
			value: 'all',
			label: `All (${records.length})`
		},
		{
			value: 'mine',
			label: `For Me (${myRecords.length})`
		},
	];
	let [value, setValue] = useState(options[0].value);

	let [showPreviewDialog, setShowPreviewDialog] = useState(false);
	let [showVerifyDialog, setShowVerifyDialog] = useState(false);
	let [selectedRecordID, setSelectedRecordID] = useState();

	const handleUnverifiedPageClicked = (page) => {
		setSelectedRecordID(page.id);
		setShowPreviewDialog(true);
	}

	const handleConfirmPreview = () => {
		setShowPreviewDialog(false);
		setShowVerifyDialog(true);
	}

	const handleCancelPreview = () => {
		setShowPreviewDialog(false);
	}

	return (
		<Box style={style}>
			<Box>
				<SelectButtons
					value={value}
					options={options}
					onChange={newValue => setValue(newValue)}
					maxWidth={300}
				/>
			</Box>

			<PageList
				view={view}
				records={filters[value]}
				onClick={handleUnverifiedPageClicked}
			/>

			{
				showPreviewDialog &&
				<PagePreviewDialog
					pageID={selectedRecordID}
					setShowDialog={setShowPreviewDialog}
					handleConfirmPreview={handleConfirmPreview}
					handleCancelPreview={handleCancelPreview}
					handlePageClicked={handlePageClicked}
				/>
			}

			{
				showVerifyDialog &&
				<PageVerificationDialog
					pageID={selectedRecordID}
					setShowDialog={setShowVerifyDialog}
				/>
			}
		</Box>
	)
}
